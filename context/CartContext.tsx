'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import type { CartItem, Product } from '@/types'

interface CartContextValue {
  items: CartItem[]
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_KEY = 'cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      if (stored) setItems(JSON.parse(stored) as CartItem[])
    } catch {
      localStorage.removeItem(CART_KEY)
      toast.error('Your cart data was corrupted and has been cleared.')
    }
  }, [])

  const save = (next: CartItem[]) => {
    setItems(next)
    localStorage.setItem(CART_KEY, JSON.stringify(next))
  }

  const addToCart = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      const next = existing
        ? prev.map(i => i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i)
        : [...prev, { product, quantity }]
      localStorage.setItem(CART_KEY, JSON.stringify(next))
      return next
    })
  }

  const removeFromCart = (productId: number) => {
    save(items.filter(i => i.product.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return }
    save(items.map(i => i.product.id === productId ? { ...i, quantity } : i))
  }

  const clearCart = () => save([])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
