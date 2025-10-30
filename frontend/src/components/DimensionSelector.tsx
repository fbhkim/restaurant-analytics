import React from 'react'
import { useQuery } from '../contexts/QueryContext'

interface DimensionSelectorProps {
  availableDimensions: string[]
}

const DimensionSelector: React.FC<DimensionSelectorProps> = ({ availableDimensions }) => {
  const { queryState, updateDimensions } = useQuery()

  const dimensionLabels: Record<string, string> = {
    store: 'Loja',
    store_id: 'ID da Loja',
    channel: 'Canal',
    product: 'Produto',
    product_category: 'Categoria do Produto',
    customer_city: 'Cidade do Cliente',
    order_status: 'Status do Pedido',
    hour: 'Hora',
    day_of_week: 'Dia da Semana',
    day: 'Dia',
    week: 'Semana',
    month: 'Mês',
    quarter: 'Trimestre'
  }

  const handleDimensionToggle = (dimension: string) => {
    const newDimensions = queryState.dimensions.includes(dimension)
      ? queryState.dimensions.filter(d => d !== dimension)
      : [...queryState.dimensions, dimension]
    
    updateDimensions(newDimensions)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dimensões</h3>
      <div className="space-y-2">
        {availableDimensions.map(dimension => (
          <label key={dimension} className="flex items-center">
            <input
              type="checkbox"
              checked={queryState.dimensions.includes(dimension)}
              onChange={() => handleDimensionToggle(dimension)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              {dimensionLabels[dimension] || dimension}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default DimensionSelector