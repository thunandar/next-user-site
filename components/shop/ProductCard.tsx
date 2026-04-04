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
    <Link
      href={`/shop/products/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${stockStatus === 'out' ? 'opacity-50 grayscale' : ''}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Out of stock */}
        {stockStatus === 'out' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-gray-900/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low stock */}
        {stockStatus === 'low' && (
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Only {product.stock} left
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md border transition-all duration-200 ${
            inWishlist
              ? 'bg-rose-500 border-rose-500 text-white scale-110'
              : 'bg-white/90 border-white text-gray-400 hover:text-rose-500 hover:scale-110'
          }`}
        >
          <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {product.category && (
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
            {product.category}
          </span>
        )}

        <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {avgRating != null && avgRating > 0 && (
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-xs text-gray-500 font-medium">{avgRating.toFixed(1)}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-base font-bold text-gray-900">{formatCurrency(product.price)}</span>
          <button
            onClick={handleAddToCart}
            disabled={stockStatus === 'out'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              stockStatus === 'out'
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            <ShoppingCart size={13} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </Link>
  )
}
