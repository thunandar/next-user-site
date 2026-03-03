'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { productsApi, categoriesApi } from '@/lib/api'
import ProductCard from '@/components/shop/ProductCard'
import { PageLoader } from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import type { Product, Pagination as PaginationType } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<PaginationType | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  useEffect(() => {
    categoriesApi.getAll().then(res => setCategories(res.categories)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const fetch = search
      ? productsApi.search(search, page, 12)
      : productsApi.getAll({ page, limit: 12, category: category || undefined, sortBy, sortOrder })

    fetch
      .then(res => { setProducts(res.data); setPagination('pagination' in res ? res.pagination : null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, search, category, sortBy, sortOrder])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
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

        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={e => {
              const [by, order] = e.target.value.split('_')
              setSortBy(by); setSortOrder(order as 'ASC' | 'DESC'); setPage(1)
            }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt_DESC">Newest</option>
            <option value="price_ASC">Price: Low → High</option>
            <option value="price_DESC">Price: High → Low</option>
            <option value="name_ASC">Name A–Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader />
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
