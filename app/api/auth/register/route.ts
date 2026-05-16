import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, password, role } = body as Record<string, unknown>
  if (typeof name !== 'string' || !name || typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
    return NextResponse.json({ message: 'Name, email and password are required' }, { status: 400 })
  }

  const backendRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  })

  const data = await backendRes.json()
  return NextResponse.json(data, { status: backendRes.status })
}
