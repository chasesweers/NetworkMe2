'use client'

import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { store, loadPersistedState, saveState } from '@/stores/index'
import { setConnections, toggleFavorite } from '@/stores/connectionSlice'
import { addRelationship, addCustomType } from '@/stores/relationshipSlice'
import { setNote } from '@/stores/noteSlice'
import { setTheme, completeOnboarding } from '@/stores/uiSlice'
import type { Connection, Relationship, RelationshipType } from '@/lib/types'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const saved = loadPersistedState()

    if (saved.connections?.connections) {
      store.dispatch(setConnections(saved.connections.connections as Connection[]))
    }
    if (saved.connections?.favorites) {
      for (const key of saved.connections.favorites as string[]) {
        store.dispatch(toggleFavorite(key))
      }
    }
    if (saved.relationships?.relationships) {
      for (const r of saved.relationships.relationships as Relationship[]) {
        store.dispatch(addRelationship({ a: r.a, b: r.b, typeId: r.typeId }))
      }
    }
    if (saved.relationships?.customTypes) {
      for (const t of saved.relationships.customTypes as RelationshipType[]) {
        store.dispatch(addCustomType(t))
      }
    }
    if (saved.notes?.notes) {
      for (const [key, text] of Object.entries(saved.notes.notes as Record<string, string>)) {
        store.dispatch(setNote({ key, text }))
      }
    }
    if (saved.ui?.theme) store.dispatch(setTheme(saved.ui.theme))
    if (saved.ui?.onboardingComplete) store.dispatch(completeOnboarding())

    // Subscribe to persist on every change
    store.subscribe(() => saveState(store.getState()))
  }, [])

  return <Provider store={store}>{children}</Provider>
}
