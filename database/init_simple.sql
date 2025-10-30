CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS customizations CASCADE;

CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2),
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    store_id INTEGER REFERENCES stores(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    channel VARCHAR(50) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    delivery_time_minutes INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    coupon_id INTEGER REFERENCES coupons(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customizations (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value VARCHAR(255),
    additional_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados iniciais
INSERT INTO stores (name, address, city, state, postal_code, latitude, longitude) VALUES
('Pizzaria Centro', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', -23.5505, -46.6333),
('Pizzaria Shopping', 'Av. Paulista, 456', 'São Paulo', 'SP', '01310-100', -23.5618, -46.6565),
('Pizzaria Bairro', 'Rua dos Jardins, 789', 'São Paulo', 'SP', '04567-890', -23.5893, -46.6825);

INSERT INTO products (name, category, price, cost) VALUES
-- Hambúrgueres (mais populares)
('X-Bacon Duplo', 'Hambúrguer', 32.90, 16.00),
('Hambúrguer Artesanal', 'Hambúrguer', 28.90, 14.00),
('X-Tudo', 'Hambúrguer', 35.90, 18.00),
('Cheeseburger Clássico', 'Hambúrguer', 24.90, 12.00),
('Hambúrguer Vegano', 'Hambúrguer', 29.90, 15.00),

-- Pizzas
('Pizza Margherita', 'Pizza', 35.90, 18.00),
('Pizza Calabresa', 'Pizza', 38.90, 20.00),
('Pizza Portuguesa', 'Pizza', 42.90, 22.00),
('Pizza Quatro Queijos', 'Pizza', 45.90, 24.00),
('Pizza Pepperoni', 'Pizza', 41.90, 21.00),

-- Acompanhamentos
('Batata Frita Grande', 'Acompanhamento', 18.90, 8.00),
('Batata Frita Pequena', 'Acompanhamento', 12.90, 6.00),
('Onion Rings', 'Acompanhamento', 16.90, 7.50),
('Nuggets 10un', 'Acompanhamento', 22.90, 11.00),

-- Bebidas
('Refrigerante 2L', 'Bebida', 12.90, 5.00),
('Coca-Cola 350ml', 'Bebida', 5.50, 2.50),
('Guaraná 350ml', 'Bebida', 5.50, 2.50),
('Suco Natural 500ml', 'Bebida', 8.90, 4.00),
('Água 500ml', 'Bebida', 3.50, 1.50),

-- Sobremesas
('Pudim Caseiro', 'Sobremesa', 8.90, 4.00),
('Brownie com Sorvete', 'Sobremesa', 14.90, 7.00),
('Milk Shake', 'Sobremesa', 16.90, 8.00);

INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until) VALUES
('PRIMEIRA10', 'percentage', 10.00, 30.00, 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'),
('FRETE5', 'fixed', 5.00, 25.00, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days'),
('DESCONTO15', 'percentage', 15.00, 50.00, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days');

-- Criar índices para performance
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);