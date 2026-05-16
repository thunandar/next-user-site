import { NextRequest, NextResponse } from 'next/server'
import { API_URL, REFRESH_COOKIE_NAME, refreshCookieOptions } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: 'No refresh token' }, { status: 401 })
  }

  const backendRes = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const data = await backendRes.json()

  if (!backendRes.ok) {
    const response = NextResponse.json(data, { status: backendRes.status })
    response.cookies.delete(REFRESH_COOKIE_NAME)
    return response
  }

  const { accessToken, refreshToken: newRefreshToken } = data.data as { accessToken: string; refreshToken?: string }

  const response = NextResponse.json({ success: true, data: { accessToken } })

  // Rotate the refresh token if the backend returned a new one
  if (newRefreshToken) {
    response.cookies.set(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions)
  }

  return response
}
