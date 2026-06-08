import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Track calls to the snapshot-related prepare statements
const mockRun = vi.fn()
const mockAll = vi.fn()
const mockPrepare = vi.fn(() => ({ run: mockRun, all: mockAll }))
const mockTransaction = vi.fn((fn: () => void) => fn)
const mockDb = { prepare: mockPrepare, transaction: mockTransaction }

vi.mock('@/lib/db', () => ({ getDb: () => mockDb }))
vi.mock('@/lib/requireAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 42, email: 'user@example.com', isAdmin: false }),
}))

const syncBody = {
  connections: [], favorites: [], archives: [],
  relationships: [], customTypes: [], notes: {},
}

describe('POST /api/sync snapshot pruning', () => {
  beforeEach(() => {
    mockRun.mockReset()
    mockAll.mockReset()
    mockPrepare.mockClear()
    vi.resetModules()
  })

  it('inserts a snapshot after saving state', async () => {
    // No old snapshots to prune
    mockAll.mockReturnValue([])

    const { POST } = await import('@/app/api/sync/route')
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      body: JSON.stringify(syncBody),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    // Verify that at least one prepare call included the snapshot insert
    const prepareCalls = mockPrepare.mock.calls.map(c => c[0] as string)
    expect(prepareCalls.some(s => s.includes('INSERT INTO user_snapshots'))).toBe(true)
  })

  it('prunes old snapshots when count exceeds 20', async () => {
    // Simulate 2 snapshots older than the 20-row limit being returned
    mockAll.mockReturnValue([{ id: 1 }, { id: 2 }])

    const { POST } = await import('@/app/api/sync/route')
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      body: JSON.stringify(syncBody),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    const prepareCalls = mockPrepare.mock.calls.map(c => c[0] as string)
    expect(prepareCalls.some(s => s.includes('DELETE FROM user_snapshots WHERE id IN'))).toBe(true)
  })

  it('does not prune when snapshot count is within limit', async () => {
    mockAll.mockReturnValue([]) // no snapshots older than offset 20

    const { POST } = await import('@/app/api/sync/route')
    const req = new NextRequest('http://localhost/api/sync', {
      method: 'POST',
      body: JSON.stringify(syncBody),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    const prepareCalls = mockPrepare.mock.calls.map(c => c[0] as string)
    expect(prepareCalls.some(s => s.includes('DELETE FROM user_snapshots WHERE id IN'))).toBe(false)
  })
})
