export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const db = getDb()
  const uid = payload.userId

  const connections = db.prepare('SELECT name, title, company, connected, url, email, person_key FROM connections WHERE user_id = ?').all(uid) as {
    name: string; title: string; company: string; connected: string; url: string; email: string; person_key: string
  }[]

  const favorites = (db.prepare('SELECT person_key FROM favorites WHERE user_id = ?').all(uid) as { person_key: string }[]).map(f => f.person_key)

  const relationships = db.prepare('SELECT a, b, type_id, created_at FROM relationships WHERE user_id = ?').all(uid) as {
    a: string; b: string; type_id: string; created_at: number
  }[]

  const customTypes = db.prepare('SELECT id, label, color FROM custom_types WHERE user_id = ?').all(uid) as {
    id: string; label: string; color: string
  }[]

  const notesRows = db.prepare('SELECT person_key, text FROM notes WHERE user_id = ?').all(uid) as { person_key: string; text: string }[]
  const notes = Object.fromEntries(notesRows.map(n => [n.person_key, n.text]))

  return NextResponse.json({
    connections: connections.map(c => ({ name: c.name, title: c.title, company: c.company, connected: c.connected, url: c.url, email: c.email, personKey: c.person_key })),
    favorites,
    relationships: relationships.map(r => ({ a: r.a, b: r.b, typeId: r.type_id, createdAt: r.created_at })),
    customTypes: customTypes.map(t => ({ id: t.id, label: t.label, color: t.color, builtin: false })),
    notes,
  })
}
