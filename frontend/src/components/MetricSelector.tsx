import React from 'react'
import { useQuery } from '../contexts/QueryContext'

interface MetricSelectorProps {
  availableMetrics: string[]
}

const MetricSelector: React.FC<MetricSelectorProps> = ({ availableMetrics }) => {
  const { queryState, updateMetrics } = useQuery()

  const metricLabels: Record<string, string> = {
    total_revenue: 'Receita Total',
    total_orders: 'Total de Pedidos',
    avg_ticket: 'Ticket Médio',
    total_items: 'Total de Itens',
    avg_delivery_time: 'Tempo Médio de Entrega',
    avg_preparation_time: 'Tempo Médio de Preparo',
    avg_rating: 'Avaliação Média',
    delivery_fee_total: 'Total de Taxa de Entrega',
    discount_total: 'Total de Descontos',
    tax_total: 'Total de Impostos',
    unique_customers: 'Clientes Únicos',
    repeat_customers: 'Clientes Recorrentes',
    conversion_rate: 'Taxa de Conversão'
  }

  const handleMetricToggle = (metric: string) => {
    const newMetrics = queryState.metrics.includes(metric)
      ? queryState.metrics.filter(m => m !== metric)
      : [...queryState.metrics, metric]
    
    updateMetrics(newMetrics)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas</h3>
      <div className="space-y-2">
        {availableMetrics.map(metric => (
          <label key={metric} className="flex items-center">
            <input
              type="checkbox"
              checked={queryState.metrics.includes(metric)}
              onChange={() => handleMetricToggle(metric)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              {metricLabels[metric] || metric}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default MetricSelector