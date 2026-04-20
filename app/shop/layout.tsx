'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Package, Menu, X, ChevronDown, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useWishlist } from '@/context/WishlistContext'

function UserDropdown({ user, logout }: { user: { name: string; email: string }; logout: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
      >
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block max-w-25 truncate">{user.name.split(' ')[0]}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <div className="pt-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const { totalItems } = useCart()
  const { user, logout } = useAuth()
  const { ids } = useWishlist()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const baseLinks = [
    { href: '/shop', label: 'Home', badge: null as number | null },
    { href: '/shop/products', label: 'Products', badge: null as number | null },
  ]

  const userLinks = user
    ? [
        { href: '/shop/wishlist', label: 'Wishlist', badge: ids.size > 0 ? ids.size : null },
        { href: '/shop/orders', label: 'My Orders', badge: null },
      ]
    : []

  const allNavLinks = [...baseLinks, ...userLinks]

  const isActive = (href: string) =>
    href === '/shop' ? pathname === '/shop' : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <Link href="/shop" className="flex items-center gap-2 font-bold text-lg text-gray-900 shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package size={16} className="text-white" aria-hidden="true" />
              </div>
              <span className="hidden sm:block">ProductHub</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {allNavLinks.map(({ href, label, badge }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {label}
                  {badge != null && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full min-w-4 h-4 flex items-center justify-center font-bold leading-none px-0.5">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/shop/cart"
                    aria-label={`Cart${totalItems > 0 ? `, ${totalItems} item${totalItems !== 1 ? 's' : ''}` : ''}`}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
                  >
                    <ShoppingCart size={20} aria-hidden="true" />
                    {totalItems > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none" aria-hidden="true">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </Link>
                  <UserDropdown user={user} logout={logout} />
                </>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get started
                  </Link>
                </div>
              )}

              <button
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav aria-label="Mobile navigation" className="md:hidden py-3 border-t border-gray-100 space-y-1">
              {allNavLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(href) ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/shop/cart"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cart
                  {totalItems > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              {!user && (
                <div className="flex gap-2 pt-2 px-1">
                  <Link href="/login" onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    Sign in
                  </Link>
                  <Link href="/register" onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    Get started
                  </Link>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package size={14} className="text-white" aria-hidden="true" />
              </div>
              ProductHub
            </div>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} ProductHub. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link href="/shop/products" className="hover:text-gray-900 transition-colors">Products</Link>
              {user
                ? <Link href="/shop/orders" className="hover:text-gray-900 transition-colors">My Orders</Link>
                : <Link href="/register" className="hover:text-gray-900 transition-colors">Register</Link>
              }
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
