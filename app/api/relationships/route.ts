export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'
import { z } from 'zod'

const bodySchema = z.object({
  relationships: z.array(z.object({ a: z.string(), b: z.string(), typeId: z.string(), createdAt: z.number() })),
  customTypes: z.array(z.object({ id: z.string(), label: z.string(), color: z.string() })),
})

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
      db.prepare('DELETE FROM relationships WHERE user_id = ?').run(uid)
      const insertRel = db.prepare('INSERT OR IGNORE INTO relationships (user_id, a, b, type_id, created_at) VALUES (?, ?, ?, ?, ?)')
      for (const r of parsed.data.relationships) insertRel.run(uid, r.a, r.b, r.typeId, r.createdAt)

      db.prepare('DELETE FROM custom_types WHERE user_id = ?').run(uid)
      const insertType = db.prepare('INSERT OR IGNORE INTO custom_types (user_id, id, label, color) VALUES (?, ?, ?, ?)')
      for (const t of parsed.data.customTypes) insertType.run(uid, t.id, t.label, t.color)
    })()

    return NextResponse.json({ ok: true })
  } catch (err) { return serverError(err) }
}
