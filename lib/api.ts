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

// Rehydrate the in-memory token from the cookie on first client-side import.
// Without this, every page load starts with no Authorization header, forcing a
// refresh round-trip — which also breaks Playwright runs because the backend
// rotates refresh tokens and only the first test can succeed.
if (typeof document !== 'undefined') {
  const found = document.cookie.split('; ').find((c) => c.startsWith('access_token='))
  if (found) _accessToken = found.slice('access_token='.length)
}

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

export interface PendingVerification {
  message: string
  email: string
  pendingVerification: true
}

export const authApi = {
  register: async (data: RegisterData): Promise<PendingVerification> => {
    const res = await axios.post('/api/auth/register', data)
    return { message: res.data.message, email: data.email, pendingVerification: true }
  },
  verifyEmail: async (email: string, code: string): Promise<AuthResponse> => {
    const res = await axios.post('/api/auth/verify-email', { email, code })
    const { user, accessToken } = res.data.data as { user: User; accessToken: string }
    return { message: res.data.message, user, tokens: { accessToken, refreshToken: '' } }
  },
  resendVerification: async (email: string): Promise<void> => {
    await axios.post('/api/auth/resend-verification', { email })
  },
  google: async (idToken: string): Promise<AuthResponse> => {
    const res = await axios.post('/api/auth/google', { idToken })
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

  getStorefrontStats: async (): Promise<{ totalProducts: number; totalVendors: number; avgRating: number | null; totalReviews: number }> => {
    const res = await api.get('/products/stats')
    return res.data.data as { totalProducts: number; totalVendors: number; avgRating: number | null; totalReviews: number }
  },
}

// ─── Categories API ───────────────────────────────────────────────────────────

export interface Category {
  id: number
  name: string
  slug: string
}

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const res = await api.get('/categories')
    return res.data.data as Category[]
  },
}

// ─── Vendors API ──────────────────────────────────────────────────────────────

export interface Vendor {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  websiteUrl: string | null
  status: 'active' | 'inactive'
}

export const vendorsApi = {
  list: async (params: { status?: string } = { status: 'active' }): Promise<Vendor[]> => {
    const res = await api.get('/vendors', { params })
    return res.data.data as Vendor[]
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
  getById: async (id: number): Promise<import('@/types').Order> => {
    const res = await api.get(`/orders/${id}`)
    return res.data.data as import('@/types').Order
  },
  updateStatus: async (id: number, status: string): Promise<import('@/types').Order> => {
    const res = await api.patch(`/orders/${id}/status`, { status })
    return res.data.data as import('@/types').Order
  },
}

// ─── Reviews API ──────────────────────────────────────────────────────────────

export type ReviewEligibility = {
  canReview: boolean
  reason: 'unauthenticated' | 'not_purchased' | 'already_reviewed' | null
  alreadyReviewed: boolean
}

export type ReviewsPage = {
  reviews: import('@/types').Review[]
  avgRating: number | null
  totalReviews: number
  totalPages: number
  currentPage: number
  eligibility: ReviewEligibility
}

export const reviewsApi = {
  getAll: async (productId: number, page = 1, limit = 10): Promise<ReviewsPage> => {
    const res = await api.get(`/products/${productId}/reviews?page=${page}&limit=${limit}`)
    return res.data.data as ReviewsPage
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

// Records that a visitor reached the checkout page. The admin uses this to
// surface "abandoned" sessions (started checkout, no order placed). Body must
// match the backend AbandonedCheckoutController.record schema.
export const recordAbandonedCheckout = (payload: {
  email?: string | null
  items: Array<{ productId: number; name?: string; quantity: number; price: number }>
  totalAmount: number
}) => {
  if (typeof window === 'undefined') return
  api.post('/abandoned-checkouts', payload).catch(() => {})
}

// Captures the visitor's referrer + utm_* URL params alongside the view, so the
// admin can break down traffic by source. Runs in the browser only — SSR is a
// no-op since `window` is undefined there.
export const trackProductView = (productId: number) => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const body = {
    referrer: document.referrer || undefined,
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  }
  api.post(`/products/${productId}/view`, body).catch(() => {})
}

// ─── Addresses ────────────────────────────────────────────────────────────────

export interface Address {
  id: number
  userId: number
  name: string
  line1: string
  line2?: string | null
  city: string
  region?: string | null
  postal: string
  country: string
  phone?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export const addressesApi = {
  list: async (): Promise<Address[]> => {
    const res = await api.get('/addresses')
    return res.data.data as Address[]
  },
  create: async (data: Omit<Partial<Address>, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Address> => {
    const res = await api.post('/addresses', data)
    return res.data.data as Address
  },
  update: async (id: number, data: Partial<Address>): Promise<Address> => {
    const res = await api.put(`/addresses/${id}`, data)
    return res.data.data as Address
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/addresses/${id}`)
  },
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export interface CouponValidation {
  code: string
  kind: 'percent' | 'amount'
  value: number
  description?: string | null
  discount: number
}

export const couponsApi = {
  validate: async (code: string, subtotal: number): Promise<CouponValidation> => {
    const res = await api.post('/coupons/validate', { code, subtotal })
    return res.data.data as CouponValidation
  },
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export interface JournalPost {
  id: number
  slug: string
  title: string
  eyebrow: string | null
  excerpt: string | null
  body: string
  coverImageUrl: string | null
  coverImageFilename: string | null
  author: string | null
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export const journalApi = {
  list: async (page = 1, limit = 12): Promise<{ posts: JournalPost[]; totalPages: number; currentPage: number; totalPosts: number }> => {
    const res = await api.get(`/journal?${buildParams({ page, limit })}`)
    return res.data.data
  },
  getBySlug: async (slug: string): Promise<JournalPost> => {
    const res = await api.get(`/journal/slug/${encodeURIComponent(slug)}`)
    return res.data.data
  },
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export interface PromoBannerSetting {
  enabled: boolean
  message: string
}

export interface HeroSetting {
  eyebrow: string
  headlineLead: string
  headlineAccent: string
  headlineTrail: string
  body: string
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
}

export interface BrandSetting {
  name: string
  tagline: string
  location: string
}

export const TRUST_ICON_KEYS = ['truck', 'refund', 'shield', 'chat', 'ship', 'globe', 'spark', 'tag', 'heart', 'star'] as const
export type TrustIconKey = (typeof TRUST_ICON_KEYS)[number]

export interface TrustItem {
  iconKey: TrustIconKey
  title: string
  sub: string
}

export interface TrustSetting {
  items: TrustItem[]
}

export interface SiteSettings {
  promoBanner: PromoBannerSetting
  hero: HeroSetting
  brand: BrandSetting
  trust: TrustSetting
}

export const settingsApi = {
  getPublic: async (): Promise<SiteSettings> => {
    const res = await api.get('/settings/public')
    return res.data.data as SiteSettings
  },
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileApi = {
  get: async (): Promise<User> => {
    const res = await api.get('/profile')
    return res.data.data as User
  },
  update: async (patch: Partial<User>): Promise<User> => {
    const res = await api.put('/profile', patch)
    return res.data.data as User
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/profile/password', { currentPassword, newPassword })
  },
}

export function getApiErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback
}

export default api
