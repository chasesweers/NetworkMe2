import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock DB
const mockRun = vi.fn()
const mockGet = vi.fn()
const mockAll = vi.fn()
const mockPrepare = vi.fn(() => ({ run: mockRun, get: mockGet, all: mockAll }))
const mockTransaction = vi.fn((fn: () => void) => fn)
const mockDb = { prepare: mockPrepare, transaction: mockTransaction }
vi.mock('@/lib/db', () => ({ getDb: () => mockDb }))

// Mock requireAdmin to return an admin payload
vi.mock('@/lib/requireAuth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ userId: 1, email: 'admin@example.com', isAdmin: true }),
  requireAuth: vi.fn().mockResolvedValue({ userId: 42, email: 'user@example.com', isAdmin: false }),
}))

describe('GET /api/admin/users', () => {
  beforeEach(() => { mockAll.mockReset(); mockPrepare.mockClear(); vi.resetModules() })

  it('returns a list of non-admin users', async () => {
    mockAll.mockReturnValue([
      { id: 2, email: 'alice@example.com', display_name: 'Alice', created_at: 1700000000, connection_count: 5 },
      { id: 3, email: 'bob@example.com', display_name: null, created_at: 1700000001, connection_count: 0 },
    ])
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new NextRequest('http://localhost/api/admin/users')
    const res = await GET(req)
    const json = await res.json()
    expect(json.users).toHaveLength(2)
    expect(json.users[0].email).toBe('alice@example.com')
    expect(json.users[0].connectionCount).toBe(5)
    expect(json.users[1].displayName).toBeNull()
  })
})

describe('GET /api/admin/users/[userId]', () => {
  beforeEach(() => { mockAll.mockReset(); mockPrepare.mockClear(); vi.resetModules() })

  it('returns full sync state for a valid userId', async () => {
    mockAll
      .mockReturnValueOnce([{ name: 'Alice', title: 'Dev', company: 'Acme', connected: '', url: '', email: '', person_key: 'alice__acme' }])
      .mockReturnValueOnce([{ person_key: 'alice__acme' }])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
    const { GET } = await import('@/app/api/admin/users/[userId]/route')
    const req = new NextRequest('http://localhost/api/admin/users/2')
    const res = await GET(req, { params: Promise.resolve({ userId: '2' }) })
    const json = await res.json()
    expect(json.connections).toHaveLength(1)
    expect(json.connections[0].personKey).toBe('alice__acme')
    expect(json.favorites).toContain('alice__acme')
  })

  it('returns 400 for a non-numeric userId', async () => {
    const { GET } = await import('@/app/api/admin/users/[userId]/route')
    const req = new NextRequest('http://localhost/api/admin/users/abc')
    const res = await GET(req, { params: Promise.resolve({ userId: 'abc' }) })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/admin/users/[userId]/snapshots', () => {
  beforeEach(() => { mockAll.mockReset(); mockPrepare.mockClear(); vi.resetModules() })

  it('returns snapshot metadata ordered by createdAt', async () => {
    mockAll.mockReturnValue([
      { id: 10, created_at: 1700000100 },
      { id: 9, created_at: 1700000000 },
    ])
    const { GET } = await import('@/app/api/admin/users/[userId]/snapshots/route')
    const req = new NextRequest('http://localhost/api/admin/users/2/snapshots')
    const res = await GET(req, { params: Promise.resolve({ userId: '2' }) })
    const json = await res.json()
    expect(json.snapshots).toHaveLength(2)
    expect(json.snapshots[0].id).toBe(10)
    expect(json.snapshots[0].createdAt).toBe(1700000100)
  })
})

describe('POST /api/admin/users/[userId]/restore', () => {
  beforeEach(() => { mockGet.mockReset(); mockRun.mockReset(); mockPrepare.mockClear(); vi.resetModules() })

  it('restores from a valid snapshot', async () => {
    const snapPayload = {
      connections: [], favorites: [], archives: [],
      relationships: [], customTypes: [], notes: {},
    }
    mockGet.mockReturnValue({ payload: JSON.stringify(snapPayload) })
    mockTransaction.mockImplementation((fn: () => void) => fn)

    const { POST } = await import('@/app/api/admin/users/[userId]/restore/route')
    const req = new NextRequest('http://localhost/api/admin/users/2/restore', {
      method: 'POST',
      body: JSON.stringify({ snapshotId: 10 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { params: Promise.resolve({ userId: '2' }) })
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('returns 404 when snapshot is not found', async () => {
    mockGet.mockReturnValue(undefined)
    const { POST } = await import('@/app/api/admin/users/[userId]/restore/route')
    const req = new NextRequest('http://localhost/api/admin/users/2/restore', {
      method: 'POST',
      body: JSON.stringify({ snapshotId: 999 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req, { params: Promise.resolve({ userId: '2' }) })
    expect(res.status).toBe(404)
  })
})
