'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ordersApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import type { Order } from '@/types'

const STATUS_VARIANT: Record<Order['status'], 'green' | 'blue' | 'yellow' | 'purple' | 'red'> = {
  pending: 'yellow', confirmed: 'blue', shipped: 'purple', delivered: 'green', cancelled: 'red'
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const load = () => {
    setFetchError(false)
    ordersApi.getMy()
      .then(res => setOrders(res.orders))
      .catch(() => {
        toast.error('Failed to load orders')
        setFetchError(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const cancel = async (id: number) => {
    try {
      await ordersApi.updateStatus(id, 'cancelled')
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
      toast.success('Order cancelled')
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  if (loading) return <PageLoader />

  if (fetchError) return (
    <div className="text-center py-24 space-y-3 text-gray-400">
      <AlertCircle size={48} className="mx-auto opacity-40" />
      <p className="text-lg font-medium">Failed to load orders</p>
      <p className="text-sm">Check your connection and try refreshing.</p>
    </div>
  )

  if (orders.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <ShoppingBag size={48} className="mx-auto text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">No orders yet</h2>
        <Link href="/shop/products" className="text-blue-600 hover:text-blue-700 font-medium">Start Shopping</Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
      {orders.map(order => (
        <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900">Order #{order.id}</p>
              <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[order.status]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              {order.status === 'pending' && (
                <button
                  onClick={() => cancel(order.id)}
                  aria-label={`Cancel order #${order.id}`}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-0.5 rounded-lg transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1 mb-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                <span>{item.product?.name ?? 'Product'} × {item.quantity}</span>
                <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="text-sm text-gray-500">{order.shippingAddress}</span>
            <span className="font-bold text-blue-600">{formatCurrency(Number(order.totalAmount))}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
