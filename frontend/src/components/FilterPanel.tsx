import React, { useState } from 'react'
import { useQuery } from '../contexts/QueryContext'
import { Metadata } from '../services/api'
import { format } from 'date-fns'

interface FilterPanelProps {
  metadata: Metadata
}

const FilterPanel: React.FC<FilterPanelProps> = ({ metadata }) => {
  const { queryState, updateFilters, updateDateRange } = useQuery()
  const [localFilters, setLocalFilters] = useState(queryState.filters)
  const [localDateRange, setLocalDateRange] = useState(queryState.dateRange)

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    updateFilters(newFilters)
  }

  const handleDateRangeChange = (key: string, value: string) => {
    const newDateRange = { ...localDateRange, [key]: value }
    setLocalDateRange(newDateRange)
    updateDateRange(newDateRange)
  }

  const clearFilters = () => {
    setLocalFilters({})
    setLocalDateRange({})
    updateFilters({})
    updateDateRange({})
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Limpar
        </button>
      </div>

      <div className="space-y-4">
        {/* Filtro de data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={localDateRange.start_date || ''}
              onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
              className="input-field text-sm"
              placeholder="Data inicial"
            />
            <input
              type="date"
              value={localDateRange.end_date || ''}
              onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
              className="input-field text-sm"
              placeholder="Data final"
            />
          </div>
        </div>

        {/* Filtro de lojas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lojas
          </label>
          <select
            multiple
            value={localFilters.store_ids || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => Number(option.value))
              handleFilterChange('store_ids', values)
            }}
            className="select-field text-sm h-24"
            aria-label="Selecionar lojas para filtrar"
          >
            {metadata.filters.stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de canais */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canais
          </label>
          <div className="space-y-1">
            {metadata.filters.channels.map(channel => (
              <label key={channel} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(localFilters.channels || []).includes(channel)}
                  onChange={(e) => {
                    const currentChannels = localFilters.channels || []
                    const newChannels = e.target.checked
                      ? [...currentChannels, channel]
                      : currentChannels.filter(c => c !== channel)
                    handleFilterChange('channels', newChannels)
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{channel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filtro de categorias */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categorias de Produtos
          </label>
          <select
            multiple
            value={localFilters.product_categories || []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value)
              handleFilterChange('product_categories', values)
            }}
            className="select-field text-sm h-20"
            aria-label="Selecionar categorias de produtos para filtrar"
          >
            {metadata.filters.product_categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status do Pedido
          </label>
          <div className="space-y-1">
            {metadata.filters.statuses.map(status => (
              <label key={status} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(localFilters.status || []).includes(status)}
                  onChange={(e) => {
                    const currentStatuses = localFilters.status || []
                    const newStatuses = e.target.checked
                      ? [...currentStatuses, status]
                      : currentStatuses.filter(s => s !== status)
                    handleFilterChange('status', newStatuses)
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{status}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel