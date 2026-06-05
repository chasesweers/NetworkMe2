import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice } from './connectionSlice'
import { relationshipSlice } from './relationshipSlice'
import { noteSlice } from './noteSlice'
import { authSlice } from './authSlice'
import { uiSlice } from './uiSlice'

export const store = configureStore({
  reducer: {
    connections: connectionSlice.reducer,
    relationships: relationshipSlice.reducer,
    notes: noteSlice.reducer,
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Keys persisted to localStorage
const PERSIST_KEY = 'nm_redux'

export function loadPersistedState(): Partial<RootState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveState(state: RootState) {
  try {
    const isAuthenticated = !!state.auth.token
    // When authenticated, server is the source of truth — don't persist data slices to localStorage.
    // Always persist ui preferences and the token itself (via nm_token key used by lib/api.ts).
    const payload: Record<string, unknown> = { ui: state.ui }
    if (!isAuthenticated) {
      payload.connections = { connections: state.connections.connections, favorites: state.connections.favorites }
      payload.relationships = state.relationships
      payload.notes = state.notes
    }
    if (state.auth.token) {
      localStorage.setItem('nm_token', state.auth.token)
    } else {
      localStorage.removeItem('nm_token')
    }
    localStorage.setItem(PERSIST_KEY, JSON.stringify(payload))
  } catch {
    // storage quota exceeded — ignore
  }
}
