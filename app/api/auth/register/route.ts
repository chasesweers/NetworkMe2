export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { signToken, COOKIE_NAME } from '@/lib/jwt'
import { checkRateLimit } from '@/lib/rateLimit'
import { serverError } from '@/lib/apiHelpers'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(1024),
  displayName: z.string().max(100).optional(),
})

export async function POST(req: NextRequest) {
  if (process.env.OPEN_REGISTRATION !== 'true') {
    return NextResponse.json({ error: 'Registration is closed' }, { status: 403 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const { limited, retryAfterSecs } = checkRateLimit(ip)
  if (limited) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, password, displayName } = parsed.data

  try {
    const db = getDb()
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const result = db
      .prepare('INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)')
      .run(email, displayName ?? null, passwordHash)

    const userId = result.lastInsertRowid as number
    const token = await signToken({ userId, email, isAdmin: false })

    const res = NextResponse.json({
      user: { id: userId, email, displayName: displayName ?? null },
      token,
    })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch (err) { return serverError(err) }
}
