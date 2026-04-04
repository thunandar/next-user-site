'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Package, ShoppingCart, Heart, ChevronRight, Share2, Truck, Shield, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsApi, reviewsApi, trackProductView } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { formatCurrency, formatDate, getImageUrl, getStockStatus } from '@/lib/utils'
import StarRating from '@/components/shop/StarRating'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Product, Review } from '@/types'

function DetailSkeleton() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { toggle, isInWishlist } = useWishlist()

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadReviews = async (productId: number) => {
    try {
      const res = await reviewsApi.getAll(productId)
      setReviews(res.reviews)
      setAvgRating(res.avgRating !== null && res.avgRating !== undefined ? Number(res.avgRating) : null)
    } catch {}
  }

  useEffect(() => {
    productsApi.getById(Number(id))
      .then(({ data }) => {
        setProduct(data)
        loadReviews(data.id)
        trackProductView(data.id)
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    addToCart(product, qty)
    toast.success(`${product.name} added to cart`)
  }

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login first'); return }
    const wasInWishlist = isInWishlist(product!.id)
    await toggle(product!.id)
    toast.success(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !product) { toast.error('Please login to review'); return }
    setSubmitting(true)
    try {
      await reviewsApi.create(product.id, { rating, comment })
      toast.success('Review submitted!')
      setComment('')
      setRating(5)
      loadReviews(product.id)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <DetailSkeleton />
  if (!product) return null

  const images = product.ProductImages || []
  const stockStatus = getStockStatus(product.stock)
  const inWishlist = isInWishlist(product.id)

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/shop" className="hover:text-gray-600 transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link href="/shop/products" className="hover:text-gray-600 transition-colors">Products</Link>
        {product.category && (
          <>
            <ChevronRight size={14} />
            <Link href={`/shop/products?category=${encodeURIComponent(product.category)}`} className="hover:text-gray-600 transition-colors">
              {product.category}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-gray-600 font-medium truncate max-w-48">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
            {images[activeImg] ? (
              <Image
                src={getImageUrl(images[activeImg].imageUrl)}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={80} className="text-gray-200" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                    i === activeImg ? 'border-blue-500' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <Image
                    src={getImageUrl(img.imageUrl)}
                    alt={`${product.name} ${i + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.category && (
            <Link
              href={`/shop/products?category=${encodeURIComponent(product.category)}`}
              className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
            >
              {product.category}
            </Link>
          )}

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            {avgRating !== null && (
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(avgRating)} size={16} />
                <span className="text-sm text-gray-500">
                  {avgRating.toFixed(1)} <span className="text-gray-300">·</span> {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
          </div>

          {product.description && (
            <p className="text-gray-500 leading-relaxed text-sm">{product.description}</p>
          )}

          {/* Stock status */}
          <div>
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
              stockStatus === 'ok' ? 'bg-green-50 text-green-700' :
              stockStatus === 'low' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                stockStatus === 'ok' ? 'bg-green-500' :
                stockStatus === 'low' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              {stockStatus === 'ok' ? 'In Stock' : stockStatus === 'low' ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>

          {/* Qty + Add to cart */}
          {stockStatus !== 'out' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="px-3 py-2.5 hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="px-4 py-2 font-semibold text-gray-900 min-w-12 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="px-3 py-2.5 hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
              <button
                onClick={handleWishlist}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-colors text-sm ${
                  inWishlist
                    ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                {inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleWishlist}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-colors text-sm ${
                inWishlist
                  ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
              {inWishlist ? 'Remove from Wishlist' : 'Notify me when available'}
            </button>
          )}

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            {[
              { icon: Truck, label: 'Free shipping', sub: 'On orders over $50' },
              { icon: Shield, label: 'Secure checkout', sub: '256-bit encryption' },
              { icon: RotateCcw, label: 'Easy returns', sub: '30-day policy' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1 py-2">
                <Icon size={18} className="text-blue-600" />
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <p className="text-[10px] text-gray-400">{sub}</p>
              </div>
            ))}
          </div>

          {/* Share */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success('Link copied!')
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Share2 size={14} />
            Share this product
          </button>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Customer Reviews
            {reviews.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({reviews.length})</span>
            )}
          </h2>
          {avgRating !== null && reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
              <div>
                <StarRating value={Math.round(avgRating)} size={16} />
                <p className="text-xs text-gray-400 mt-0.5">{reviews.length} reviews</p>
              </div>
            </div>
          )}
        </div>

        {user && (
          <form onSubmit={handleReview} className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
            <h3 className="font-semibold text-gray-900">Write a Review</h3>
            <div className="space-y-1">
              <label className="text-sm text-gray-500">Your rating</label>
              <StarRating value={rating} interactive onChange={setRating} />
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={3}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm mt-1">{user ? 'Be the first to review this product' : 'Login to write the first review'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                      {(r.user?.name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.user?.name ?? 'User'}</p>
                      <StarRating value={r.rating} size={12} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{formatDate(r.createdAt)}</p>
                </div>
                {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
