'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { ordersApi, getApiErrorMessage } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'

function SuccessScreen() {
  const router = useRouter()
  return (
    <div className="text-center py-24 space-y-4">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle size={40} className="text-green-500" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
      <p className="text-gray-500 max-w-sm mx-auto">
        Thank you for your purchase. We&apos;ll get your order shipped soon.
      </p>
      <div className="flex gap-3 justify-center pt-4">
        <button
          onClick={() => router.push('/shop/orders')}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          View Orders
        </button>
        <button
          onClick={() => router.push('/shop/products')}
          className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  )
}

function CheckoutForm({
  items,
  totalPrice,
  onSuccess,
}: {
  items: ReturnType<typeof useCart>['items']
  totalPrice: number
  onSuccess: () => void
}) {
  const { clearCart } = useCart()
  const [address, setAddress] = useState('')
  const [step, setStep] = useState<'shipping' | 'confirm'>('shipping')
  const [loading, setLoading] = useState(false)

  const handleShippingNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) { toast.error('Please enter a shipping address'); return }
    setStep('confirm')
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      await ordersApi.create({
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        shippingAddress: address,
      })
      clearCart()
      onSuccess()
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Order creation failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {step === 'confirm' && (
          <button
            onClick={() => setStep('shipping')}
            aria-label="Back to shipping"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm" aria-label="Checkout progress">
        <div className={`flex items-center gap-1.5 font-medium ${step === 'shipping' ? 'text-blue-600' : 'text-green-600'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${step === 'shipping' ? 'bg-blue-600' : 'bg-green-500'}`}
            aria-current={step === 'shipping' ? 'step' : undefined}>
            {step === 'shipping' ? '1' : '✓'}
          </div>
          Shipping
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className={`flex items-center gap-1.5 font-medium ${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${step === 'confirm' ? 'bg-blue-600' : 'bg-gray-300'}`}
            aria-current={step === 'confirm' ? 'step' : undefined}>
            2
          </div>
          Confirm
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-semibold text-gray-900">Order Summary</h3>
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex justify-between text-sm text-gray-600">
            <span className="truncate pr-4">{product.name} × {quantity}</span>
            <span className="shrink-0">{formatCurrency(Number(product.price) * quantity)}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      {/* Step 1: Shipping */}
      {step === 'shipping' && (
        <form onSubmit={handleShippingNext} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">Shipping Details</h3>
          <div className="flex flex-col gap-1">
            <label htmlFor="shipping-address" className="text-sm font-medium text-gray-700">Shipping Address *</label>
            <textarea
              id="shipping-address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="123 Main St, City, State, ZIP, Country"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{address.length}/500</p>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to Confirm
          </button>
        </form>
      )}

      {/* Step 2: Confirm */}
      {step === 'confirm' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">Confirm Order</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-800">Shipping to:</p>
            <p className="whitespace-pre-wrap">{address}</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            aria-busy={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Placing Order...' : `Place Order — ${formatCurrency(totalPrice)}`}
          </button>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        By placing an order you agree to our Terms of Service &amp; Privacy Policy.
      </p>
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice } = useCart()
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (items.length === 0 && !success) router.replace('/shop/cart')
  }, [items, success, router])

  if (success) return <SuccessScreen />
  if (items.length === 0) return null

  return <CheckoutForm items={items} totalPrice={totalPrice} onSuccess={() => setSuccess(true)} />
}
