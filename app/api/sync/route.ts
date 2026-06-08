export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'
import { z } from 'zod'

const syncBodySchema = z.object({
  connections: z.array(z.object({
    name: z.string(), title: z.string(), company: z.string(),
    connected: z.string(), url: z.string(), email: z.string(), personKey: z.string(),
  })),
  favorites: z.array(z.string()),
  archives: z.array(z.string()),
  relationships: z.array(z.object({ a: z.string(), b: z.string(), typeId: z.string(), createdAt: z.number() })),
  customTypes: z.array(z.object({ id: z.string(), label: z.string(), color: z.string() })),
  notes: z.record(z.string(), z.string()),
  followUps: z.record(z.string(), z.object({ dueAt: z.string(), note: z.string() })).default({}),
})

export async function POST(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const body = await req.json().catch(() => null)
  const parsed = syncBodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  try {
  const db = getDb()
  const uid = payload.userId
  const d = parsed.data

  db.transaction(() => {
    // Connections
    db.prepare('DELETE FROM connections WHERE user_id = ?').run(uid)
    const insertConn = db.prepare(`
      INSERT INTO connections (user_id, name, title, company, connected, url, email, person_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const c of d.connections) insertConn.run(uid, c.name, c.title, c.company, c.connected, c.url, c.email, c.personKey)

    // Favorites
    db.prepare('DELETE FROM favorites WHERE user_id = ?').run(uid)
    const insertFav = db.prepare('INSERT OR IGNORE INTO favorites (user_id, person_key) VALUES (?, ?)')
    for (const key of d.favorites) insertFav.run(uid, key)

    // Archives
    db.prepare('DELETE FROM archives WHERE user_id = ?').run(uid)
    const insertArch = db.prepare('INSERT OR IGNORE INTO archives (user_id, person_key) VALUES (?, ?)')
    for (const key of d.archives) insertArch.run(uid, key)

    // Relationships + custom types
    db.prepare('DELETE FROM relationships WHERE user_id = ?').run(uid)
    const insertRel = db.prepare('INSERT OR IGNORE INTO relationships (user_id, a, b, type_id, created_at) VALUES (?, ?, ?, ?, ?)')
    for (const r of d.relationships) insertRel.run(uid, r.a, r.b, r.typeId, r.createdAt)

    db.prepare('DELETE FROM custom_types WHERE user_id = ?').run(uid)
    const insertType = db.prepare('INSERT OR IGNORE INTO custom_types (user_id, id, label, color) VALUES (?, ?, ?, ?)')
    for (const t of d.customTypes) insertType.run(uid, t.id, t.label, t.color)

    // Notes
    db.prepare('DELETE FROM notes WHERE user_id = ?').run(uid)
    const insertNote = db.prepare('INSERT INTO notes (user_id, person_key, text) VALUES (?, ?, ?)')
    for (const [key, text] of Object.entries(d.notes)) insertNote.run(uid, key, text)

    // Follow-ups
    db.prepare('DELETE FROM follow_ups WHERE user_id = ?').run(uid)
    const insertFollowUp = db.prepare('INSERT INTO follow_ups (user_id, person_key, due_at, note) VALUES (?, ?, ?, ?)')
    for (const [key, { dueAt, note }] of Object.entries(d.followUps)) insertFollowUp.run(uid, key, dueAt, note)

    // Snapshot
    db.prepare('INSERT INTO user_snapshots (user_id, payload) VALUES (?, ?)').run(uid, JSON.stringify(d))

    // Prune to last 20 snapshots
    const oldest = db.prepare(
      'SELECT id FROM user_snapshots WHERE user_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET 20'
    ).all(uid) as { id: number }[]
    if (oldest.length > 0) {
      db.prepare(`DELETE FROM user_snapshots WHERE id IN (${oldest.map(() => '?').join(',')})`).run(...oldest.map(r => r.id))
    }
  })()

  return NextResponse.json({ ok: true })
  } catch (err) { return serverError(err) }
}

export async function GET(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  try {
  const db = getDb()
  const uid = payload.userId

  const connections = db.prepare('SELECT name, title, company, connected, url, email, person_key FROM connections WHERE user_id = ?').all(uid) as {
    name: string; title: string; company: string; connected: string; url: string; email: string; person_key: string
  }[]

  const favorites = (db.prepare('SELECT person_key FROM favorites WHERE user_id = ?').all(uid) as { person_key: string }[]).map(f => f.person_key)
  const archives = (db.prepare('SELECT person_key FROM archives WHERE user_id = ?').all(uid) as { person_key: string }[]).map(a => a.person_key)

  const relationships = db.prepare('SELECT a, b, type_id, created_at FROM relationships WHERE user_id = ?').all(uid) as {
    a: string; b: string; type_id: string; created_at: number
  }[]

  const customTypes = db.prepare('SELECT id, label, color FROM custom_types WHERE user_id = ?').all(uid) as {
    id: string; label: string; color: string
  }[]

  const notesRows = db.prepare('SELECT person_key, text FROM notes WHERE user_id = ?').all(uid) as { person_key: string; text: string }[]
  const notes = Object.fromEntries(notesRows.map(n => [n.person_key, n.text]))

  const followUpRows = db.prepare('SELECT person_key, due_at, note FROM follow_ups WHERE user_id = ?').all(uid) as { person_key: string; due_at: string; note: string }[]
  const followUps = Object.fromEntries(followUpRows.map(r => [r.person_key, { dueAt: r.due_at, note: r.note }]))

  return NextResponse.json({
    connections: connections.map(c => ({ name: c.name, title: c.title, company: c.company, connected: c.connected, url: c.url, email: c.email, personKey: c.person_key })),
    favorites,
    archives,
    relationships: relationships.map(r => ({ a: r.a, b: r.b, typeId: r.type_id, createdAt: r.created_at })),
    customTypes: customTypes.map(t => ({ id: t.id, label: t.label, color: t.color, builtin: false })),
    notes,
    followUps,
  })
  } catch (err) { return serverError(err) }
}
