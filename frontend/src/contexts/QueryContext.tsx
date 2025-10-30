import React, { createContext, useContext, useState, ReactNode } from 'react'

interface QueryState {
  metrics: string[]
  dimensions: string[]
  filters: Record<string, any>
  dateRange: { start_date?: string; end_date?: string }
}

interface QueryContextType {
  queryState: QueryState
  setQueryState: React.Dispatch<React.SetStateAction<QueryState>>
  updateMetrics: (metrics: string[]) => void
  updateDimensions: (dimensions: string[]) => void
  updateFilters: (filters: Record<string, any>) => void
  updateDateRange: (dateRange: { start_date?: string; end_date?: string }) => void
}

const QueryContext = createContext<QueryContextType | undefined>(undefined)

export const useQuery = () => {
  const context = useContext(QueryContext)
  if (!context) {
    throw new Error('useQuery must be used within a QueryProvider')
  }
  return context
}

interface QueryProviderProps {
  children: ReactNode
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryState, setQueryState] = useState<QueryState>({
    metrics: ['total_revenue', 'total_orders'],
    dimensions: [],
    filters: {},
    dateRange: {}
  })

  const updateMetrics = (metrics: string[]) => {
    setQueryState(prev => ({ ...prev, metrics }))
  }

  const updateDimensions = (dimensions: string[]) => {
    setQueryState(prev => ({ ...prev, dimensions }))
  }

  const updateFilters = (filters: Record<string, any>) => {
    setQueryState(prev => ({ ...prev, filters }))
  }

  const updateDateRange = (dateRange: { start_date?: string; end_date?: string }) => {
    setQueryState(prev => ({ ...prev, dateRange }))
  }

  return (
    <QueryContext.Provider value={{
      queryState,
      setQueryState,
      updateMetrics,
      updateDimensions,
      updateFilters,
      updateDateRange
    }}>
      {children}
    </QueryContext.Provider>
  )
}