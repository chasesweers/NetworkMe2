export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const db = getDb()
  const row = db.prepare('SELECT token FROM shared_graphs WHERE user_id = ?').get(payload.userId) as { token: string } | undefined
  return NextResponse.json({ token: row?.token ?? null })
}

export async function POST(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const token = crypto.randomUUID()
  const db = getDb()
  db.prepare('DELETE FROM shared_graphs WHERE user_id = ?').run(payload.userId)
  db.prepare('INSERT INTO shared_graphs (token, user_id) VALUES (?, ?)').run(token, payload.userId)
  return NextResponse.json({ token })
}

export async function DELETE(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const db = getDb()
  db.prepare('DELETE FROM shared_graphs WHERE user_id = ?').run(payload.userId)
  return NextResponse.json({ ok: true })
}
