import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Relationship, RelationshipType } from '@/lib/types'
import { BUILTIN_RELATIONSHIP_TYPES } from '@/lib/types'
import { canonPair } from '@/lib/data'
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
export const selectAllTypes = (s: RootState) => [
  ...BUILTIN_RELATIONSHIP_TYPES,
  ...s.relationships.customTypes,
]
export const selectRelationshipsFor = (key: string) => (s: RootState) =>
  s.relationships.relationships.filter((r) => r.a === key || r.b === key)
