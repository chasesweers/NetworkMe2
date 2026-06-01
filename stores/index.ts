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
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        connections: { connections: state.connections.connections, favorites: state.connections.favorites },
        relationships: state.relationships,
        notes: state.notes,
        ui: state.ui,
      })
    )
  } catch {
    // storage quota exceeded — ignore
  }
}
