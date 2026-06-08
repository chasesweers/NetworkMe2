export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try { await requireAdmin(req) } catch (res) { return res as Response }

  const { userId: userIdStr } = await params
  const uid = parseInt(userIdStr, 10)
  if (isNaN(uid)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })

  try {
    const db = getDb()

    const connections = db.prepare(
      'SELECT name, title, company, connected, url, email, person_key FROM connections WHERE user_id = ?'
    ).all(uid) as { name: string; title: string; company: string; connected: string; url: string; email: string; person_key: string }[]

    const favorites = (db.prepare('SELECT person_key FROM favorites WHERE user_id = ?').all(uid) as { person_key: string }[]).map(f => f.person_key)
    const archives = (db.prepare('SELECT person_key FROM archives WHERE user_id = ?').all(uid) as { person_key: string }[]).map(a => a.person_key)

    const relationships = db.prepare(
      'SELECT a, b, type_id, created_at FROM relationships WHERE user_id = ?'
    ).all(uid) as { a: string; b: string; type_id: string; created_at: number }[]

    const customTypes = db.prepare(
      'SELECT id, label, color FROM custom_types WHERE user_id = ?'
    ).all(uid) as { id: string; label: string; color: string }[]

    const notesRows = db.prepare(
      'SELECT person_key, text FROM notes WHERE user_id = ?'
    ).all(uid) as { person_key: string; text: string }[]
    const notes = Object.fromEntries(notesRows.map(n => [n.person_key, n.text]))

    return NextResponse.json({
      connections: connections.map(c => ({ name: c.name, title: c.title, company: c.company, connected: c.connected, url: c.url, email: c.email, personKey: c.person_key })),
      favorites,
      archives,
      relationships: relationships.map(r => ({ a: r.a, b: r.b, typeId: r.type_id, createdAt: r.created_at })),
      customTypes: customTypes.map(t => ({ id: t.id, label: t.label, color: t.color, builtin: false })),
      notes,
    })
  } catch (err) { return serverError(err) }
}
