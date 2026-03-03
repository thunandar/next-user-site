'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react'
import { productsApi } from '@/lib/api'
import ProductCard from '@/components/shop/ProductCard'
import type { Product } from '@/types'

export default function ShopHomePage() {
  const [latest, setLatest] = useState<Product[]>([])

  useEffect(() => {
    productsApi.getAll({ page: 1, limit: 4, sortBy: 'createdAt', sortOrder: 'DESC' })
      .then(res => setLatest(res.data))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Shop the Best Products
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          Discover thousands of products at great prices. Fast shipping, easy returns.
        </p>
        <Link
          href="/shop/products"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Browse Products <ArrowRight size={18} />
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Truck, title: 'Fast Delivery', desc: 'Free shipping on orders over $50' },
          { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure payment processing' },
          { icon: RefreshCw, title: 'Easy Returns', desc: '30-day hassle-free return policy' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Products */}
      {latest.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Latest Products</h2>
            <Link href="/shop/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {latest.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
