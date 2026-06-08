import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGet = vi.fn()
const mockAll = vi.fn()
const mockPrepare = vi.fn((sql: string) => {
  if (sql.includes('shared_graphs')) return { get: mockGet }
  if (sql.includes('connections') || sql.includes('relationships') || sql.includes('custom_types')) return { all: mockAll }
  if (sql.includes('users')) return { get: mockGet }
  return { get: mockGet, all: mockAll }
})
vi.mock('@/lib/db', () => ({ getDb: () => ({ prepare: mockPrepare }) }))

describe('GET /api/share/[token]', () => {
  beforeEach(() => { mockGet.mockReset(); mockAll.mockReset(); mockPrepare.mockClear(); vi.resetModules() })

  it('returns 404 for unknown token', async () => {
    mockGet.mockReturnValue(undefined)
    const { GET } = await import('@/app/api/share/[token]/route')
    const req = new NextRequest('http://localhost/api/share/bad-token')
    const res = await GET(req, { params: Promise.resolve({ token: 'bad-token' }) })
    expect(res.status).toBe(404)
  })

  it('returns connections, relationships, customTypes, ownerName — no notes field', async () => {
    mockGet
      .mockReturnValueOnce({ user_id: 7 })           // shared_graphs lookup
      .mockReturnValueOnce({ display_name: 'Alice' }) // users lookup
    mockAll
      .mockReturnValueOnce([{ name: 'Bob', title: 'Eng', company: 'Acme', connected: '', url: '', email: '', person_key: 'bob__acme' }])
      .mockReturnValueOnce([{ a: 'bob__acme', b: 'carol__acme', type_id: 'friend', created_at: 0 }])
      .mockReturnValueOnce([{ id: 'custom1', label: 'Rival', color: '#ff0000' }])

    const { GET } = await import('@/app/api/share/[token]/route')
    const req = new NextRequest('http://localhost/api/share/valid-token')
    const res = await GET(req, { params: Promise.resolve({ token: 'valid-token' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ownerName).toBe('Alice')
    expect(json.connections).toHaveLength(1)
    expect(json.relationships).toHaveLength(1)
    expect(json.customTypes).toHaveLength(1)
    expect(json).not.toHaveProperty('notes')
  })
})
