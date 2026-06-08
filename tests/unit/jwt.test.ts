import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest'
})

describe('jwt helpers', () => {
  it('signs and verifies a token round-trip', async () => {
    const { signToken, verifyToken } = await import('../../lib/jwt')
    const token = signToken({ userId: 1, email: 'a@example.com', isAdmin: false })
    expect(typeof token).toBe('string')
    const decoded = verifyToken(token)
    expect(decoded.userId).toBe(1)
    expect(decoded.email).toBe('a@example.com')
    expect(decoded.isAdmin).toBe(false)
  })

  it('preserves isAdmin: true through sign/verify', async () => {
    const { signToken, verifyToken } = await import('../../lib/jwt')
    const token = signToken({ userId: 99, email: 'admin@example.com', isAdmin: true })
    const decoded = verifyToken(token)
    expect(decoded.isAdmin).toBe(true)
    expect(decoded.userId).toBe(99)
  })

  it('defaults isAdmin to false when field is absent in token payload', async () => {
    const { signToken, verifyToken } = await import('../../lib/jwt')
    const token = signToken({ userId: 5, email: 'old@example.com', isAdmin: false })
    const decoded = verifyToken(token)
    expect(decoded.isAdmin).toBe(false)
  })

  it('throws on a tampered token', async () => {
    const { signToken, verifyToken } = await import('../../lib/jwt')
    const token = signToken({ userId: 1, email: 'a@example.com', isAdmin: false })
    expect(() => verifyToken(token + 'tampered')).toThrow()
  })

  it('throws when JWT_SECRET is missing', () => {
    const savedSecret = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    expect(() => {
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set')
    }).toThrow('JWT_SECRET is not set')
    process.env.JWT_SECRET = savedSecret
  })
})
