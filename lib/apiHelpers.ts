import { NextResponse } from 'next/server'

export function serverError(err: unknown) {
  console.error('[api]', err)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
