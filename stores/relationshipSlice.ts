import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit'
import type { Relationship, RelationshipType } from '@/lib/types'
import { BUILTIN_RELATIONSHIP_TYPES } from '@/lib/types'
import { canonPair } from '@/lib/data'
import { sameCompanyPairs } from '@/lib/autoColleague'
import { selectConnections } from '@/stores/connectionSlice'
import type { RootState } from './index'

interface RelationshipState {
  relationships: Relationship[]
  customTypes: RelationshipType[]
}

const initialState: RelationshipState = {
  relationships: [],
  customTypes: [],
}

export const relationshipSlice = createSlice({
  name: 'relationships',
  initialState,
  reducers: {
    addRelationship(state, action: PayloadAction<{ a: string; b: string; typeId: string }>) {
      const { a, b, typeId } = action.payload
      const [ca, cb] = canonPair(a, b)
      const exists = state.relationships.some((r) => r.a === ca && r.b === cb && r.typeId === typeId)
      if (!exists) {
        state.relationships.push({ a: ca, b: cb, typeId, createdAt: Date.now() })
      }
    },
    removeRelationship(state, action: PayloadAction<{ a: string; b: string }>) {
      const [ca, cb] = canonPair(action.payload.a, action.payload.b)
      state.relationships = state.relationships.filter((r) => !(r.a === ca && r.b === cb))
    },
    addCustomType(state, action: PayloadAction<Omit<RelationshipType, 'builtin'>>) {
      state.customTypes.push({ ...action.payload, builtin: false })
    },
    removeCustomType(state, action: PayloadAction<string>) {
      state.customTypes = state.customTypes.filter((t) => t.id !== action.payload)
    },
  },
})

export const { addRelationship, removeRelationship, addCustomType, removeCustomType } =
  relationshipSlice.actions

export const selectRelationships = (s: RootState) => s.relationships.relationships
export const selectCustomTypes = (s: RootState) => s.relationships.customTypes

export const selectAllTypes = createSelector(
  selectCustomTypes,
  (customTypes) => [...BUILTIN_RELATIONSHIP_TYPES, ...customTypes]
)

/** Derived auto-colleague relationships (not stored, computed from connections). */
export const selectAutoRelationships = createSelector(
  selectConnections,
  (connections) => sameCompanyPairs(connections),
)

/**
 * All relationships (manual + auto), deduplicated.
 * Manual entries take precedence; auto ones fill in the rest.
 */
export const selectAllRelationships = createSelector(
  selectRelationships,
  selectAutoRelationships,
  (manual, auto) => {
    const seen = new Set(manual.map((r) => `${r.a}|${r.b}|${r.typeId}`))
    const extra = auto.filter((r) => !seen.has(`${r.a}|${r.b}|${r.typeId}`))
    return [...manual, ...extra]
  },
)

// Factory selector — memoized per key via a simple cache
type RelSelector = (s: RootState) => Relationship[]
const relForKeyCache = new Map<string, RelSelector>()
export const selectRelationshipsFor = (key: string): RelSelector => {
  if (!relForKeyCache.has(key)) {
    relForKeyCache.set(
      key,
      createSelector(selectRelationships, (rels) => rels.filter((r) => r.a === key || r.b === key))
    )
  }
  return relForKeyCache.get(key)!
}

/** Auto colleagues for a specific person key — memoized per key. */
type AutoRelSelector = (s: RootState) => ReturnType<typeof sameCompanyPairs>
const autoForKeyCache = new Map<string, AutoRelSelector>()
export const selectAutoRelationshipsFor = (key: string): AutoRelSelector => {
  if (!autoForKeyCache.has(key)) {
    autoForKeyCache.set(
      key,
      createSelector(selectAutoRelationships, (pairs) =>
        pairs.filter((p) => p.a === key || p.b === key),
      ),
    )
  }
  return autoForKeyCache.get(key)!
}
