export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { signToken, COOKIE_NAME } from '@/lib/jwt'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, password, displayName } = parsed.data
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
}
