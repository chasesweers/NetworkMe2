import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import {
  relationshipSlice,
  addRelationship,
  removeRelationship,
  addCustomType,
  removeCustomType,
  selectRelationships,
  selectAllTypes,
  selectRelationshipsFor,
} from '@/stores/relationshipSlice'
import { BUILTIN_RELATIONSHIP_TYPES } from '@/lib/types'
import { canonPair } from '@/lib/data'

function makeStore() {
  return configureStore({ reducer: { relationships: relationshipSlice.reducer } })
}

const ALEX = 'alex_rivera__acme_corp'
const JORDAN = 'jordan_lee__startup_inc'
const MORGAN = 'morgan_chen__creative_studio'

describe('addRelationship', () => {
  it('adds a relationship between two connections', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    expect(selectRelationships(store.getState())).toHaveLength(1)
  })

  it('stores the canonical pair (alphabetical order)', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: JORDAN, b: ALEX, typeId: 'friend' }))
    const [ca, cb] = canonPair(ALEX, JORDAN)
    const rel = selectRelationships(store.getState())[0]
    expect(rel.a).toBe(ca)
    expect(rel.b).toBe(cb)
  })

  it('is idempotent — adding same pair + type twice produces one entry', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    expect(selectRelationships(store.getState())).toHaveLength(1)
  })

  it('canonical pair deduplication — reversed order is still idempotent', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    store.dispatch(addRelationship({ a: JORDAN, b: ALEX, typeId: 'friend' }))
    expect(selectRelationships(store.getState())).toHaveLength(1)
  })

  it('allows different types between the same pair', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'colleague' }))
    expect(selectRelationships(store.getState())).toHaveLength(2)
  })

  it('records a createdAt timestamp', () => {
    const store = makeStore()
    const before = Date.now()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    const after = Date.now()
    const rel = selectRelationships(store.getState())[0]
    expect(rel.createdAt).toBeGreaterThanOrEqual(before)
    expect(rel.createdAt).toBeLessThanOrEqual(after)
  })
})

describe('removeRelationship', () => {
  it('removes all relationships between two connections', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'colleague' }))
    store.dispatch(removeRelationship({ a: ALEX, b: JORDAN }))
    expect(selectRelationships(store.getState())).toHaveLength(0)
  })

  it('does not affect unrelated relationships', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    store.dispatch(addRelationship({ a: ALEX, b: MORGAN, typeId: 'colleague' }))
    store.dispatch(removeRelationship({ a: ALEX, b: JORDAN }))
    expect(selectRelationships(store.getState())).toHaveLength(1)
    expect(selectRelationships(store.getState())[0].typeId).toBe('colleague')
  })

  it('works regardless of argument order (canonical pair)', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    store.dispatch(removeRelationship({ a: JORDAN, b: ALEX }))
    expect(selectRelationships(store.getState())).toHaveLength(0)
  })
})

describe('selectRelationshipsFor', () => {
  it('returns relationships where the key is either a or b', () => {
    const store = makeStore()
    store.dispatch(addRelationship({ a: ALEX, b: JORDAN, typeId: 'friend' }))
    store.dispatch(addRelationship({ a: ALEX, b: MORGAN, typeId: 'colleague' }))
    store.dispatch(addRelationship({ a: JORDAN, b: MORGAN, typeId: 'school' }))
    expect(selectRelationshipsFor(ALEX)(store.getState())).toHaveLength(2)
    expect(selectRelationshipsFor(JORDAN)(store.getState())).toHaveLength(2)
    expect(selectRelationshipsFor(MORGAN)(store.getState())).toHaveLength(2)
  })

  it('returns empty array when no relationships exist for a key', () => {
    const store = makeStore()
    expect(selectRelationshipsFor(ALEX)(store.getState())).toHaveLength(0)
  })
})

describe('custom relationship types', () => {
  it('addCustomType adds a type with builtin=false', () => {
    const store = makeStore()
    store.dispatch(addCustomType({ id: 'study', label: 'Study Group', color: '#ff0000' }))
    const custom = store.getState().relationships.customTypes
    expect(custom).toHaveLength(1)
    expect(custom[0].builtin).toBe(false)
    expect(custom[0].label).toBe('Study Group')
  })

  it('selectAllTypes includes all builtin types plus custom types', () => {
    const store = makeStore()
    store.dispatch(addCustomType({ id: 'study', label: 'Study Group', color: '#ff0000' }))
    const all = selectAllTypes(store.getState())
    expect(all).toHaveLength(BUILTIN_RELATIONSHIP_TYPES.length + 1)
    expect(all.map((t) => t.id)).toContain('study')
  })

  it('removeCustomType removes only the specified type', () => {
    const store = makeStore()
    store.dispatch(addCustomType({ id: 'study', label: 'Study Group', color: '#ff0000' }))
    store.dispatch(addCustomType({ id: 'book', label: 'Book Club', color: '#00ff00' }))
    store.dispatch(removeCustomType('study'))
    const all = selectAllTypes(store.getState())
    expect(all.map((t) => t.id)).not.toContain('study')
    expect(all.map((t) => t.id)).toContain('book')
  })
})
