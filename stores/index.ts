import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice } from './connectionSlice'
import { relationshipSlice } from './relationshipSlice'
import { noteSlice } from './noteSlice'
import { followUpSlice } from './followUpSlice'
import { authSlice } from './authSlice'
import { uiSlice } from './uiSlice'
import { getToken, clearToken } from '@/lib/api'

export const store = configureStore({
  reducer: {
    connections: connectionSlice.reducer,
    relationships: relationshipSlice.reducer,
    notes: noteSlice.reducer,
    followUps: followUpSlice.reducer,
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
    const isAuthenticated = !!getToken()
    // When authenticated, server is the source of truth — don't persist data slices to localStorage.
    const payload: Record<string, unknown> = { ui: state.ui }
    if (!isAuthenticated) {
      payload.connections = { connections: state.connections.connections, favorites: state.connections.favorites }
      payload.relationships = state.relationships
      payload.notes = state.notes
      payload.followUps = state.followUps
    }
    if (!state.auth.user) {
      clearToken()
    }
    localStorage.setItem(PERSIST_KEY, JSON.stringify(payload))
  } catch {
    // storage quota exceeded — ignore
  }
}
