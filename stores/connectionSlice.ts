import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit'
import type { Connection } from '@/lib/types'
import { personKey } from '@/lib/data'
import type { RootState } from './index'

interface Filters {
  company: string
  title: string
  favoritesOnly: boolean
  archivedOnly: boolean
}

interface ConnectionState {
  connections: Connection[]
  favorites: string[]
  archived: string[]
  searchQuery: string
  filters: Filters
}

const initialState: ConnectionState = {
  connections: [],
  favorites: [],
  archived: [],
  searchQuery: '',
  filters: { company: '', title: '', favoritesOnly: false, archivedOnly: false },
}

export const connectionSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    setConnections(state, action: PayloadAction<Connection[]>) {
      state.connections = action.payload
    },
    mergeConnections(state, action: PayloadAction<Connection[]>) {
      const map = new Map(state.connections.map(c => [personKey(c), c]))
      for (const c of action.payload) {
        map.set(personKey(c), c)
      }
      state.connections = Array.from(map.values())
    },
    clearConnections(state) {
      state.connections = []
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const key = action.payload
      const idx = state.favorites.indexOf(key)
      if (idx === -1) state.favorites.push(key)
      else state.favorites.splice(idx, 1)
    },
    toggleArchive(state, action: PayloadAction<string>) {
      const key = action.payload
      const idx = state.archived.indexOf(key)
      if (idx === -1) state.archived.push(key)
      else state.archived.splice(idx, 1)
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload
    },
    setFilters(state, action: PayloadAction<Partial<Filters>>) {
      state.filters = { ...state.filters, ...action.payload }
    },
  },
})

export const { setConnections, mergeConnections, clearConnections, toggleFavorite, toggleArchive, setSearchQuery, setFilters } =
  connectionSlice.actions

// Selectors
export const selectConnections = (s: RootState) => s.connections.connections
export const selectFavorites = (s: RootState) => s.connections.favorites
export const selectArchived = (s: RootState) => s.connections.archived
export const selectSearchQuery = (s: RootState) => s.connections.searchQuery
export const selectFilters = (s: RootState) => s.connections.filters

export const selectActiveConnections = createSelector(
  selectConnections,
  selectArchived,
  (connections, archived) => connections.filter(c => !archived.includes(personKey(c)))
)

export const selectFilteredConnections = createSelector(
  selectConnections,
  selectFavorites,
  selectArchived,
  selectSearchQuery,
  selectFilters,
  (connections, favorites, archived, searchQuery, filters) => {
    const q = searchQuery.toLowerCase()
    return connections.filter((c) => {
      const key = personKey(c)
      if (!filters.archivedOnly && archived.includes(key)) return false
      if (filters.archivedOnly && !archived.includes(key)) return false
      if (filters.favoritesOnly && !favorites.includes(key)) return false
      if (filters.company && !c.company.toLowerCase().includes(filters.company.toLowerCase())) return false
      if (filters.title && !c.title.toLowerCase().includes(filters.title.toLowerCase())) return false
      if (q) {
        const hay = `${c.name} ${c.title} ${c.company}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }
)

export const selectIsFavorite = (key: string) => (s: RootState) =>
  s.connections.favorites.includes(key)

export const selectIsArchived = (key: string) => (s: RootState) =>
  s.connections.archived.includes(key)
