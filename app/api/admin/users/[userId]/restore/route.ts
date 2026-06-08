export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'
import { z } from 'zod'

const bodySchema = z.object({ snapshotId: z.number().int().positive() })

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try { await requireAdmin(req) } catch (res) { return res as Response }

  const { userId: userIdStr } = await params
  const uid = parseInt(userIdStr, 10)
  if (isNaN(uid)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const db = getDb()

  let row: { payload: string } | undefined
  try {
    row = db.prepare('SELECT payload FROM user_snapshots WHERE id = ? AND user_id = ?').get(parsed.data.snapshotId, uid) as { payload: string } | undefined
  } catch (err) { return serverError(err) }
  if (!row) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })

  const snap = JSON.parse(row.payload) as {
    connections: { name: string; title: string; company: string; connected: string; url: string; email: string; personKey: string }[]
    favorites: string[]
    archives: string[]
    relationships: { a: string; b: string; typeId: string; createdAt: number }[]
    customTypes: { id: string; label: string; color: string }[]
    notes: Record<string, string>
  }

  try {
    db.transaction(() => {
      db.prepare('DELETE FROM connections WHERE user_id = ?').run(uid)
      const insertConn = db.prepare('INSERT INTO connections (user_id, name, title, company, connected, url, email, person_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      for (const c of snap.connections) insertConn.run(uid, c.name, c.title, c.company, c.connected, c.url, c.email, c.personKey)

      db.prepare('DELETE FROM favorites WHERE user_id = ?').run(uid)
      const insertFav = db.prepare('INSERT OR IGNORE INTO favorites (user_id, person_key) VALUES (?, ?)')
      for (const key of snap.favorites) insertFav.run(uid, key)

      db.prepare('DELETE FROM archives WHERE user_id = ?').run(uid)
      const insertArch = db.prepare('INSERT OR IGNORE INTO archives (user_id, person_key) VALUES (?, ?)')
      for (const key of snap.archives) insertArch.run(uid, key)

      db.prepare('DELETE FROM relationships WHERE user_id = ?').run(uid)
      const insertRel = db.prepare('INSERT OR IGNORE INTO relationships (user_id, a, b, type_id, created_at) VALUES (?, ?, ?, ?, ?)')
      for (const r of snap.relationships) insertRel.run(uid, r.a, r.b, r.typeId, r.createdAt)

      db.prepare('DELETE FROM custom_types WHERE user_id = ?').run(uid)
      const insertType = db.prepare('INSERT OR IGNORE INTO custom_types (user_id, id, label, color) VALUES (?, ?, ?, ?)')
      for (const t of snap.customTypes) insertType.run(uid, t.id, t.label, t.color)

      db.prepare('DELETE FROM notes WHERE user_id = ?').run(uid)
      const insertNote = db.prepare('INSERT INTO notes (user_id, person_key, text) VALUES (?, ?, ?)')
      for (const [key, text] of Object.entries(snap.notes)) insertNote.run(uid, key, text)
    })()

    return NextResponse.json({ ok: true })
  } catch (err) { return serverError(err) }
}
