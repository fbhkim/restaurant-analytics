import psycopg2
import random
from datetime import datetime, timedelta
from faker import Faker
import json

fake = Faker('pt_BR')

DATABASE_CONFIG = {
    'host': 'postgres',
    'database': 'restaurant_analytics',
    'user': 'postgres',
    'password': 'postgres',
    'port': 5432
}

def connect_db():
    return psycopg2.connect(**DATABASE_CONFIG)

def generate_customers(conn, num_customers=10000):
    cursor = conn.cursor()
    
    customers = []
    for _ in range(num_customers):
        name = fake.name()
        email = fake.email()
        phone = fake.phone_number()
        address = fake.address()
        city = fake.city()
        state = fake.state_abbr()
        postal_code = fake.postcode()
        
        lat = random.uniform(-23.7, -23.4)
        lng = random.uniform(-46.8, -46.4)
        
        first_order_date = fake.date_time_between(start_date='-6M', end_date='now')
        
        customers.append((
            name, email, phone, address, city, state, postal_code,
            lat, lng
        ))
    
    cursor.executemany("""
        INSERT INTO customers (name, email, phone, address, city, state, postal_code, latitude, longitude)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, customers)
    
    conn.commit()
    print(f"Gerados {num_customers} clientes")

def generate_orders(conn, num_orders=500000):
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM stores")
    store_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT id FROM customers")
    customer_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT id FROM coupons")
    coupon_ids = [row[0] for row in cursor.fetchall()]
    
    channels = ['presencial', 'ifood', 'rappi', 'uber_eats', 'delivery', 'whatsapp']
    statuses = ['delivered', 'cancelled']
    status_weights = [0.95, 0.05]
    
    # Distribuição baseada na Arcca: 40% presencial, 30% iFood, 15% Rappi
    channel_weights = [0.40, 0.30, 0.15, 0.08, 0.05, 0.02]
    
    orders = []
    
    start_date = datetime.now() - timedelta(days=180)
    
    for i in range(num_orders):
        # Data aleatória nos últimos 6 meses com padrões realistas
        days_ago = random.randint(0, 179)
        base_date = start_date + timedelta(days=days_ago)
        
        # Padrões semanais (baseado na documentação Arcca)
        weekday = base_date.weekday()  # 0=segunda, 6=domingo
        weekday_multipliers = {
            0: 0.8,   # Segunda: -20%
            1: 0.9,   # Terça: -10%
            2: 0.95,  # Quarta: -5%
            3: 1.0,   # Quinta: baseline
            4: 1.3,   # Sexta: +30%
            5: 1.5,   # Sábado: +50%
            6: 1.4    # Domingo: +40%
        }
        
        # Pular alguns pedidos baseado no dia da semana
        if random.random() > weekday_multipliers[weekday]:
            continue
            
        hour_weights = [
            0.02, 0.02, 0.02, 0.02, 0.02, 0.02,
            0.08, 0.08, 0.08, 0.08, 0.08,
            0.35, 0.35, 0.35, 0.35,
            0.10, 0.10, 0.10, 0.10,
            0.40, 0.40, 0.40, 0.40,
            0.05
        ]
        
        hour = random.choices(range(24), weights=hour_weights)[0]
        order_date = base_date.replace(
            hour=hour,
            minute=random.randint(0, 59),
            second=random.randint(0, 59)
        )
        
        store_id = random.choice(store_ids)
        customer_id = random.choice(customer_ids)
        channel = random.choices(channels, weights=channel_weights)[0]
        status = random.choices(statuses, weights=status_weights)[0]
        
        delivery_time_minutes = None
        if channel in ['delivery', 'ifood', 'uber_eats', 'rappi'] and status == 'delivered':
            delivery_time_minutes = random.randint(20, 90)
        
        # Tickets médios por canal baseados na Arcca
        if channel == 'presencial':
            subtotal = random.uniform(35, 65)
        elif channel == 'ifood':
            subtotal = random.uniform(55, 95)
        elif channel in ['rappi', 'uber_eats']:
            subtotal = random.uniform(50, 85)
        else:
            subtotal = random.uniform(40, 80)
        
        delivery_fee = 0
        if channel in ['delivery', 'ifood', 'uber_eats', 'rappi']:
            delivery_fee = random.uniform(3, 12)
        
        discount_amount = 0
        coupon_id = None
        if random.random() < 0.3:
            coupon_id = random.choice(coupon_ids)
            discount_amount = random.uniform(2, 15)
        
        tax_amount = subtotal * 0.1
        total_amount = subtotal + tax_amount + delivery_fee - discount_amount
        
        rating = None
        if status == 'delivered' and random.random() < 0.7:
            rating = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.05, 0.15, 0.35, 0.4])[0]
        
        # Coordenadas de entrega
        delivery_latitude = None
        delivery_longitude = None
        if channel in ['delivery', 'ifood', 'uber_eats', 'rappi']:
            delivery_latitude = random.uniform(-23.7, -23.4)
            delivery_longitude = random.uniform(-46.8, -46.4)
        
        orders.append((
            customer_id, store_id, order_date, status, channel,
            subtotal, tax_amount, delivery_fee, discount_amount,
            total_amount, delivery_time_minutes, rating, delivery_latitude, delivery_longitude,
            coupon_id
        ))
        
        # Gerar itens do pedido
        num_items = random.choices([1, 2, 3, 4], weights=[0.4, 0.35, 0.2, 0.05])[0]
        order_total = 0
        
        for _ in range(num_items):
            product_id = random.randint(1, 8)  # IDs dos produtos inseridos
            quantity = random.choices([1, 2, 3], weights=[0.7, 0.25, 0.05])[0]
            
            # Preços baseados nos produtos
            product_prices = {1: 25.90, 2: 29.90, 3: 35.90, 4: 38.90, 5: 5.90, 6: 8.90, 7: 12.90, 8: 22.90}
            unit_price = product_prices.get(product_id, 20.00)
            total_price = unit_price * quantity
            order_total += total_price
            
            # Customizações (30% chance)
            customizations = None
            if random.random() < 0.3:
                customizations = json.dumps({
                    "size": random.choice(["pequeno", "médio", "grande"]),
                    "extras": random.sample(["bacon", "queijo", "cebola", "tomate"], random.randint(0, 2))
                })
            
            # order_items serão gerados separadamente
        
        # Inserir em lotes de 1000
        if len(orders) >= 1000:
            cursor.executemany("""
                INSERT INTO orders (customer_id, store_id, order_date, status, channel,
                                  subtotal, tax_amount, delivery_fee, discount_amount,
                                  total_amount, delivery_time_minutes, rating, delivery_latitude, delivery_longitude,
                                  coupon_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, orders)
            
            conn.commit()
            orders = []
            print(f"Inseridos {i+1} pedidos...")
    
    # Inserir pedidos restantes
    if orders:
        cursor.executemany("""
            INSERT INTO orders (customer_id, store_id, order_date, status, channel,
                              subtotal, tax_amount, delivery_fee, discount_amount,
                              total_amount, delivery_time_minutes, rating, delivery_latitude, delivery_longitude,
                              coupon_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, orders)
        conn.commit()
    
    print(f"Gerados {num_orders} pedidos")

def generate_order_items(conn):
    """Gera itens de pedidos para todos os pedidos"""
    cursor = conn.cursor()
    
    print("   Buscando pedidos...")
    cursor.execute("SELECT id FROM orders")
    order_ids = [row[0] for row in cursor.fetchall()]
    
    print("   Buscando produtos...")
    cursor.execute("SELECT id, price FROM products")
    products = {row[0]: row[1] for row in cursor.fetchall()}
    
    order_items = []
    total_items = 0
    
    print(f"   Gerando itens para {len(order_ids)} pedidos...")
    
    for i, order_id in enumerate(order_ids):
        num_items = random.choices([1, 2, 3, 4], weights=[0.4, 0.35, 0.2, 0.05])[0]
        
        for _ in range(num_items):
            # Distribuição realista: 40% hambúrgueres, 30% pizzas, 20% acompanhamentos, 10% bebidas
            product_weights = {}
            for pid, price in products.items():
                if pid <= 5:
                    product_weights[pid] = 0.4
                elif pid <= 10:
                    product_weights[pid] = 0.3
                elif pid <= 14:
                    product_weights[pid] = 0.2
                else:
                    product_weights[pid] = 0.1
            
            total_weight = sum(product_weights.values())
            product_weights = {k: v/total_weight for k, v in product_weights.items()}
            
            product_id = random.choices(
                list(product_weights.keys()), 
                weights=list(product_weights.values())
            )[0]
            
            quantity = random.choices([1, 2, 3], weights=[0.7, 0.25, 0.05])[0]
            unit_price = float(products[product_id])
            
            customization_fee = 0.0
            if random.random() < 0.6:
                customization_fee = random.uniform(2.0, 8.0)
            
            total_price = (unit_price + customization_fee) * quantity
            
            order_items.append((order_id, product_id, quantity, unit_price, total_price))
            total_items += 1
            
        # Inserir em lotes de 5000
        if len(order_items) >= 5000:
            cursor.executemany("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                VALUES (%s, %s, %s, %s, %s)
            """, order_items)
            conn.commit()
            print(f"   Inseridos {total_items} itens...")
            order_items = []
        
        # Progresso a cada 10000 pedidos
        if (i + 1) % 10000 == 0:
            print(f"   Processados {i + 1}/{len(order_ids)} pedidos...")
    
    # Inserir itens restantes
    if order_items:
        cursor.executemany("""
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES (%s, %s, %s, %s, %s)
        """, order_items)
        conn.commit()
    
    print(f"   Gerados {total_items} itens para {len(order_ids)} pedidos")

def main():
    print("Iniciando geração de dados...")
    
    conn = connect_db()
    
    try:
        print("1. Gerando clientes...")
        generate_customers(conn, 10000)
        
        print("2. Gerando pedidos...")
        generate_orders(conn, 500000)
        
        print("3. Gerando itens de pedidos...")
        generate_order_items(conn)
        
        print("Geração de dados concluída com sucesso!")
        
    except Exception as e:
        print(f"Erro durante a geração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()