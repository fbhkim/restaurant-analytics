-- Criação das tabelas principais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Tabela de lojas
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20),
    location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clientes
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    location GEOGRAPHY(POINT, 4326),
    first_order_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cupons
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    customer_id INTEGER REFERENCES customers(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('dine_in', 'takeout', 'delivery', 'ifood', 'uber_eats', 'rappi')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    order_date TIMESTAMP NOT NULL,
    delivery_date TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    coupon_id INTEGER REFERENCES coupons(id),
    delivery_address TEXT,
    delivery_location GEOGRAPHY(POINT, 4326),
    preparation_time_minutes INTEGER,
    delivery_time_minutes INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do pedido
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    customizations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de customizações disponíveis
CREATE TABLE customizations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ingredient', 'size', 'preparation', 'addon')),
    options JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados de exemplo
INSERT INTO stores (name, address, city, state, postal_code, location) VALUES
('Restaurante Centro', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', ST_GeogFromText('POINT(-46.6333 -23.5505)')),
('Restaurante Zona Sul', 'Av. Paulista, 456', 'São Paulo', 'SP', '04567-890', ST_GeogFromText('POINT(-46.6566 -23.5629)')),
('Restaurante Zona Norte', 'Rua do Norte, 789', 'São Paulo', 'SP', '02345-678', ST_GeogFromText('POINT(-46.6388 -23.5200)'));

INSERT INTO products (name, category, price, cost) VALUES
('Hambúrguer Clássico', 'Hambúrguers', 25.90, 12.50),
('Hambúrguer Bacon', 'Hambúrguers', 29.90, 15.00),
('Pizza Margherita', 'Pizzas', 35.90, 18.00),
('Pizza Calabresa', 'Pizzas', 38.90, 20.00),
('Refrigerante Lata', 'Bebidas', 5.90, 2.50),
('Suco Natural', 'Bebidas', 8.90, 4.00),
('Batata Frita', 'Acompanhamentos', 12.90, 6.00),
('Salada Caesar', 'Saladas', 22.90, 11.00);

INSERT INTO coupons (code, discount_type, discount_value, min_order_value, valid_from, valid_until) VALUES
('PRIMEIRA10', 'percentage', 10.00, 30.00, '2024-01-01', '2024-12-31'),
('FRETE5', 'fixed', 5.00, 25.00, '2024-01-01', '2024-12-31'),
('DESCONTO15', 'percentage', 15.00, 50.00, '2024-01-01', '2024-12-31');