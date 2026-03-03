'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, getPrimaryImage, getStockStatus } from '@/lib/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  product: Product
  avgRating?: number | null
}

export default function ProductCard({ product, avgRating }: Props) {
  const { addToCart } = useCart()
  const { toggle, isInWishlist } = useWishlist()
  const { user } = useAuth()
  const primaryImage = getPrimaryImage(product.ProductImages)
  const stockStatus = getStockStatus(product.stock)
  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (stockStatus === 'out') return
    addToCart(product)
    toast.success(`${product.name} added to cart`)
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) { toast.error('Please login to save items'); return }
    await toggle(product.id)
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <Link href={`/shop/products/${product.id}`} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full shadow transition-colors ${
            inWishlist ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 hover:text-red-400'
          }`}
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
        {stockStatus === 'out' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {product.category && (
          <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">{product.category}</span>
        )}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        {avgRating != null && (
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500">{avgRating.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
          <button
            onClick={handleAddToCart}
            disabled={stockStatus === 'out'}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </Link>
  )
}
