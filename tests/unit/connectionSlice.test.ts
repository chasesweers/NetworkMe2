import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice, setConnections, clearConnections, toggleFavorite, setSearchQuery, setFilters, selectFilteredConnections, selectIsFavorite } from '@/stores/connectionSlice'
import type { Connection } from '@/lib/types'
import { personKey } from '@/lib/data'

const ALEX: Connection = { name: 'Alex Rivera', title: 'Engineer', company: 'Acme Corp', connected: '2023-01-15', url: '', email: '' }
const JORDAN: Connection = { name: 'Jordan Lee', title: 'PM', company: 'Startup Inc', connected: '2022-11-03', url: '', email: '' }

function makeStore() {
  return configureStore({ reducer: { connections: connectionSlice.reducer } })
}

type TestStore = ReturnType<typeof makeStore>

describe('setConnections', () => {
  it('stores the provided connections', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    expect(store.getState().connections.connections).toHaveLength(2)
  })
})

describe('clearConnections', () => {
  it('empties the connections array', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX]))
    store.dispatch(clearConnections())
    expect(store.getState().connections.connections).toHaveLength(0)
  })
})

describe('toggleFavorite', () => {
  const key = personKey(ALEX)

  it('adds to favorites on first toggle', () => {
    const store = makeStore()
    store.dispatch(toggleFavorite(key))
    expect(selectIsFavorite(key)(store.getState())).toBe(true)
  })

  it('removes from favorites on second toggle', () => {
    const store = makeStore()
    store.dispatch(toggleFavorite(key))
    store.dispatch(toggleFavorite(key))
    expect(selectIsFavorite(key)(store.getState())).toBe(false)
  })
})

describe('selectFilteredConnections', () => {
  let store: TestStore

  beforeEach(() => {
    store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
  })

  it('returns all connections when no filters active', () => {
    expect(selectFilteredConnections(store.getState())).toHaveLength(2)
  })

  it('filters by search query (name)', () => {
    store.dispatch(setSearchQuery('jordan'))
    const result = selectFilteredConnections(store.getState())
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Jordan Lee')
  })

  it('filters by company', () => {
    store.dispatch(setFilters({ company: 'Acme' }))
    const result = selectFilteredConnections(store.getState())
    expect(result).toHaveLength(1)
    expect(result[0].company).toBe('Acme Corp')
  })

  it('filters by title', () => {
    store.dispatch(setFilters({ title: 'PM' }))
    const result = selectFilteredConnections(store.getState())
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('PM')
  })

  it('filters to favorites only', () => {
    store.dispatch(toggleFavorite(personKey(ALEX)))
    store.dispatch(setFilters({ favoritesOnly: true }))
    const result = selectFilteredConnections(store.getState())
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alex Rivera')
  })

  it('search is case-insensitive', () => {
    store.dispatch(setSearchQuery('ACME'))
    expect(selectFilteredConnections(store.getState())).toHaveLength(1)
  })
})
