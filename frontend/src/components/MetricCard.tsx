import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative'
  suffix?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  suffix
}) => {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {change && (
          <div className={`flex items-center text-xs ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'positive' ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {change}
          </div>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-gray-900">
          {value}
          {suffix && <span className="text-lg ml-1">{suffix}</span>}
        </span>
      </div>
    </div>
  )
}

export default MetricCard