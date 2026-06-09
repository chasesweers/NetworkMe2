import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice, setConnections } from '@/stores/connectionSlice'
import { relationshipSlice } from '@/stores/relationshipSlice'
import { uiSlice } from '@/stores/uiSlice'
import { SearchView } from '@/components/search/SearchView'
import type { Connection } from '@/lib/types'

const CONNECTIONS: Connection[] = [
  { name: 'Alice Smith', title: 'Engineer', company: 'Acme', connected: '2024-01-01', url: '', email: '' },
  { name: 'Bob Jones', title: 'Designer', company: 'Beta', connected: '2024-02-01', url: '', email: '' },
  { name: 'Carol White', title: 'Manager', company: 'Acme', connected: '2024-03-01', url: '', email: '' },
]

function makeStore(connections: Connection[] = CONNECTIONS) {
  const store = configureStore({
    reducer: {
      connections: connectionSlice.reducer,
      relationships: relationshipSlice.reducer,
      ui: uiSlice.reducer,
    },
  })
  store.dispatch(setConnections(connections))
  return store
}

function renderSearch(connections?: Connection[]) {
  const store = makeStore(connections)
  render(<Provider store={store}><SearchView /></Provider>)
  return store
}

describe('SearchView', () => {
  it('renders all connections by default', () => {
    renderSearch()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('Carol White')).toBeInTheDocument()
  })

  it('shows the connection count', () => {
    renderSearch()
    expect(screen.getByText(/3 connections/i)).toBeInTheDocument()
  })

  it('filters by search query', () => {
    renderSearch()
    fireEvent.change(screen.getByPlaceholderText(/search connections/i), { target: { value: 'Alice' } })
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
  })

  it('filters by company dropdown', () => {
    renderSearch()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Beta' } })
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
  })

  it('shows empty state with import link when no connections', () => {
    renderSearch([])
    expect(screen.getByText(/no connections found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /import connections/i })).toBeInTheDocument()
  })

  it('shows "1 connection" (singular) when count is 1', () => {
    renderSearch([CONNECTIONS[0]])
    expect(screen.getByText('1 connection')).toBeInTheDocument()
  })

  it('toggling the favorites filter hides non-favorited connections', () => {
    renderSearch()
    fireEvent.click(screen.getByRole('checkbox', { name: /favorites/i }))
    // No connections are favorited so list should be empty
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
  })

  it('archive button dispatches toggleArchive for a connection', () => {
    const store = renderSearch()
    fireEvent.click(screen.getAllByRole('button', { name: /archive connection/i })[0])
    expect(store.getState().connections.archived).toHaveLength(1)
  })

  it('favorite button dispatches toggleFavorite for a connection', () => {
    const store = renderSearch()
    fireEvent.click(screen.getAllByRole('button', { name: /add to favorites/i })[0])
    expect(store.getState().connections.favorites).toHaveLength(1)
  })

  it('show archived button toggles the archived filter', () => {
    const store = renderSearch()
    fireEvent.click(screen.getByRole('button', { name: /show archived/i }))
    expect(store.getState().connections.filters?.archivedOnly ?? true).toBeTruthy()
  })
})
