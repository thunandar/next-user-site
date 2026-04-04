'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Zap, Package, ChevronRight } from 'lucide-react'
import { productsApi, categoriesApi } from '@/lib/api'
import ProductCard from '@/components/shop/ProductCard'
import type { Product } from '@/types'

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50', color: 'text-emerald-600 bg-emerald-50' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: '100% protected checkout', color: 'text-blue-600 bg-blue-50' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '30-day hassle-free returns', color: 'text-violet-600 bg-violet-50' },
  { icon: Zap, title: 'Fast Delivery', desc: 'Same-day dispatch available', color: 'text-amber-600 bg-amber-50' },
]

export default function ShopHomePage() {
  const [latest, setLatest] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    productsApi.getAll({ page: 1, limit: 8, sortBy: 'createdAt', sortOrder: 'DESC' })
      .then(res => setLatest(res.data))
      .catch(() => {})
    categoriesApi.getAll()
      .then(res => setCategories(res.categories.slice(0, 8)))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-20">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 px-8 py-24 md:py-32 text-center max-w-3xl mx-auto space-y-7">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest">
            New arrivals every week
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Shop the Best<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-400">
              Products Online
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
            Thousands of products, unbeatable prices. Discover what everyone is shopping for.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/shop/products"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-500/25"
            >
              Shop Now <ArrowRight size={17} />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white/8 border border-white/15 text-white/90 font-medium px-8 py-3.5 rounded-xl hover:bg-white/15 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={19} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
              <p className="text-sm text-gray-500 mt-1">Find exactly what you're looking for</p>
            </div>
            <Link href="/shop/products" className="hidden sm:flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              All products <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map(cat => (
              <Link
                key={cat}
                href={`/shop/products?category=${encodeURIComponent(cat)}`}
                className="group bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Package size={15} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">{cat}</span>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* New Arrivals */}
      {latest.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
              <p className="text-sm text-gray-500 mt-1">Fresh products just added</p>
            </div>
            <Link href="/shop/products" className="hidden sm:flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {latest.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="flex sm:hidden justify-center">
            <Link href="/shop/products" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all products <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-3xl bg-linear-to-r from-slate-900 to-slate-800 p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">Ready to start shopping?</h2>
          <p className="text-slate-400 mt-2 text-sm">Create a free account and unlock exclusive deals.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/register"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-blue-500/20"
          >
            Get started free
          </Link>
          <Link
            href="/shop/products"
            className="px-6 py-3 bg-white/8 border border-white/15 text-white font-medium rounded-xl hover:bg-white/15 transition-colors text-sm"
          >
            Browse products
          </Link>
        </div>
      </div>

    </div>
  )
}
