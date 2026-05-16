import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { email } = body as Record<string, unknown>
  if (typeof email !== 'string' || !email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 })
  }

  const backendRes = await fetch(`${API_URL}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data = await backendRes.json()
  return NextResponse.json(data, { status: backendRes.status })
}
