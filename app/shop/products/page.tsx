'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { productsApi, categoriesApi } from '@/lib/api'
import ProductCard from '@/components/shop/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import Pagination from '@/components/ui/Pagination'
import type { Product, Pagination as PaginationType } from '@/types'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState(() => searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  useEffect(() => {
    categoriesApi.getAll().then(res => setCategories(res.categories)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setFetchError(false)
    const fetch = search
      ? productsApi.search(search, page, 12)
      : productsApi.getAll({ page, limit: 12, category: category || undefined, sortBy, sortOrder })

    fetch
      .then(res => { setProducts(res.data); setPagination('pagination' in res ? res.pagination : null) })
      .catch(() => {
        toast.error('Failed to load products')
        setFetchError(true)
      })
      .finally(() => setLoading(false))
  }, [page, search, category, sortBy, sortOrder])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1" role="search">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
              className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors">
              Clear
            </button>
          )}
        </form>

        <select
          value={`${sortBy}_${sortOrder}`}
          onChange={e => {
            const parts = e.target.value.split('_')
            const by = parts[0] ?? 'createdAt'
            const order = parts[1] ?? 'DESC'
            setSortBy(by)
            setSortOrder(order as 'ASC' | 'DESC')
            setPage(1)
          }}
          aria-label="Sort products"
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="createdAt_DESC">Newest</option>
          <option value="price_ASC">Price: Low to High</option>
          <option value="price_DESC">Price: High to Low</option>
          <option value="name_ASC">Name A–Z</option>
        </select>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
          <button
            onClick={() => { setCategory(''); setPage(1) }}
            aria-pressed={!category}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              !category
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1) }}
              aria-pressed={category === cat}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : fetchError ? (
        <div className="text-center py-20 text-gray-400">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Failed to load products</p>
          <p className="text-sm mt-1">Check your connection and try refreshing.</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No products found</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </>
      )}
    </div>
  )
}
