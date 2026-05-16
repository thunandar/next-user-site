import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_REQUIRED = ['/shop/cart', '/shop/checkout', '/shop/orders', '/shop/wishlist']
const PUBLIC_PATHS = ['/login', '/register']

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.includes(pathname)
  const requiresAuth = AUTH_REQUIRED.some(p => pathname.startsWith(p))

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/shop', request.url))
  }
  if (!token && requiresAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
