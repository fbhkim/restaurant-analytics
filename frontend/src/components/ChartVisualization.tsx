import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ChartVisualizationProps {
  data: Record<string, any>[]
  dimensions: string[]
  metrics: string[]
}

const ChartVisualization: React.FC<ChartVisualizationProps> = ({
  data,
  dimensions,
  metrics
}) => {
  const [chartType, setChartType] = React.useState<'bar' | 'line' | 'doughnut'>('bar')

  // Funções auxiliares movidas para o topo
  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      total_revenue: 'Receita Total',
      total_orders: 'Total de Pedidos',
      avg_ticket: 'Ticket Médio',
      total_items: 'Total de Itens',
      avg_delivery_time: 'Tempo Médio de Entrega',
      avg_preparation_time: 'Tempo Médio de Preparo',
      avg_rating: 'Avaliação Média',
      unique_customers: 'Clientes Únicos',
      repeat_customers: 'Clientes Recorrentes',
      conversion_rate: 'Taxa de Conversão'
    }
    return labels[metric] || metric
  }

  const getDimensionLabel = (dimension: string) => {
    const labels: Record<string, string> = {
      store: 'Loja',
      channel: 'Canal',
      product: 'Produto',
      product_category: 'Categoria',
      customer_city: 'Cidade',
      order_status: 'Status',
      hour: 'Hora',
      day_of_week: 'Dia da Semana',
      day: 'Dia',
      week: 'Semana',
      month: 'Mês',
      quarter: 'Trimestre'
    }
    return labels[dimension] || dimension
  }

  const primaryDimension = dimensions[0]
  const primaryMetric = metrics[0]

  if (!primaryDimension || !primaryMetric || data.length === 0) {
    return null
  }

  // Preparar dados para o gráfico
  const labels = data.map(row => String(row[primaryDimension] || ''))
  
  const datasets = metrics.map((metric, index) => {
    const colors = [
      'rgb(59, 130, 246)', // blue
      'rgb(16, 185, 129)', // green
      'rgb(245, 158, 11)', // yellow
      'rgb(239, 68, 68)', // red
      'rgb(139, 92, 246)', // purple
    ]
    
    const color = colors[index % colors.length]
    
    return {
      label: getMetricLabel(metric),
      data: data.map(row => row[metric] || 0),
      backgroundColor: chartType === 'doughnut' ? colors : color,
      borderColor: color,
      borderWidth: chartType === 'line' ? 2 : 1,
      fill: chartType === 'line' ? false : true,
    }
  })

  const chartData = {
    labels,
    datasets
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${getMetricLabel(primaryMetric)} por ${getDimensionLabel(primaryDimension)}`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y || context.parsed
            
            // Formatação especial para valores monetários
            if (primaryMetric.includes('revenue') || primaryMetric.includes('amount')) {
              return `${label}: ${new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(value)}`
            }
            
            // Formatação para percentuais
            if (primaryMetric.includes('rate')) {
              return `${label}: ${value.toFixed(1)}%`
            }
            
            return `${label}: ${value.toLocaleString('pt-BR')}`
          }
        }
      }
    },
    scales: chartType !== 'doughnut' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (primaryMetric.includes('revenue') || primaryMetric.includes('amount')) {
              return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                notation: 'compact'
              }).format(value)
            }
            return value.toLocaleString('pt-BR')
          }
        }
      }
    } : undefined
  }

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={options} />
      case 'doughnut':
        return <Doughnut data={chartData} options={options} />
      default:
        return <Bar data={chartData} options={options} />
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Visualização</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded ${
              chartType === 'bar' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Barras
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-sm rounded ${
              chartType === 'line' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Linha
          </button>
          <button
            onClick={() => setChartType('doughnut')}
            className={`px-3 py-1 text-sm rounded ${
              chartType === 'doughnut' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Pizza
          </button>
        </div>
      </div>
      
      <div className="h-96">
        {renderChart()}
      </div>
    </div>
  )
}

export default ChartVisualization