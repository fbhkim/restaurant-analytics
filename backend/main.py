from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import os
from datetime import datetime, date
import pandas as pd
import json

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/restaurant_analytics")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Restaurant Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
class QueryRequest(BaseModel):
    metrics: List[str] = Field(..., description="Métricas a serem calculadas")
    dimensions: List[str] = Field(default=[], description="Dimensões para agrupamento")
    filters: Dict[str, Any] = Field(default={}, description="Filtros a serem aplicados")
    date_range: Dict[str, str] = Field(default={}, description="Período de análise")
    limit: Optional[int] = Field(default=1000, description="Limite de resultados")

class QueryResponse(BaseModel):
    data: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    query_info: Dict[str, Any]

AVAILABLE_METRICS = {
    "total_revenue": "SUM(o.total_amount)",
    "total_orders": "COUNT(DISTINCT o.id)",
    "avg_ticket": "AVG(o.total_amount)",
    "total_items": "SUM(oi.quantity)",
    "avg_delivery_time": "AVG(o.delivery_time_minutes)",
    "avg_preparation_time": "AVG(o.preparation_time_minutes)",
    "avg_rating": "AVG(o.rating)",
    "delivery_fee_total": "SUM(o.delivery_fee)",
    "discount_total": "SUM(o.discount_amount)",
    "tax_total": "SUM(o.tax_amount)",
    "unique_customers": "COUNT(DISTINCT o.customer_id)",
    "repeat_customers": "COUNT(DISTINCT CASE WHEN customer_order_count.order_count > 1 THEN o.customer_id END)",
    "conversion_rate": "ROUND((COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END)::float / COUNT(DISTINCT o.id)::float * 100), 2)"
}

# Mapeamento de dimensões disponíveis
AVAILABLE_DIMENSIONS = {
    "store": "s.name",
    "store_id": "o.store_id",
    "channel": "o.channel",
    "product": "p.name",
    "product_category": "p.category",
    "customer_city": "c.city",
    "order_status": "o.status",
    "hour": "EXTRACT(HOUR FROM o.order_date)",
    "day_of_week": "EXTRACT(DOW FROM o.order_date)",
    "day": "DATE(o.order_date)",
    "week": "DATE_TRUNC('week', o.order_date)",
    "month": "DATE_TRUNC('month', o.order_date)",
    "quarter": "DATE_TRUNC('quarter', o.order_date)"
}

def build_safe_query(request: QueryRequest) -> str:
    """Constrói uma query SQL segura baseada nos parâmetros fornecidos"""
    
    # Validar métricas
    invalid_metrics = [m for m in request.metrics if m not in AVAILABLE_METRICS]
    if invalid_metrics:
        raise HTTPException(status_code=400, detail=f"Métricas inválidas: {invalid_metrics}")
    
    # Validar dimensões
    invalid_dimensions = [d for d in request.dimensions if d not in AVAILABLE_DIMENSIONS]
    if invalid_dimensions:
        raise HTTPException(status_code=400, detail=f"Dimensões inválidas: {invalid_dimensions}")
    
    # Construir SELECT
    select_parts = []
    
    # Adicionar dimensões
    for dim in request.dimensions:
        select_parts.append(f"{AVAILABLE_DIMENSIONS[dim]} as {dim}")
    
    # Adicionar métricas
    for metric in request.metrics:
        select_parts.append(f"{AVAILABLE_METRICS[metric]} as {metric}")
    
    select_clause = "SELECT " + ", ".join(select_parts)
    
    # Construir FROM e JOINs
    from_clause = """
    FROM orders o
    LEFT JOIN stores s ON o.store_id = s.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    """
    
    # Adicionar subquery para contagem de pedidos por cliente se necessário
    if "repeat_customers" in request.metrics:
        from_clause += """
        LEFT JOIN (
            SELECT customer_id, COUNT(*) as order_count
            FROM orders
            GROUP BY customer_id
        ) customer_order_count ON o.customer_id = customer_order_count.customer_id
        """
    
    # Construir WHERE
    where_conditions = ["1=1"]  # Condição sempre verdadeira para facilitar concatenação
    
    # Filtros de data
    if request.date_range:
        if "start_date" in request.date_range:
            where_conditions.append(f"o.order_date >= '{request.date_range['start_date']}'")
        if "end_date" in request.date_range:
            where_conditions.append(f"o.order_date <= '{request.date_range['end_date']}'")
    
    # Outros filtros
    for key, value in request.filters.items():
        if key == "store_ids" and isinstance(value, list):
            store_ids = [str(int(sid)) for sid in value]  # Sanitizar IDs
            where_conditions.append(f"o.store_id IN ({','.join(store_ids)})")
        elif key == "channels" and isinstance(value, list):
            channels = [f"'{channel}'" for channel in value if channel.replace('_', '').isalnum()]
            where_conditions.append(f"o.channel IN ({','.join(channels)})")
        elif key == "product_categories" and isinstance(value, list):
            categories = [f"'{cat}'" for cat in value if cat.replace(' ', '').replace('_', '').isalnum()]
            where_conditions.append(f"p.category IN ({','.join(categories)})")
        elif key == "status" and isinstance(value, list):
            statuses = [f"'{status}'" for status in value if status.replace('_', '').isalnum()]
            where_conditions.append(f"o.status IN ({','.join(statuses)})")
    
    where_clause = "WHERE " + " AND ".join(where_conditions)
    
    # Construir GROUP BY
    group_by_clause = ""
    if request.dimensions:
        group_by_parts = [AVAILABLE_DIMENSIONS[dim] for dim in request.dimensions]
        group_by_clause = "GROUP BY " + ", ".join(group_by_parts)
    
    # Construir ORDER BY
    order_by_clause = ""
    if request.dimensions:
        order_by_clause = f"ORDER BY {request.dimensions[0]}"
    elif request.metrics:
        order_by_clause = f"ORDER BY {request.metrics[0]} DESC"
    
    # Construir LIMIT
    limit_clause = f"LIMIT {min(request.limit, 10000)}"  # Máximo de 10k registros
    
    # Montar query final
    query = f"""
    {select_clause}
    {from_clause}
    {where_clause}
    {group_by_clause}
    {order_by_clause}
    {limit_clause}
    """
    
    return query

@app.get("/")
async def root():
    return {"message": "Restaurant Analytics API", "version": "1.0.0"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

@app.get("/api/metadata")
async def get_metadata(db: Session = Depends(get_db)):
    """Retorna metadados sobre métricas e dimensões disponíveis"""
    
    # Buscar informações das lojas
    stores_result = db.execute(text("SELECT id, name FROM stores ORDER BY name"))
    stores = [{"id": row[0], "name": row[1]} for row in stores_result]
    
    # Buscar canais únicos
    channels_result = db.execute(text("SELECT DISTINCT channel FROM orders ORDER BY channel"))
    channels = [row[0] for row in channels_result]
    
    # Buscar categorias de produtos
    categories_result = db.execute(text("SELECT DISTINCT category FROM products ORDER BY category"))
    categories = [row[0] for row in categories_result]
    
    # Buscar status de pedidos
    status_result = db.execute(text("SELECT DISTINCT status FROM orders ORDER BY status"))
    statuses = [row[0] for row in status_result]
    
    return {
        "metrics": list(AVAILABLE_METRICS.keys()),
        "dimensions": list(AVAILABLE_DIMENSIONS.keys()),
        "filters": {
            "stores": stores,
            "channels": channels,
            "product_categories": categories,
            "statuses": statuses
        }
    }

@app.post("/api/query", response_model=QueryResponse)
async def execute_query(request: QueryRequest, db: Session = Depends(get_db)):
    """Executa uma query dinâmica baseada nos parâmetros fornecidos"""
    
    try:
        # Construir query segura
        query = build_safe_query(request)
        
        # Executar query
        result = db.execute(text(query))
        
        # Converter resultado para lista de dicionários
        columns = result.keys()
        data = [dict(zip(columns, row)) for row in result.fetchall()]
        
        # Preparar metadados
        metadata = {
            "total_rows": len(data),
            "columns": list(columns),
            "execution_time": "< 1s"  # Placeholder - em produção, medir tempo real
        }
        
        query_info = {
            "metrics_requested": request.metrics,
            "dimensions_requested": request.dimensions,
            "filters_applied": request.filters,
            "date_range": request.date_range
        }
        
        return QueryResponse(
            data=data,
            metadata=metadata,
            query_info=query_info
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao executar query: {str(e)}")

@app.get("/api/quick-insights")
async def get_quick_insights(
    store_id: Optional[int] = Query(None),
    days: int = Query(30, description="Número de dias para análise"),
    db: Session = Depends(get_db)
):
    """Retorna insights rápidos para o dashboard principal"""
    
    # Filtro de loja
    store_filter = f"AND o.store_id = {store_id}" if store_id else ""
    
    # Query para métricas principais
    main_metrics_query = f"""
    SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_ticket,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        AVG(o.delivery_time_minutes) as avg_delivery_time,
        AVG(o.rating) as avg_rating
    FROM orders o
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '{days} days'
    {store_filter}
    """
    
    # Query para comparação com período anterior
    comparison_query = f"""
    SELECT 
        COUNT(DISTINCT o.id) as total_orders_prev,
        SUM(o.total_amount) as total_revenue_prev,
        AVG(o.total_amount) as avg_ticket_prev
    FROM orders o
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '{days * 2} days'
    AND o.order_date < CURRENT_DATE - INTERVAL '{days} days'
    {store_filter}
    """
    
    # Query para top produtos
    top_products_query = f"""
    SELECT 
        p.name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.total_price) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '{days} days'
    {store_filter}
    GROUP BY p.id, p.name
    ORDER BY quantity_sold DESC
    LIMIT 5
    """
    
    # Query para performance por canal
    channel_performance_query = f"""
    SELECT 
        o.channel,
        COUNT(DISTINCT o.id) as orders,
        SUM(o.total_amount) as revenue,
        AVG(o.delivery_time_minutes) as avg_delivery_time
    FROM orders o
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '{days} days'
    {store_filter}
    GROUP BY o.channel
    ORDER BY revenue DESC
    """
    
    try:
        # Executar queries
        main_metrics = db.execute(text(main_metrics_query)).fetchone()
        comparison_metrics = db.execute(text(comparison_query)).fetchone()
        top_products = db.execute(text(top_products_query)).fetchall()
        channel_performance = db.execute(text(channel_performance_query)).fetchall()
        
        # Calcular variações percentuais
        def calculate_change(current, previous):
            if previous and previous > 0:
                return round(((current - previous) / previous) * 100, 2)
            return 0
        
        current_revenue = main_metrics[1] or 0
        prev_revenue = comparison_metrics[1] or 0
        revenue_change = calculate_change(current_revenue, prev_revenue)
        
        current_orders = main_metrics[0] or 0
        prev_orders = comparison_metrics[0] or 0
        orders_change = calculate_change(current_orders, prev_orders)
        
        current_ticket = main_metrics[2] or 0
        prev_ticket = comparison_metrics[2] or 0
        ticket_change = calculate_change(current_ticket, prev_ticket)
        
        return {
            "period_days": days,
            "main_metrics": {
                "total_orders": current_orders,
                "total_revenue": round(current_revenue, 2),
                "avg_ticket": round(current_ticket, 2),
                "unique_customers": main_metrics[3] or 0,
                "avg_delivery_time": round(main_metrics[4] or 0, 1),
                "avg_rating": round(main_metrics[5] or 0, 2)
            },
            "changes": {
                "revenue_change": revenue_change,
                "orders_change": orders_change,
                "ticket_change": ticket_change
            },
            "top_products": [
                {
                    "name": row[0],
                    "quantity_sold": row[1],
                    "revenue": round(row[2], 2)
                }
                for row in top_products
            ],
            "channel_performance": [
                {
                    "channel": row[0],
                    "orders": row[1],
                    "revenue": round(row[2], 2),
                    "avg_delivery_time": round(row[3] or 0, 1)
                }
                for row in channel_performance
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar insights: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)