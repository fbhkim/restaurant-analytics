import React, { useState, useEffect } from 'react'
import { apiService, QuickInsights } from '../services/api'
import MetricCard from '../components/MetricCard'
import ChartCard from '../components/ChartCard'
import TopProductsCard from '../components/TopProductsCard'
import ChannelPerformanceCard from '../components/ChannelPerformanceCard'
import { Calendar, Store, RefreshCw } from 'lucide-react'

const Dashboard: React.FC = () => {
  const [insights, setInsights] = useState<QuickInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<number | undefined>()
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [stores, setStores] = useState<Array<{ id: number; name: string }>>([])

  const loadInsights = async () => {
    try {
      setLoading(true)
      const data = await apiService.getQuickInsights(selectedStore, selectedPeriod)
      setInsights(data)
    } catch (error) {
      console.error('Erro ao carregar insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetadata = async () => {
    try {
      const metadata = await apiService.getMetadata()
      setStores(metadata.filters.stores)
    } catch (error) {
      console.error('Erro ao carregar metadados:', error)
    }
  }

  useEffect(() => {
    loadMetadata()
  }, [])

  useEffect(() => {
    loadInsights()
  }, [selectedStore, selectedPeriod])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  if (loading && !insights) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do desempenho dos seus restaurantes</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
          {/* Seletor de loja */}
          <div className="flex items-center space-x-2">
            <Store className="h-4 w-4 text-gray-500" />
            <select
              value={selectedStore || ''}
              onChange={(e) => setSelectedStore(e.target.value ? Number(e.target.value) : undefined)}
              className="select-field"
              aria-label="Selecionar loja para filtrar dashboard"
            >
              <option value="">Todas as lojas</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de período */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="select-field"
              aria-label="Selecionar período para análise"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </div>

          <button
            onClick={loadInsights}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {insights && (
        <>
          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <MetricCard
              title="Receita Total"
              value={formatCurrency(insights.main_metrics.total_revenue)}
              change={formatChange(insights.changes.revenue_change)}
              changeType={insights.changes.revenue_change >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              title="Total de Pedidos"
              value={insights.main_metrics.total_orders.toLocaleString()}
              change={formatChange(insights.changes.orders_change)}
              changeType={insights.changes.orders_change >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              title="Ticket Médio"
              value={formatCurrency(insights.main_metrics.avg_ticket)}
              change={formatChange(insights.changes.ticket_change)}
              changeType={insights.changes.ticket_change >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              title="Clientes Únicos"
              value={insights.main_metrics.unique_customers.toLocaleString()}
            />
            <MetricCard
              title="Tempo de Entrega"
              value={`${insights.main_metrics.avg_delivery_time.toFixed(0)} min`}
            />
            <MetricCard
              title="Avaliação Média"
              value={insights.main_metrics.avg_rating.toFixed(1)}
              suffix="⭐"
            />
          </div>

          {/* Gráficos e tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProductsCard products={insights.top_products} />
            <ChannelPerformanceCard channels={insights.channel_performance} />
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard