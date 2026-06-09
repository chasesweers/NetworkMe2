export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('nm_guest', '1', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: (process.env.APP_URL ?? '').startsWith('https://'),
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('nm_guest', '', { maxAge: 0, path: '/' })
  return res
}
