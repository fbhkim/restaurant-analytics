import psycopg2
import random
from datetime import datetime, timedelta
from faker import Faker
import json

fake = Faker('pt_BR')

# Configuração do banco
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
    """Gera clientes realistas"""
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
        
        # Coordenadas aproximadas de São Paulo
        lat = random.uniform(-23.7, -23.4)
        lng = random.uniform(-46.8, -46.4)
        
        first_order_date = fake.date_time_between(start_date='-6M', end_date='now')
        
        customers.append((
            name, email, phone, address, city, state, postal_code,
            f'POINT({lng} {lat})', first_order_date
        ))
    
    cursor.executemany("""
        INSERT INTO customers (name, email, phone, address, city, state, postal_code, location, first_order_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, ST_GeogFromText(%s), %s)
    """, customers)
    
    conn.commit()
    print(f"Gerados {num_customers} clientes")

def generate_orders(conn, num_orders=500000):
    """Gera pedidos realistas com padrões temporais"""
    cursor = conn.cursor()
    
    # Buscar IDs existentes
    cursor.execute("SELECT id FROM stores")
    store_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT id FROM customers")
    customer_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT id FROM coupons")
    coupon_ids = [row[0] for row in cursor.fetchall()]
    
    channels = ['dine_in', 'takeout', 'delivery', 'ifood', 'uber_eats', 'rappi']
    statuses = ['delivered', 'cancelled']
    status_weights = [0.85, 0.15]  # 85% entregues, 15% cancelados
    
    # Pesos por canal (iFood e Uber Eats são mais populares)
    channel_weights = [0.15, 0.15, 0.20, 0.25, 0.20, 0.05]
    
    orders = []
    order_items_batch = []
    
    start_date = datetime.now() - timedelta(days=180)
    
    for i in range(num_orders):
        # Padrões temporais realistas
        order_date = start_date + timedelta(
            days=random.randint(0, 180),
            hours=random.choices([11, 12, 13, 18, 19, 20, 21], weights=[0.1, 0.15, 0.15, 0.2, 0.2, 0.15, 0.05])[0],
            minutes=random.randint(0, 59)
        )
        
        store_id = random.choice(store_ids)
        customer_id = random.choice(customer_ids)
        order_number = f"ORD{i+1:06d}"
        channel = random.choices(channels, weights=channel_weights)[0]
        status = random.choices(statuses, weights=status_weights)[0]
        
        # Delivery apenas para canais de delivery
        delivery_date = None
        delivery_time_minutes = None
        preparation_time_minutes = random.randint(15, 45)
        
        if channel in ['delivery', 'ifood', 'uber_eats', 'rappi'] and status == 'delivered':
            delivery_time_minutes = random.randint(20, 90)
            delivery_date = order_date + timedelta(minutes=preparation_time_minutes + delivery_time_minutes)
        
        # Valores do pedido
        subtotal = random.uniform(25, 150)
        
        # Taxa de entrega
        delivery_fee = 0
        if channel in ['delivery', 'ifood', 'uber_eats', 'rappi']:
            delivery_fee = random.uniform(3, 12)
        
        # Desconto (30% chance de ter cupom)
        discount_amount = 0
        coupon_id = None
        if random.random() < 0.3:
            coupon_id = random.choice(coupon_ids)
            discount_amount = random.uniform(2, 15)
        
        tax_amount = subtotal * 0.1  # 10% de taxa
        total_amount = subtotal + tax_amount + delivery_fee - discount_amount
        
        # Avaliação (apenas para pedidos entregues)
        rating = None
        feedback = None
        if status == 'delivered' and random.random() < 0.7:  # 70% avaliam
            rating = random.choices([1, 2, 3, 4, 5], weights=[0.05, 0.05, 0.15, 0.35, 0.4])[0]
            if rating <= 3:
                feedback = fake.text(max_nb_chars=100)
        
        # Endereço de entrega
        delivery_address = None
        delivery_location = None
        if channel in ['delivery', 'ifood', 'uber_eats', 'rappi']:
            delivery_address = fake.address()
            lat = random.uniform(-23.7, -23.4)
            lng = random.uniform(-46.8, -46.4)
            delivery_location = f'POINT({lng} {lat})'
        
        orders.append((
            store_id, customer_id, order_number, channel, status, order_date,
            delivery_date, subtotal, tax_amount, delivery_fee, discount_amount,
            total_amount, coupon_id, delivery_address, delivery_location,
            preparation_time_minutes, delivery_time_minutes, rating, feedback
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
            
            order_items_batch.append((
                i + 1,  # order_id será ajustado após inserção
                product_id, quantity, unit_price, total_price, customizations
            ))
        
        # Inserir em lotes de 1000
        if len(orders) >= 1000:
            cursor.executemany("""
                INSERT INTO orders (store_id, customer_id, order_number, channel, status, order_date,
                                  delivery_date, subtotal, tax_amount, delivery_fee, discount_amount,
                                  total_amount, coupon_id, delivery_address, delivery_location,
                                  preparation_time_minutes, delivery_time_minutes, rating, feedback)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                        CASE WHEN %s IS NOT NULL THEN ST_GeogFromText(%s) END, %s, %s, %s, %s)
            """, orders)
            
            # Ajustar order_ids para order_items
            cursor.execute("SELECT id FROM orders ORDER BY id DESC LIMIT %s", (len(orders),))
            new_order_ids = [row[0] for row in cursor.fetchall()]
            new_order_ids.reverse()
            
            # Atualizar order_items com IDs corretos
            for j, item in enumerate(order_items_batch[-len(orders) * 2:]):  # Aproximação
                if j < len(new_order_ids):
                    order_items_batch[-(len(orders) * 2) + j] = (
                        new_order_ids[j // 2],  # Aproximação do order_id
                        item[1], item[2], item[3], item[4], item[5]
                    )
            
            conn.commit()
            orders = []
            print(f"Inseridos {i+1} pedidos...")
    
    # Inserir pedidos restantes
    if orders:
        cursor.executemany("""
            INSERT INTO orders (store_id, customer_id, order_number, channel, status, order_date,
                              delivery_date, subtotal, tax_amount, delivery_fee, discount_amount,
                              total_amount, coupon_id, delivery_address, delivery_location,
                              preparation_time_minutes, delivery_time_minutes, rating, feedback)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                    CASE WHEN %s IS NOT NULL THEN ST_GeogFromText(%s) END, %s, %s, %s, %s)
        """, orders)
        conn.commit()
    
    print(f"Gerados {num_orders} pedidos")

def generate_order_items(conn):
    """Gera itens de pedidos para todos os pedidos"""
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM orders")
    order_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT id, price FROM products")
    products = {row[0]: row[1] for row in cursor.fetchall()}
    
    order_items = []
    
    for order_id in order_ids:
        num_items = random.choices([1, 2, 3, 4], weights=[0.4, 0.35, 0.2, 0.05])[0]
        
        for _ in range(num_items):
            product_id = random.choice(list(products.keys()))
            quantity = random.choices([1, 2, 3], weights=[0.7, 0.25, 0.05])[0]
            unit_price = products[product_id]
            total_price = unit_price * quantity
            
            # Customizações (30% chance)
            customizations = None
            if random.random() < 0.3:
                customizations = json.dumps({
                    "size": random.choice(["pequeno", "médio", "grande"]),
                    "extras": random.sample(["bacon", "queijo", "cebola", "tomate"], random.randint(0, 2))
                })
            
            order_items.append((
                order_id, product_id, quantity, unit_price, total_price, customizations
            ))
        
        # Inserir em lotes
        if len(order_items) >= 5000:
            cursor.executemany("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, customizations)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, order_items)
            conn.commit()
            order_items = []
            print(f"Processados itens para {len([o for o in order_ids if o <= order_id])} pedidos...")
    
    # Inserir itens restantes
    if order_items:
        cursor.executemany("""
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, customizations)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, order_items)
        conn.commit()
    
    print("Gerados todos os itens de pedidos")

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
        
        print("4. Atualizando views materializadas...")
        cursor = conn.cursor()
        cursor.execute("SELECT refresh_materialized_views()")
        conn.commit()
        
        print("Geração de dados concluída com sucesso!")
        
    except Exception as e:
        print(f"Erro durante a geração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()