export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'
import { hashResetToken } from '@/lib/resetToken'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(1024),
})

interface TokenRow {
  id: number
  user_id: number
  expires_at: number
  used: number
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { token, newPassword } = parsed.data

  try {
    const db = getDb()
    const tokenHash = hashResetToken(token)
    const now = Math.floor(Date.now() / 1000)

    const row = db
      .prepare('SELECT id, user_id, expires_at, used FROM password_reset_tokens WHERE token_hash = ?')
      .get(tokenHash) as TokenRow | undefined

    if (!row || row.used === 1 || row.expires_at < now) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.user_id)
      db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id)
    })()

    return NextResponse.json({ ok: true })
  } catch (err) { return serverError(err) }
}
