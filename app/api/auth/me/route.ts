export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { getDb } from '@/lib/db'

interface UserRow { id: number; email: string; display_name: string | null }

export async function GET(req: NextRequest) {
  let payload
  try { payload = await requireAuth(req) } catch (res) { return res as Response }

  const user = getDb().prepare('SELECT id, email, display_name FROM users WHERE id = ?').get(payload.userId) as UserRow | undefined
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ id: user.id, email: user.email, displayName: user.display_name })
}
