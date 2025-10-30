import React from 'react'

interface Product {
  name: string
  quantity_sold: number
  revenue: number
}

interface TopProductsCardProps {
  products: Product[]
}

const TopProductsCard: React.FC<TopProductsCardProps> = ({ products }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top 5 Produtos Mais Vendidos
      </h3>
      
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-medium rounded-full mr-3">
                  {index + 1}
                </span>
                <span className="font-medium text-gray-900">{product.name}</span>
              </div>
              <div className="ml-9 text-sm text-gray-600">
                {product.quantity_sold} unidades vendidas
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {formatCurrency(product.revenue)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopProductsCard