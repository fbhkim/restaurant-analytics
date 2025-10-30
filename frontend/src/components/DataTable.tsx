import React, { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface DataTableProps {
  data: Record<string, any>[]
  columns: string[]
  metadata: {
    total_rows: number
    execution_time: string
  }
}

const DataTable: React.FC<DataTableProps> = ({ data, columns, metadata }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }, [data, sortColumn, sortDirection])

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedData, currentPage])

  const totalPages = Math.ceil(data.length / itemsPerPage)

  const formatValue = (value: any, column: string) => {
    if (value === null || value === undefined) return '-'
    
    // Formatação para valores monetários
    if (column.includes('revenue') || column.includes('amount') || column.includes('fee') || column.includes('tax') || column.includes('discount')) {
      if (typeof value === 'number') {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value)
      }
    }
    
    // Formatação para percentuais
    if (column.includes('rate') || column.includes('percent')) {
      if (typeof value === 'number') {
        return `${value.toFixed(1)}%`
      }
    }
    
    // Formatação para números
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toLocaleString('pt-BR')
      } else {
        return value.toFixed(2).replace('.', ',')
      }
    }
    
    return String(value)
  }

  const getColumnLabel = (column: string) => {
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
      conversion_rate: 'Taxa de Conversão',
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
    
    return labels[column] || column
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resultados</h3>
        <div className="text-sm text-gray-600">
          {metadata.total_rows} registros • {metadata.execution_time}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column}
                  onClick={() => handleSort(column)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>{getColumnLabel(column)}</span>
                    {sortColumn === column && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map(column => (
                  <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatValue(row[column], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, data.length)} de {data.length} registros
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable