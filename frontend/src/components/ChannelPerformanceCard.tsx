import React from 'react'

interface Channel {
  channel: string
  orders: number
  revenue: number
  avg_delivery_time: number
}

interface ChannelPerformanceCardProps {
  channels: Channel[]
}

const ChannelPerformanceCard: React.FC<ChannelPerformanceCardProps> = ({ channels }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'ifood':
        return '🍔'
      case 'uber_eats':
        return '🚗'
      case 'rappi':
        return '🛵'
      case 'balcao':
        return '🏪'
      default:
        return '📱'
    }
  }

  const getChannelName = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'ifood':
        return 'iFood'
      case 'uber_eats':
        return 'Uber Eats'
      case 'rappi':
        return 'Rappi'
      case 'balcao':
        return 'Balcão'
      default:
        return channel
    }
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Performance por Canal
      </h3>
      
      <div className="space-y-4">
        {channels.map((channel, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getChannelIcon(channel.channel)}</span>
                <span className="font-medium text-gray-900">
                  {getChannelName(channel.channel)}
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatCurrency(channel.revenue)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Pedidos: </span>
                <span className="font-medium">{channel.orders}</span>
              </div>
              <div>
                <span className="text-gray-600">Tempo médio: </span>
                <span className="font-medium">{channel.avg_delivery_time.toFixed(0)} min</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChannelPerformanceCard