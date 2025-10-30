import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface QueryRequest {
  metrics: string[]
  dimensions?: string[]
  filters?: Record<string, any>
  date_range?: Record<string, string>
  limit?: number
}

export interface QueryResponse {
  data: Record<string, any>[]
  metadata: {
    total_rows: number
    columns: string[]
    execution_time: string
  }
  query_info: {
    metrics_requested: string[]
    dimensions_requested: string[]
    filters_applied: Record<string, any>
    date_range: Record<string, string>
  }
}

export interface QuickInsights {
  period_days: number
  main_metrics: {
    total_orders: number
    total_revenue: number
    avg_ticket: number
    unique_customers: number
    avg_delivery_time: number
    avg_rating: number
  }
  changes: {
    revenue_change: number
    orders_change: number
    ticket_change: number
  }
  top_products: Array<{
    name: string
    quantity_sold: number
    revenue: number
  }>
  channel_performance: Array<{
    channel: string
    orders: number
    revenue: number
    avg_delivery_time: number
  }>
}

export interface Metadata {
  metrics: string[]
  dimensions: string[]
  filters: {
    stores: Array<{ id: number; name: string }>
    channels: string[]
    product_categories: string[]
    statuses: string[]
  }
}

export const apiService = {
  // Executar query customizada
  executeQuery: async (request: QueryRequest): Promise<QueryResponse> => {
    const response = await api.post('/api/query', request)
    return response.data
  },

  // Buscar insights rápidos
  getQuickInsights: async (storeId?: number, days: number = 30): Promise<QuickInsights> => {
    const params = new URLSearchParams()
    if (storeId) params.append('store_id', storeId.toString())
    params.append('days', days.toString())
    
    const response = await api.get(`/api/quick-insights?${params}`)
    return response.data
  },

  // Buscar metadados
  getMetadata: async (): Promise<Metadata> => {
    const response = await api.get('/api/metadata')
    return response.data
  },

  // Verificar saúde da API
  healthCheck: async () => {
    const response = await api.get('/health')
    return response.data
  }
}

export default api