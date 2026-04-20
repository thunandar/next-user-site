import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type {
  AuthResponse,
  PaginatedResponse,
  Product,
  ProductFilters,
  RegisterData,
  SingleResponse,
  User,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const buildParams = (obj: Record<string, unknown>): URLSearchParams => {
  const params = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  return params
}

const buildPaginatedResponse = <T>(
  data: T[],
  currentPage: number,
  totalPages: number,
  totalItems: number,
  itemsPerPage: number
): PaginatedResponse<T> => ({
  message: '',
  data,
  pagination: {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  },
})

// ─── Token Management ────────────────────────────────────────────────────────
// access_token: in-memory only + non-HttpOnly cookie (middleware reads it)
// refresh_token: HttpOnly cookie only (set by /api/auth/* routes, JS cannot read it)

let _accessToken: string | null = null

export const tokenStore = {
  getAccess: () => _accessToken,
  set: (access: string) => {
    _accessToken = access
    if (typeof window === 'undefined') return
    document.cookie = `access_token=${access}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
  },
  clear: () => {
    _accessToken = null
    if (typeof window === 'undefined') return
    document.cookie = 'access_token=; path=/; max-age=0'
  },
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

const flushQueue = (err: unknown, token: string | null = null) => {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token!)))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error)

    if (isRefreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const res = await axios.post('/api/auth/refresh')
      const { accessToken } = res.data.data
      tokenStore.set(accessToken)
      flushQueue(null, accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (err) {
      flushQueue(err)
      tokenStore.clear()
      await axios.post('/api/auth/logout').catch(() => {})
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const res = await axios.post('/api/auth/register', data)
    const { user, accessToken } = res.data.data as { user: User; accessToken: string }
    return { message: res.data.message, user, tokens: { accessToken, refreshToken: '' } }
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { user, accessToken } = res.data.data as { user: User; accessToken: string }
    return { message: res.data.message, user, tokens: { accessToken, refreshToken: '' } }
  },
  logout: async (): Promise<void> => {
    try { await api.post('/auth/logout') } catch { /* ignore if access token already expired */ }
    await axios.post('/api/auth/logout')
  },
  getMe: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me')
    return { user: res.data.data as User }
  },
}

// ─── Products API ─────────────────────────────────────────────────────────────

export const productsApi = {
  getAll: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const res = await api.get(`/products?${buildParams(filters as Record<string, unknown>)}`)
    const { products, currentPage, totalPages, totalProducts } = res.data.data
    return buildPaginatedResponse(products, currentPage, totalPages, totalProducts, Number(filters.limit) || 10)
  },

  getById: async (id: number): Promise<SingleResponse<Product>> => {
    const res = await api.get(`/products/${id}`)
    return { message: '', data: res.data.data as Product }
  },

  search: async (term: string, page = 1, limit = 10): Promise<PaginatedResponse<Product>> => {
    const res = await api.get(`/products/search?${buildParams({ search: term, page, limit })}`)
    const { products, currentPage, totalPages, totalProducts } = res.data.data
    return buildPaginatedResponse(products, currentPage, totalPages, totalProducts, limit)
  },
}

// ─── Categories API ───────────────────────────────────────────────────────────

export const categoriesApi = {
  getAll: async (): Promise<{ categories: string[] }> => {
    const res = await api.get('/categories')
    return { categories: res.data.data as string[] }
  },
}

// ─── Orders API ───────────────────────────────────────────────────────────────

export const ordersApi = {
  create: async (data: import('@/types').CreateOrderData): Promise<import('@/types').Order> => {
    const res = await api.post('/orders', data)
    return res.data.data as import('@/types').Order
  },
  getMy: async (page = 1, limit = 20): Promise<{ orders: import('@/types').Order[]; totalPages: number; currentPage: number; totalOrders: number }> => {
    const res = await api.get(`/orders/my?page=${page}&limit=${limit}`)
    return res.data.data as { orders: import('@/types').Order[]; totalPages: number; currentPage: number; totalOrders: number }
  },
  updateStatus: async (id: number, status: string): Promise<import('@/types').Order> => {
    const res = await api.patch(`/orders/${id}/status`, { status })
    return res.data.data as import('@/types').Order
  },
}

// ─── Reviews API ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  getAll: async (productId: number): Promise<{ reviews: import('@/types').Review[]; avgRating: number | null; totalReviews: number }> => {
    const res = await api.get(`/products/${productId}/reviews`)
    return res.data.data as { reviews: import('@/types').Review[]; avgRating: number | null; totalReviews: number }
  },
  create: async (productId: number, data: { rating: number; comment?: string }): Promise<import('@/types').Review> => {
    const res = await api.post(`/products/${productId}/reviews`, data)
    return res.data.data as import('@/types').Review
  },
}

// ─── Wishlist API ─────────────────────────────────────────────────────────────

export const wishlistApi = {
  getAll: async (): Promise<{ data: import('@/types').WishlistItem[] }> => {
    const res = await api.get('/wishlist')
    return { data: res.data.data as import('@/types').WishlistItem[] }
  },
  add: async (productId: number): Promise<void> => { await api.post(`/wishlist/${productId}`) },
  remove: async (productId: number): Promise<void> => { await api.delete(`/wishlist/${productId}`) },
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export const trackProductView = (productId: number) => {
  api.post(`/products/${productId}/view`).catch(() => {})
}

export function getApiErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback
}

export default api
