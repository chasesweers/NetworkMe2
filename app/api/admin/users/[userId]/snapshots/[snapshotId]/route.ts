export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; snapshotId: string }> }
) {
  try { await requireAdmin(req) } catch (res) { return res as Response }

  const { userId: userIdStr, snapshotId: snapshotIdStr } = await params
  const uid = parseInt(userIdStr, 10)
  const sid = parseInt(snapshotIdStr, 10)
  if (isNaN(uid) || isNaN(sid)) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  try {
    const db = getDb()
    const row = db.prepare('SELECT payload, created_at AS createdAt FROM user_snapshots WHERE id = ? AND user_id = ?').get(sid, uid) as { payload: string; createdAt: number } | undefined
    if (!row) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })

    const payload = JSON.parse(row.payload)
    return NextResponse.json({ ...payload, createdAt: row.createdAt })
  } catch (err) { return serverError(err) }
}
