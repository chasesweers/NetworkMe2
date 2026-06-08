export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'
import { z } from 'zod'

const bodySchema = z.array(z.object({
  name: z.string(), title: z.string(), company: z.string(),
  connected: z.string(), url: z.string(), email: z.string(), personKey: z.string(),
}))

export async function POST(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
    const db = getDb()
    const uid = payload.userId

    const insert = db.prepare(`
      INSERT INTO connections (user_id, name, title, company, connected, url, email, person_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, person_key) DO UPDATE SET
        name=excluded.name, title=excluded.title, company=excluded.company,
        connected=excluded.connected, url=excluded.url, email=excluded.email
    `)

    db.transaction(() => {
      db.prepare('DELETE FROM connections WHERE user_id = ?').run(uid)
      for (const c of parsed.data) {
        insert.run(uid, c.name, c.title, c.company, c.connected, c.url, c.email, c.personKey)
      }
    })()

    return NextResponse.json({ ok: true })
  } catch (err) { return serverError(err) }
}
