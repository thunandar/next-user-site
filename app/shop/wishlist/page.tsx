'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { wishlistApi } from '@/lib/api'
import { useWishlist } from '@/context/WishlistContext'
import ProductCard from '@/components/shop/ProductCard'
import { PageLoader } from '@/components/ui/Spinner'
import type { Product } from '@/types'

export default function WishlistPage() {
  const { ids, refresh: syncContext } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    wishlistApi.getAll()
      .then(res => {
        setProducts(res.data.map((item: { product: Product }) => item.product).filter(Boolean))
        syncContext() // keep context in sync with what we just fetched
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Filter out products that have been removed via the wishlist context (e.g. via ProductCard toggle)
  const displayedProducts = products.filter(p => ids.has(p.id))

  if (loading) return <PageLoader />

  if (displayedProducts.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <Heart size={48} className="mx-auto text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">Your wishlist is empty</h2>
        <Link href="/shop/products" className="text-blue-600 hover:text-blue-700 font-medium">Discover Products</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Wishlist ({displayedProducts.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedProducts.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}
