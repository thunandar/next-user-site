// Server-only config used by /api/auth/* route handlers. Centralised so the
// backend URL and refresh-cookie settings aren't redeclared in every handler.

export const API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const REFRESH_COOKIE_NAME = 'refresh_token'

export const REFRESH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  path: '/',
}
