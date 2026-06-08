import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME, type JWTPayload } from './jwt'

export async function requireAdmin(req: NextRequest): Promise<JWTPayload> {
  const payload = await requireAuth(req)
  if (!payload.isAdmin) {
    throw NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return payload
}

export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const authHeader = req.headers.get('authorization') ?? ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value ?? null
  const token = bearerToken ?? cookieToken

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    return await verifyToken(token)
  } catch {
    throw new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
