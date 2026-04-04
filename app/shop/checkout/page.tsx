'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Lock, CreditCard, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ordersApi, paymentsApi } from '@/lib/api'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen() {
  const router = useRouter()
  return (
    <div className="text-center py-24 space-y-4">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle size={40} className="text-green-500" />
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

// ─── Payment form (Stripe Elements) ───────────────────────────────────────────
function PaymentForm({
  items,
  totalPrice,
  onSuccess,
}: {
  items: ReturnType<typeof useCart>['items']
  totalPrice: number
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { clearCart } = useCart()

  const [address, setAddress] = useState('')
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)

  const handleShippingNext = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) { toast.error('Please enter a shipping address'); return }

    setLoading(true)
    try {
      const { clientSecret: cs } = await paymentsApi.createIntent(Math.round(totalPrice * 100))
      setClientSecret(cs)
      setStep('payment')
    } catch {
      toast.error('Failed to initialize payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return

    setLoading(true)
    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not mounted')

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      })

      if (error) {
        toast.error(error.message ?? 'Payment failed')
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        await ordersApi.create({
          items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          shippingAddress: address,
          notes: `Stripe PaymentIntent: ${paymentIntent.id}`,
        })
        clearCart()
        onSuccess()
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Order creation failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {step === 'payment' && (
          <button
            onClick={() => setStep('shipping')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`flex items-center gap-1.5 font-medium ${step === 'shipping' ? 'text-blue-600' : 'text-green-600'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${step === 'shipping' ? 'bg-blue-600' : 'bg-green-500'}`}>
            {step === 'shipping' ? '1' : '✓'}
          </div>
          Shipping
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className={`flex items-center gap-1.5 font-medium ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${step === 'payment' ? 'bg-blue-600' : 'bg-gray-300'}`}>
            2
          </div>
          Payment
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
            <label className="text-sm font-medium text-gray-700">Shipping Address *</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={3}
              placeholder="123 Main St, City, State, ZIP, Country"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </form>
      )}

      {/* Step 2: Payment */}
      {step === 'payment' && (
        <form onSubmit={handlePay} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Payment Details</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Lock size={12} />
              Secured by Stripe
            </div>
          </div>

          <div className="p-3.5 border border-gray-200 rounded-xl bg-gray-50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#1f2937',
                    fontFamily: 'inherit',
                    '::placeholder': { color: '#9ca3af' },
                  },
                  invalid: { color: '#ef4444' },
                },
              }}
            />
          </div>

          {/* Test card hint */}
          <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 rounded-xl p-3 border border-blue-100">
            <CreditCard size={14} className="text-blue-400 mt-0.5 shrink-0" />
            <span>
              <strong className="text-blue-600">Test mode:</strong> Use card{' '}
              <code className="font-mono bg-blue-100 px-1 rounded text-blue-700">4242 4242 4242 4242</code>,
              any future date, any 3-digit CVC.
            </span>
          </div>

          <button
            type="submit"
            disabled={!stripe || loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            {loading ? 'Processing...' : `Pay ${formatCurrency(totalPrice)}`}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-gray-400">
        By placing an order you agree to our Terms of Service &amp; Privacy Policy.
      </p>
    </div>
  )
}

// ─── Page wrapper ──────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice } = useCart()
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (items.length === 0 && !success) router.replace('/shop/cart')
  }, [items, success, router])

  if (success) return <SuccessScreen />
  if (items.length === 0) return null

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm items={items} totalPrice={totalPrice} onSuccess={() => setSuccess(true)} />
    </Elements>
  )
}
