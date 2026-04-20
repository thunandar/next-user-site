import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { email, password } = body as Record<string, unknown>
  if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
  }

  const backendRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await backendRes.json()

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status })
  }

  const { accessToken, refreshToken, user } = data.data

  const response = NextResponse.json({
    success: true,
    message: data.message,
    data: { user, accessToken },
  })

  if (refreshToken) {
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE,
      path: '/',
    })
  }

  return response
}
