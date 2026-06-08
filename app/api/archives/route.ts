export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { z } from 'zod'

const bodySchema = z.array(z.string())

export async function PUT(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const db = getDb()
  const uid = payload.userId

  db.transaction(() => {
    db.prepare('DELETE FROM archives WHERE user_id = ?').run(uid)
    const insert = db.prepare('INSERT OR IGNORE INTO archives (user_id, person_key) VALUES (?, ?)')
    for (const key of parsed.data) insert.run(uid, key)
  })()

  return NextResponse.json({ ok: true })
}
