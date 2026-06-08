export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'
import { serverError } from '@/lib/apiHelpers'
import type { AdminUser } from '@/lib/types'

export async function GET(req: NextRequest) {
  try { await requireAdmin(req) } catch (res) { return res as Response }

  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT u.id, u.email, u.display_name, u.created_at,
             COUNT(c.id) AS connection_count
      FROM users u
      LEFT JOIN connections c ON c.user_id = u.id
      WHERE u.is_admin = 0
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all() as { id: number; email: string; display_name: string | null; created_at: number; connection_count: number }[]

    const users: AdminUser[] = rows.map(r => ({
      id: r.id,
      email: r.email,
      displayName: r.display_name,
      createdAt: r.created_at,
      connectionCount: r.connection_count,
    }))

    return NextResponse.json({ users })
  } catch (err) { return serverError(err) }
}
