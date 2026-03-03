'use client'

import Link from 'next/link'
import { ShoppingCart, Heart, User, Package, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { totalItems } = useCart()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/shop" className="flex items-center gap-2 font-bold text-xl text-blue-600">
              <Package size={24} />
              ProductHub
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/shop" className="hover:text-blue-600 transition-colors">Home</Link>
              <Link href="/shop/products" className="hover:text-blue-600 transition-colors">Products</Link>
              {user && <Link href="/shop/orders" className="hover:text-blue-600 transition-colors">My Orders</Link>}
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/shop/wishlist" className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                    <Heart size={20} />
                  </Link>
                  <Link href="/shop/cart" className="p-2 text-gray-500 hover:text-blue-600 transition-colors relative">
                    <ShoppingCart size={20} />
                    {totalItems > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </Link>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="hidden sm:block text-gray-600">{user.name}</span>
                    <button
                      onClick={logout}
                      className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 border border-gray-200 rounded"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <Link href="/login" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  <User size={16} />
                  Login
                </Link>
              )}
              <button className="md:hidden p-2 text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="md:hidden py-3 border-t border-gray-100 flex flex-col gap-2 text-sm font-medium text-gray-600">
              <Link href="/shop" className="py-2 hover:text-blue-600" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/shop/products" className="py-2 hover:text-blue-600" onClick={() => setMenuOpen(false)}>Products</Link>
              {user && <Link href="/shop/orders" className="py-2 hover:text-blue-600" onClick={() => setMenuOpen(false)}>My Orders</Link>}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

    </div>
  )
}
