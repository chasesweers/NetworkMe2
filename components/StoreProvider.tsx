'use client'

import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { store, loadPersistedState, saveState } from '@/stores/index'
import { setConnections, toggleFavorite, toggleArchive } from '@/stores/connectionSlice'
import { addRelationship, addCustomType } from '@/stores/relationshipSlice'
import { setNote } from '@/stores/noteSlice'
import { setTheme, completeOnboarding } from '@/stores/uiSlice'
import { setUser, setToken } from '@/stores/authSlice'
import { getToken } from '@/lib/api'
import type { Connection, Relationship, RelationshipType } from '@/lib/types'
import { personKey } from '@/lib/data'

/** Restore the user object from the server */
async function restoreUser(token: string) {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return
  const user = await res.json()
  store.dispatch(setUser(user))
}

/** Fetch all server data and populate Redux slices */
async function hydrateFromServer(token: string) {
  const res = await fetch('/api/sync', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return
  const data = await res.json()

  if (data.connections?.length) {
    store.dispatch(setConnections(data.connections as Connection[]))
  }
  if (data.favorites?.length) {
    for (const key of data.favorites as string[]) {
      store.dispatch(toggleFavorite(key))
    }
  }
  if (data.relationships?.length) {
    for (const r of data.relationships as Relationship[]) {
      store.dispatch(addRelationship({ a: r.a, b: r.b, typeId: r.typeId }))
    }
  }
  if (data.customTypes?.length) {
    for (const t of data.customTypes as RelationshipType[]) {
      store.dispatch(addCustomType(t))
    }
  }
  if (data.notes) {
    for (const [key, text] of Object.entries(data.notes as Record<string, string>)) {
      store.dispatch(setNote({ key, text }))
    }
  }
  if (data.archives?.length) {
    for (const key of data.archives as string[]) {
      store.dispatch(toggleArchive(key))
    }
  }
}

/** Debounced sync — pushes the current state to the server */
let syncTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSyncToServer() {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    const state = store.getState()
    const token = state.auth.token
    if (!token) return

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }

    await Promise.allSettled([
      fetch('/api/connections', {
        method: 'POST',
        headers,
        body: JSON.stringify(
          state.connections.connections.map((c) => ({ ...c, personKey: personKey(c) }))
        ),
      }),
      fetch('/api/favorites', {
        method: 'PUT',
        headers,
        body: JSON.stringify(state.connections.favorites),
      }),
      fetch('/api/archives', {
        method: 'PUT',
        headers,
        body: JSON.stringify(state.connections.archived),
      }),
      fetch('/api/relationships', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          relationships: state.relationships.relationships,
          customTypes: state.relationships.customTypes,
        }),
      }),
      fetch('/api/notes', {
        method: 'PUT',
        headers,
        body: JSON.stringify(state.notes.notes),
      }),
    ])
  }, 1000)
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const saved = loadPersistedState()

    // Always restore UI preferences from localStorage
    if (saved.ui?.theme) store.dispatch(setTheme(saved.ui.theme))
    if (saved.ui?.onboardingComplete) store.dispatch(completeOnboarding())

    // Check for an existing token (stored by previous session)
    const existingToken = getToken()
    if (existingToken) {
      // Restore auth state from localStorage, then sync from server
      store.dispatch(setToken(existingToken))
      restoreUser(existingToken).catch(console.error)
      hydrateFromServer(existingToken).catch(console.error)
    } else {
      // No auth — hydrate data from localStorage as before
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
    }

    // Subscribe to state changes
    let prevToken: string | null = null
    store.subscribe(() => {
      const state = store.getState()
      const token = state.auth.token

      // Persist token and UI to localStorage always
      saveState(state)

      // When token changes from null → value, a new login just happened — sync from server
      if (token && token !== prevToken) {
        hydrateFromServer(token).catch(console.error)
      }
      prevToken = token

      // If authenticated, debounce-push data changes to server
      if (token) {
        scheduleSyncToServer()
      }
    })
  }, [])

  return <Provider store={store}>{children}</Provider>
}
