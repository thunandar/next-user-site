'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Package, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsApi, reviewsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { formatCurrency, formatDate, getImageUrl, getStockStatus } from '@/lib/utils'
import StarRating from '@/components/shop/StarRating'
import { PageLoader } from '@/components/ui/Spinner'
import type { Product, Review } from '@/types'

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
      .then(({ data }) => { setProduct(data); loadReviews(data.id) })
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
    await toggle(product!.id)
    toast.success(isInWishlist(product!.id) ? 'Removed from wishlist' : 'Added to wishlist')
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

  if (loading) return <PageLoader />
  if (!product) return null

  const images = product.ProductImages || []
  const stockStatus = getStockStatus(product.stock)
  const inWishlist = isInWishlist(product.id)

  return (
    <div className="space-y-10">
      <Link href="/shop/products" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            {images[activeImg] ? (
              <Image src={getImageUrl(images[activeImg].imageUrl)} alt={product.name} width={600} height={600} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={80} className="text-gray-300" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
                >
                  <Image src={getImageUrl(img.imageUrl)} alt={`${product.name} ${i + 1}`} width={80} height={80} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.category && <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">{product.category}</span>}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {avgRating !== null && (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(avgRating)} />
              <span className="text-sm text-gray-500">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
            </div>
          )}

          <p className="text-3xl font-bold text-blue-600">{formatCurrency(product.price)}</p>

          {product.description && <p className="text-gray-600 leading-relaxed">{product.description}</p>}

          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              stockStatus === 'ok' ? 'bg-green-100 text-green-700' :
              stockStatus === 'low' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {stockStatus === 'ok' ? 'In Stock' : stockStatus === 'low' ? `Only ${product.stock} left` : 'Out of Stock'}
            </span>
          </div>

          {stockStatus !== 'out' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              <button onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
          )}

          <button onClick={handleWishlist}
            className={`w-full py-3 rounded-xl border font-medium transition-colors ${
              inWishlist ? 'border-red-300 text-red-500 bg-red-50 hover:bg-red-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {inWishlist ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
          </button>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Reviews ({reviews.length})</h2>

        {user && (
          <form onSubmit={handleReview} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-900">Write a Review</h3>
            <StarRating value={rating} interactive onChange={setRating} />
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button type="submit" disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{r.user?.name ?? 'User'}</p>
                    <StarRating value={r.rating} size={14} />
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                </div>
                {r.comment && <p className="text-sm text-gray-600 mt-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
