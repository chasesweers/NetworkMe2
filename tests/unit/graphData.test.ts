import { describe, it, expect } from 'vitest'
import { buildEdges, buildNodes } from '@/lib/graphData'
import type { Relationship, RelationshipType, Connection } from '@/lib/types'
import { BUILTIN_RELATIONSHIP_TYPES } from '@/lib/types'

const allTypes: RelationshipType[] = BUILTIN_RELATIONSHIP_TYPES

// Canonical keys (personKey returns lowercase_with_underscores)
const ALEX_KEY = 'alex_rivera__acme_corp'
const JORDAN_KEY = 'jordan_lee__startup_inc'
const MORGAN_KEY = 'morgan_chen__creative_studio'

const REL_FRIEND: Relationship = { a: ALEX_KEY, b: JORDAN_KEY, typeId: 'friend', createdAt: 1000 }
const REL_COLLEAGUE: Relationship = { a: ALEX_KEY, b: MORGAN_KEY, typeId: 'colleague', createdAt: 2000 }

describe('buildEdges', () => {
  it('returns all edges when filterTypeId is "all"', () => {
    const edges = buildEdges([REL_FRIEND, REL_COLLEAGUE], 'all', allTypes)
    expect(edges).toHaveLength(2)
    expect(edges.map((e) => `${e.a}-${e.b}`)).toContain(`${ALEX_KEY}-${JORDAN_KEY}`)
    expect(edges.map((e) => `${e.a}-${e.b}`)).toContain(`${ALEX_KEY}-${MORGAN_KEY}`)
  })

  it('returns only matching edges when filterTypeId is a specific type', () => {
    const edges = buildEdges([REL_FRIEND, REL_COLLEAGUE], 'colleague', allTypes)
    expect(edges).toHaveLength(1)
    expect(edges[0].a).toBe(ALEX_KEY)
    expect(edges[0].b).toBe(MORGAN_KEY)
  })

  it('returns empty array when relationships is empty', () => {
    expect(buildEdges([], 'all', allTypes)).toHaveLength(0)
  })

  it('uses the type color from allTypes', () => {
    const friendType = allTypes.find((t) => t.id === 'friend')!
    const edges = buildEdges([REL_FRIEND], 'all', allTypes)
    expect(edges[0].color).toBe(friendType.color)
  })

  it('falls back to indigo when type is not found', () => {
    const rel: Relationship = { a: ALEX_KEY, b: JORDAN_KEY, typeId: 'unknown_type', createdAt: 1000 }
    const edges = buildEdges([rel], 'all', allTypes)
    expect(edges[0].color).toBe('#6366f1')
  })

  it('returns empty array when filter matches nothing', () => {
    const edges = buildEdges([REL_FRIEND], 'colleague', allTypes)
    expect(edges).toHaveLength(0)
  })
})

describe('buildNodes', () => {
  const ALEX: Connection = { name: 'Alex Rivera', title: 'Engineer', company: 'Acme Corp', connected: '2023-01-15', url: '', email: '' }
  const JORDAN: Connection = { name: 'Jordan Lee', title: 'PM', company: 'Startup Inc', connected: '2022-11-03', url: '', email: '' }

  it('creates nodes for every connection', () => {
    const nodes = buildNodes([ALEX, JORDAN], [], 800, 600)
    expect(nodes).toHaveLength(2)
    expect(nodes.map((n) => n.label)).toContain('Alex Rivera')
    expect(nodes.map((n) => n.label)).toContain('Jordan Lee')
  })

  it('preserves position and velocity for existing nodes', () => {
    const existing = [{ key: 'alex_rivera__acme_corp', label: 'Alex Rivera', x: 100, y: 200, vx: 1, vy: -1, hue: 42 }]
    const nodes = buildNodes([ALEX], existing, 800, 600)
    expect(nodes[0].x).toBe(100)
    expect(nodes[0].y).toBe(200)
    expect(nodes[0].vx).toBe(1)
    expect(nodes[0].vy).toBe(-1)
  })

  it('assigns random initial position for new nodes (within ±150 of center)', () => {
    const nodes = buildNodes([ALEX], [], 800, 600)
    expect(nodes[0].x).toBeGreaterThanOrEqual(800 / 2 - 150)
    expect(nodes[0].x).toBeLessThanOrEqual(800 / 2 + 150)
    expect(nodes[0].y).toBeGreaterThanOrEqual(600 / 2 - 150)
    expect(nodes[0].y).toBeLessThanOrEqual(600 / 2 + 150)
  })

  it('new nodes start with zero velocity', () => {
    const nodes = buildNodes([ALEX], [], 800, 600)
    expect(nodes[0].vx).toBe(0)
    expect(nodes[0].vy).toBe(0)
  })

  it('returns empty array when connections is empty', () => {
    expect(buildNodes([], [], 800, 600)).toHaveLength(0)
  })
})
