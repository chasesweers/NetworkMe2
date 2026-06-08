export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'
import { z } from 'zod'

const bodySchema = z.record(z.string().max(300), z.string().max(10000))

export async function PUT(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const db = getDb()
    const uid = payload.userId

    db.transaction(() => {
      db.prepare('DELETE FROM notes WHERE user_id = ?').run(uid)
      const insert = db.prepare('INSERT INTO notes (user_id, person_key, text) VALUES (?, ?, ?)')
      for (const [key, text] of Object.entries(parsed.data)) insert.run(uid, key, text)
    })()

    return NextResponse.json({ ok: true })
  } catch (err) { return serverError(err) }
}
