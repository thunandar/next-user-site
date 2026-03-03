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

// ─── Token Management ────────────────────────────────────────────────────────

export const tokenStore = {
  getAccess: () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null),
  getRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null),
  set: (access: string, refresh: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    document.cookie = `access_token=${access}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
  },
  clear: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
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
    const refreshToken = tokenStore.getRefresh()

    if (!refreshToken) {
      tokenStore.clear()
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
      const { accessToken } = res.data
      tokenStore.set(accessToken, refreshToken)
      flushQueue(null, accessToken)
      return api(original)
    } catch (err) {
      flushQueue(err)
      tokenStore.clear()
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
    const res = await api.post('/auth/register', data)
    const { user, accessToken, refreshToken } = res.data.data
    return { message: res.data.message, user, tokens: { accessToken, refreshToken } }
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { email, password })
    const { user, accessToken, refreshToken } = res.data.data
    return { message: res.data.message, user, tokens: { accessToken, refreshToken } }
  },
  logout: async (): Promise<void> => { await api.post('/auth/logout') },
  getMe: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me')
    return { user: res.data.data }
  },
}

// ─── Products API ─────────────────────────────────────────────────────────────

export const productsApi = {
  getAll: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
    })
    const res = await api.get(`/products?${params}`)
    const { products, currentPage, totalPages, totalProducts } = res.data.data
    return {
      message: '',
      data: products,
      pagination: {
        currentPage,
        totalPages,
        totalItems: totalProducts,
        itemsPerPage: Number(filters.limit) || 10,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    }
  },

  getById: async (id: number): Promise<SingleResponse<Product>> => {
    const res = await api.get(`/products/${id}`)
    return { message: '', data: res.data.data }
  },

  search: async (term: string, page = 1, limit = 10): Promise<PaginatedResponse<Product>> => {
    const res = await api.get(`/products/search?search=${encodeURIComponent(term)}&page=${page}&limit=${limit}`)
    const { products, currentPage, totalPages, totalProducts } = res.data.data
    return {
      message: '',
      data: products,
      pagination: {
        currentPage,
        totalPages,
        totalItems: totalProducts,
        itemsPerPage: limit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    }
  },
}

// ─── Categories API ───────────────────────────────────────────────────────────

export const categoriesApi = {
  getAll: async (): Promise<{ categories: string[] }> => {
    const res = await api.get('/categories')
    return { categories: res.data.data }
  },
}

// ─── Orders API ───────────────────────────────────────────────────────────────

export const ordersApi = {
  create: async (data: import('@/types').CreateOrderData) => {
    const res = await api.post('/orders', data)
    return res.data.data as import('@/types').Order
  },
  getMy: async (page = 1, limit = 20) => {
    const res = await api.get(`/orders/my?page=${page}&limit=${limit}`)
    return res.data.data as { orders: import('@/types').Order[]; totalPages: number; currentPage: number; totalOrders: number }
  },
  updateStatus: async (id: number, status: string) => {
    const res = await api.patch(`/orders/${id}/status`, { status })
    return res.data.data as import('@/types').Order
  },
}

// ─── Reviews API ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  getAll: async (productId: number) => {
    const res = await api.get(`/products/${productId}/reviews`)
    return res.data.data as { reviews: import('@/types').Review[]; avgRating: number | null; totalReviews: number }
  },
  create: async (productId: number, data: { rating: number; comment?: string }) => {
    const res = await api.post(`/products/${productId}/reviews`, data)
    return res.data.data as import('@/types').Review
  },
}

// ─── Wishlist API ─────────────────────────────────────────────────────────────

export const wishlistApi = {
  getAll: async () => {
    const res = await api.get('/wishlist')
    return { data: res.data.data as import('@/types').WishlistItem[] }
  },
  add: async (productId: number) => { await api.post(`/wishlist/${productId}`) },
  remove: async (productId: number) => { await api.delete(`/wishlist/${productId}`) },
}

export default api
