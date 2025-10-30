import React, { useState, useEffect } from 'react'
import { apiService, QueryRequest, QueryResponse, Metadata } from '../services/api'
import { useQuery } from '../contexts/QueryContext'
import MetricSelector from '../components/MetricSelector'
import DimensionSelector from '../components/DimensionSelector'
import FilterPanel from '../components/FilterPanel'
import DataTable from '../components/DataTable'
import ChartVisualization from '../components/ChartVisualization'
import { Play, Download, Share2, RefreshCw } from 'lucide-react'

const Analytics: React.FC = () => {
  const { queryState } = useQuery()
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null)
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMetadata()
  }, [])

  const loadMetadata = async () => {
    try {
      const data = await apiService.getMetadata()
      setMetadata(data)
    } catch (error) {
      console.error('Erro ao carregar metadados:', error)
      setError('Erro ao carregar metadados')
    }
  }

  const executeQuery = async () => {
    if (queryState.metrics.length === 0) {
      setError('Selecione pelo menos uma métrica')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const request: QueryRequest = {
        metrics: queryState.metrics,
        dimensions: queryState.dimensions,
        filters: queryState.filters,
        date_range: queryState.dateRange,
        limit: 1000
      }

      const result = await apiService.executeQuery(request)
      setQueryResult(result)
    } catch (error: any) {
      console.error('Erro ao executar query:', error)
      setError(error.response?.data?.detail || 'Erro ao executar consulta')
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!queryResult) return

    const csvContent = [
      queryResult.metadata.columns.join(','),
      ...queryResult.data.map(row => 
        queryResult.metadata.columns.map(col => row[col] || '').join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Explore seus dados com consultas personalizadas</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            onClick={executeQuery}
            disabled={loading || queryState.metrics.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>Executar Consulta</span>
          </button>
          
          {queryResult && (
            <>
              <button
                onClick={exportData}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar CSV</span>
              </button>
              
              <button className="btn-secondary flex items-center space-x-2">
                <Share2 className="h-4 w-4" />
                <span>Compartilhar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Query Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {metadata && (
            <>
              <MetricSelector availableMetrics={metadata.metrics} />
              <DimensionSelector availableDimensions={metadata.dimensions} />
              <FilterPanel metadata={metadata} />
            </>
          )}
        </div>

        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Executando consulta...</span>
            </div>
          )}

          {queryResult && !loading && (
            <div className="space-y-6">
              {/* Visualização em gráfico */}
              {queryState.dimensions.length > 0 && (
                <ChartVisualization 
                  data={queryResult.data}
                  dimensions={queryState.dimensions}
                  metrics={queryState.metrics}
                />
              )}

              {/* Tabela de dados */}
              <DataTable 
                data={queryResult.data}
                columns={queryResult.metadata.columns}
                metadata={queryResult.metadata}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics