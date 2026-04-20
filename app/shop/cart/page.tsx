'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatCurrency, getPrimaryImage } from '@/lib/utils'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <ShoppingCart size={48} className="mx-auto text-gray-300" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-gray-700">Your cart is empty</h2>
        <Link href="/shop/products" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          Continue Shopping <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Shopping Cart ({totalItems} items)</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <Image src={getPrimaryImage(product.ProductImages)} alt={product.name} width={80} height={80} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/shop/products/${product.id}`} className="font-medium text-gray-900 hover:text-blue-600 truncate block">
                  {product.name}
                </Link>
                {product.category && <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>}
                <p className="text-blue-600 font-bold mt-1">{formatCurrency(product.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button
                  onClick={() => removeFromCart(product.id)}
                  aria-label={`Remove ${product.name} from cart`}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    aria-label={`Decrease quantity of ${product.name}`}
                    className="px-2 py-1 hover:bg-gray-50"
                  >
                    <Minus size={14} aria-hidden="true" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium" aria-live="polite">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, Math.min(product.stock, quantity + 1))}
                    aria-label={`Increase quantity of ${product.name}`}
                    className="px-2 py-1 hover:bg-gray-50"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit space-y-4">
          <h3 className="font-semibold text-gray-900">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({totalItems} items)</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-blue-600 text-lg">{formatCurrency(totalPrice)}</span>
          </div>
          <Link href="/shop/checkout"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Checkout <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/shop/products" className="block text-center text-sm text-gray-500 hover:text-gray-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
