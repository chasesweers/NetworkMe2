export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'
import { serverError } from '@/lib/apiHelpers'
import { sendPasswordResetEmail } from '@/lib/email'
import { generateResetToken, hashResetToken, resetTokenExpiresAt } from '@/lib/resetToken'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email().max(254),
})

export async function POST(req: NextRequest) {
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

  const { email } = parsed.data

  try {
    const db = getDb()
    const user = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email) as { id: number } | undefined

    // Always return 200 — don't reveal whether the email exists
    if (!user) return NextResponse.json({ ok: true })

    const rawToken = generateResetToken()
    const tokenHash = hashResetToken(rawToken)
    const expiresAt = resetTokenExpiresAt()

    // Invalidate any previous unused tokens for this user
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0')
      .run(user.id)

    db.prepare(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    ).run(user.id, tokenHash, expiresAt)

    await sendPasswordResetEmail(email, rawToken)

    return NextResponse.json({ ok: true })
  } catch (err) { return serverError(err) }
}
