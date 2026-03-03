'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordersApi } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (items.length === 0 && !success) {
    router.push('/shop/cart')
    return null
  }

  if (success) {
    return (
      <div className="text-center py-24 space-y-4">
        <CheckCircle size={56} className="mx-auto text-green-500" />
        <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
        <p className="text-gray-500">Thank you for your purchase. We&apos;ll get it to you soon.</p>
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={() => router.push('/shop/orders')} className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            View Orders
          </button>
          <button onClick={() => router.push('/shop/products')} className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) { toast.error('Please enter a shipping address'); return }
    setLoading(true)
    try {
      await ordersApi.create({
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        shippingAddress: address,
      })
      clearCart()
      setSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to place order'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex justify-between text-sm text-gray-600">
            <span>{product.name} × {quantity}</span>
            <span>{formatCurrency(Number(product.price) * quantity)}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      <form onSubmit={handleOrder} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-900">Shipping Details</h3>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Shipping Address *</label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
            placeholder="Enter your full shipping address..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}
