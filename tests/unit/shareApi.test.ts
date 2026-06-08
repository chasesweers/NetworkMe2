import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock DB
const mockRun = vi.fn()
const mockGet = vi.fn()
const mockPrepare = vi.fn(() => ({ run: mockRun, get: mockGet }))
const mockDb = { prepare: mockPrepare, transaction: vi.fn((fn) => fn) }
vi.mock('@/lib/db', () => ({ getDb: () => mockDb }))

// Mock requireAuth to return a fixed userId
vi.mock('@/lib/requireAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 42, email: 'test@example.com' }),
}))

// Mock crypto.randomUUID
const MOCK_UUID = 'aaaa-bbbb-cccc-dddd'
vi.stubGlobal('crypto', { randomUUID: () => MOCK_UUID })

describe('GET /api/share', () => {
  beforeEach(() => { mockGet.mockReset(); mockPrepare.mockClear() })

  it('returns null when no share row exists', async () => {
    mockGet.mockReturnValue(undefined)
    const { GET } = await import('@/app/api/share/route')
    const req = new NextRequest('http://localhost/api/share')
    const res = await GET(req)
    const json = await res.json()
    expect(json).toEqual({ token: null })
  })

  it('returns the existing token', async () => {
    mockGet.mockReturnValue({ token: 'existing-token' })
    vi.resetModules()
    const { GET } = await import('@/app/api/share/route')
    const req = new NextRequest('http://localhost/api/share')
    const res = await GET(req)
    const json = await res.json()
    expect(json).toEqual({ token: 'existing-token' })
  })
})

describe('POST /api/share', () => {
  beforeEach(() => { mockRun.mockReset(); mockPrepare.mockClear(); vi.resetModules() })

  it('inserts a new UUID token and returns it', async () => {
    const { POST } = await import('@/app/api/share/route')
    const req = new NextRequest('http://localhost/api/share', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()
    expect(json).toEqual({ token: MOCK_UUID })
    expect(mockRun).toHaveBeenCalled()
  })
})

describe('DELETE /api/share', () => {
  beforeEach(() => { mockRun.mockReset(); mockPrepare.mockClear(); vi.resetModules() })

  it('deletes the share row and returns ok', async () => {
    const { DELETE } = await import('@/app/api/share/route')
    const req = new NextRequest('http://localhost/api/share', { method: 'DELETE' })
    const res = await DELETE(req)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(mockRun).toHaveBeenCalledWith(42)
  })
})
