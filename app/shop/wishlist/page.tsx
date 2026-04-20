'use client'

import { useEffect, useState } from 'react'
import { Heart, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { wishlistApi } from '@/lib/api'
import { useWishlist } from '@/context/WishlistContext'
import ProductCard from '@/components/shop/ProductCard'
import { PageLoader } from '@/components/ui/Spinner'
import type { Product } from '@/types'

export default function WishlistPage() {
  const { ids, refresh: syncContext } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    wishlistApi.getAll()
      .then(res => {
        setProducts(res.data.map((item: { product: Product }) => item.product).filter(Boolean))
        syncContext()
      })
      .catch(() => {
        toast.error('Failed to load wishlist')
        setFetchError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const displayedProducts = products.filter(p => ids.has(p.id))

  if (loading) return <PageLoader />

  if (fetchError) return (
    <div className="text-center py-24 space-y-3 text-gray-400">
      <AlertCircle size={48} className="mx-auto opacity-40" />
      <p className="text-lg font-medium">Failed to load wishlist</p>
      <p className="text-sm">Check your connection and try refreshing.</p>
    </div>
  )

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
