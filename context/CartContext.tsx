'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  // Skip the persist-on-change effect until after the initial hydrate so we
  // don't transiently overwrite stored cart data with [] on mount.
  const hydrated = useRef(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating cart from localStorage on mount
      if (stored) setItems(JSON.parse(stored) as CartItem[])
    } catch {
      localStorage.removeItem(CART_KEY)
      toast.error('Your cart data was corrupted and has been cleared.')
    } finally {
      hydrated.current = true
    }
  }, [])

  // Persist whenever items change. Single source of truth — keeps localStorage
  // in sync without each setter having to call localStorage itself.
  useEffect(() => {
    if (!hydrated.current) return
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addToCart = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i,
        )
      }
      return [...prev, { product, quantity }]
    })
  }

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i))
  }

  const clearCart = () => setItems([])

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
