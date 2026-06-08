export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import type { UserSnapshot } from '@/lib/types'

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try { await requireAdmin(req) } catch (res) { return res as Response }

  const { userId: userIdStr } = await params
  const uid = parseInt(userIdStr, 10)
  if (isNaN(uid)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })

  const rows = getDb().prepare(
    'SELECT id, created_at FROM user_snapshots WHERE user_id = ? ORDER BY created_at DESC'
  ).all(uid) as { id: number; created_at: number }[]

  const snapshots: UserSnapshot[] = rows.map(r => ({ id: r.id, createdAt: r.created_at }))
  return NextResponse.json({ snapshots })
}
