-- Índices para otimização de performance

-- Índices principais para orders
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_channel ON orders(channel);
CREATE INDEX idx_orders_status ON orders(status);

-- Índices compostos para queries comuns
CREATE INDEX idx_orders_store_date ON orders(store_id, order_date);
CREATE INDEX idx_orders_channel_date ON orders(channel, order_date);
CREATE INDEX idx_orders_store_channel_date ON orders(store_id, channel, order_date);

-- Índices para order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Índices para customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_first_order_date ON customers(first_order_date);

-- Índices para produtos
CREATE INDEX idx_products_category ON products(category);

-- Índices geoespaciais
CREATE INDEX idx_orders_delivery_location ON orders USING GIST(delivery_location);
CREATE INDEX idx_customers_location ON customers USING GIST(location);
CREATE INDEX idx_stores_location ON stores USING GIST(location);

-- Índices para JSONB (customizações)
CREATE INDEX idx_order_items_customizations ON order_items USING GIN(customizations);

-- Views materializadas para agregações comuns
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT 
    DATE(order_date) as sale_date,
    store_id,
    channel,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_ticket,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
    AVG(CASE WHEN delivery_time_minutes IS NOT NULL THEN delivery_time_minutes END) as avg_delivery_time
FROM orders 
WHERE order_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE(order_date), store_id, channel;

CREATE UNIQUE INDEX idx_daily_sales_summary ON daily_sales_summary(sale_date, store_id, channel);

CREATE MATERIALIZED VIEW product_performance AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category,
    COUNT(oi.id) as total_sold,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.unit_price) as avg_price
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY p.id, p.name, p.category;

CREATE UNIQUE INDEX idx_product_performance ON product_performance(product_id);

-- Função para refresh das views materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_performance;
END;
$$ LANGUAGE plpgsql;