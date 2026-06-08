export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = getDb()

  const shareRow = db.prepare('SELECT user_id FROM shared_graphs WHERE token = ?').get(token) as { user_id: number } | undefined
  if (!shareRow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const uid = shareRow.user_id

  const dbConnections = db.prepare(
    'SELECT name, title, company, connected, url, email FROM connections WHERE user_id = ?'
  ).all(uid) as { name: string; title: string; company: string; connected: string; url: string; email: string }[]

  const dbRelationships = db.prepare(
    'SELECT a, b, type_id, created_at FROM relationships WHERE user_id = ?'
  ).all(uid) as { a: string; b: string; type_id: string; created_at: number }[]

  const dbCustomTypes = db.prepare(
    'SELECT id, label, color FROM custom_types WHERE user_id = ?'
  ).all(uid) as { id: string; label: string; color: string }[]

  const userRow = db.prepare('SELECT display_name, email FROM users WHERE id = ?').get(uid) as { display_name: string | null; email: string }

  return NextResponse.json({
    ownerName: userRow.display_name ?? userRow.email,
    connections: dbConnections,
    relationships: dbRelationships.map((r) => ({ a: r.a, b: r.b, typeId: r.type_id, createdAt: r.created_at })),
    customTypes: dbCustomTypes.map((t) => ({ id: t.id, label: t.label, color: t.color, builtin: false })),
  })
}
