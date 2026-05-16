import { NextRequest, NextResponse } from 'next/server'
import { API_URL, REFRESH_COOKIE_NAME, refreshCookieOptions } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { email, code } = body as Record<string, unknown>
  if (typeof email !== 'string' || !email || typeof code !== 'string' || !code) {
    return NextResponse.json({ message: 'Email and code are required' }, { status: 400 })
  }

  const backendRes = await fetch(`${API_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })

  const data = await backendRes.json()
  if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status })

  const { accessToken, refreshToken, user } = data.data
  const response = NextResponse.json({
    success: true,
    message: data.message,
    data: { user, accessToken },
  })

  if (refreshToken) {
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions)
  }

  return response
}
