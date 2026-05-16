import { NextRequest, NextResponse } from 'next/server'
import { API_URL, REFRESH_COOKIE_NAME, refreshCookieOptions } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { idToken } = body as Record<string, unknown>
  if (typeof idToken !== 'string' || !idToken) {
    return NextResponse.json({ message: 'Google credential is required' }, { status: 400 })
  }

  const backendRes = await fetch(`${API_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
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
