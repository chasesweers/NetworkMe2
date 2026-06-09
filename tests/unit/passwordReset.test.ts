/**
 * Unit tests for password reset API routes.
 * Tests run against a real in-memory SQLite DB spun up per-test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import Database from 'better-sqlite3'

// ─── Shared test DB setup ─────────────────────────────────────────────────────

function makeTestDb() {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      display_name  TEXT,
      password_hash TEXT    NOT NULL,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE password_reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT    NOT NULL,
      expires_at INTEGER NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0
    );
  `)
  return db
}

// ─── lib/resetToken helpers ───────────────────────────────────────────────────

describe('generateResetToken', () => {
  it('returns a 64-character hex string', async () => {
    const { generateResetToken } = await import('@/lib/resetToken')
    const token = generateResetToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces a different token on each call', async () => {
    const { generateResetToken } = await import('@/lib/resetToken')
    expect(generateResetToken()).not.toBe(generateResetToken())
  })
})

describe('hashResetToken', () => {
  it('returns a deterministic SHA-256 hex hash', async () => {
    const { hashResetToken } = await import('@/lib/resetToken')
    const h1 = hashResetToken('abc')
    const h2 = hashResetToken('abc')
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different hashes for different inputs', async () => {
    const { hashResetToken } = await import('@/lib/resetToken')
    expect(hashResetToken('aaa')).not.toBe(hashResetToken('bbb'))
  })
})

// ─── POST /api/auth/forgot ────────────────────────────────────────────────────

describe('POST /api/auth/forgot', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('JWT_SECRET', 'test-secret')
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('APP_URL', 'http://localhost:3000')
  })

  it('returns 200 ok:true for a known email', async () => {
    const db = makeTestDb()
    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run('a@b.com', 'hash')
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))
    vi.doMock('@/lib/email', () => ({ sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/rateLimit', () => ({ checkRateLimit: () => ({ limited: false, retryAfterSecs: 0 }) }))

    const { POST } = await import('@/app/api/auth/forgot/route')
    const req = new Request('http://localhost/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email: 'a@b.com' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('returns 200 ok:true even for an unknown email (no enumeration)', async () => {
    const db = makeTestDb()
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))
    vi.doMock('@/lib/email', () => ({ sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/rateLimit', () => ({ checkRateLimit: () => ({ limited: false, retryAfterSecs: 0 }) }))

    const { POST } = await import('@/app/api/auth/forgot/route')
    const req = new Request('http://localhost/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
  })

  it('does NOT send an email for an unknown address', async () => {
    const db = makeTestDb()
    const sendMock = vi.fn().mockResolvedValue(undefined)
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))
    vi.doMock('@/lib/email', () => ({ sendPasswordResetEmail: sendMock }))
    vi.doMock('@/lib/rateLimit', () => ({ checkRateLimit: () => ({ limited: false, retryAfterSecs: 0 }) }))

    const { POST } = await import('@/app/api/auth/forgot/route')
    const req = new Request('http://localhost/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    })
    await POST(req as never)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('stores a reset token in the DB for a known email', async () => {
    const db = makeTestDb()
    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run('a@b.com', 'hash')
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))
    vi.doMock('@/lib/email', () => ({ sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/rateLimit', () => ({ checkRateLimit: () => ({ limited: false, retryAfterSecs: 0 }) }))

    const { POST } = await import('@/app/api/auth/forgot/route')
    const req = new Request('http://localhost/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email: 'a@b.com' }),
    })
    await POST(req as never)
    const row = db.prepare('SELECT * FROM password_reset_tokens').get() as { token_hash: string } | undefined
    expect(row).toBeDefined()
    expect(row!.token_hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns 429 when rate-limited', async () => {
    const db = makeTestDb()
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))
    vi.doMock('@/lib/email', () => ({ sendPasswordResetEmail: vi.fn() }))
    vi.doMock('@/lib/rateLimit', () => ({ checkRateLimit: () => ({ limited: true, retryAfterSecs: 60 }) }))

    const { POST } = await import('@/app/api/auth/forgot/route')
    const req = new Request('http://localhost/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email: 'a@b.com' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(429)
  })

  it('returns 400 for an invalid email', async () => {
    const db = makeTestDb()
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))
    vi.doMock('@/lib/email', () => ({ sendPasswordResetEmail: vi.fn() }))
    vi.doMock('@/lib/rateLimit', () => ({ checkRateLimit: () => ({ limited: false, retryAfterSecs: 0 }) }))

    const { POST } = await import('@/app/api/auth/forgot/route')
    const req = new Request('http://localhost/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })
})

// ─── POST /api/auth/reset ─────────────────────────────────────────────────────

describe('POST /api/auth/reset', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('JWT_SECRET', 'test-secret')
  })

  async function makeDbWithToken(opts: { used?: boolean; expiredAgo?: number } = {}) {
    const { hashResetToken } = await import('@/lib/resetToken')
    const db = makeTestDb()
    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run('a@b.com', 'oldhash')
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get('a@b.com') as { id: number }
    const rawToken = 'a'.repeat(64)
    const hash = hashResetToken(rawToken)
    const expiresAt = opts.expiredAgo
      ? Math.floor(Date.now() / 1000) - opts.expiredAgo
      : Math.floor(Date.now() / 1000) + 3600
    db.prepare('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used) VALUES (?, ?, ?, ?)')
      .run(user.id, hash, expiresAt, opts.used ? 1 : 0)
    return { db, rawToken }
  }

  it('returns 200 ok:true for a valid token + new password', async () => {
    const { db, rawToken } = await makeDbWithToken()
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))

    const { POST } = await import('@/app/api/auth/reset/route')
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'newpassword123' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('updates the password hash in the DB', async () => {
    const { db, rawToken } = await makeDbWithToken()
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))

    const { POST } = await import('@/app/api/auth/reset/route')
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'newpassword123' }),
    })
    await POST(req as never)

    const user = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('a@b.com') as { password_hash: string }
    expect(user.password_hash).not.toBe('oldhash')
  })

  it('marks the token as used after a successful reset', async () => {
    const { db, rawToken } = await makeDbWithToken()
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))

    const { POST } = await import('@/app/api/auth/reset/route')
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'newpassword123' }),
    })
    await POST(req as never)

    const row = db.prepare('SELECT used FROM password_reset_tokens').get() as { used: number }
    expect(row.used).toBe(1)
  })

  it('returns 400 for an expired token', async () => {
    const { db, rawToken } = await makeDbWithToken({ expiredAgo: 7200 })
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))

    const { POST } = await import('@/app/api/auth/reset/route')
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'newpassword123' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/invalid or expired/i)
  })

  it('returns 400 for an already-used token', async () => {
    const { db, rawToken } = await makeDbWithToken({ used: true })
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))

    const { POST } = await import('@/app/api/auth/reset/route')
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'newpassword123' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 for an unknown token', async () => {
    const db = makeTestDb()
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))

    const { POST } = await import('@/app/api/auth/reset/route')
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'b'.repeat(64), newPassword: 'newpassword123' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when new password is too short', async () => {
    const { db, rawToken } = await makeDbWithToken()
    vi.doMock('@/lib/db', () => ({ getDb: () => db }))

    const { POST } = await import('@/app/api/auth/reset/route')
    const req = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, newPassword: 'short' }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })
})
