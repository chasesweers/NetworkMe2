import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice, setConnections } from '@/stores/connectionSlice'
import { relationshipSlice, addRelationship } from '@/stores/relationshipSlice'
import { RelationshipManager } from '@/components/profile/RelationshipManager'
import type { Connection } from '@/lib/types'
import { personKey } from '@/lib/data'

const ALEX: Connection = { name: 'Alex Rivera', title: 'Engineer', company: 'Acme Corp', connected: '2023-01-15', url: '', email: '' }
const JORDAN: Connection = { name: 'Jordan Lee', title: 'PM', company: 'Startup Inc', connected: '2022-11-03', url: '', email: '' }
const MORGAN: Connection = { name: 'Morgan Chen', title: 'Designer', company: 'Creative Studio', connected: '2023-03-22', url: '', email: '' }

function makeStore() {
  return configureStore({
    reducer: {
      connections: connectionSlice.reducer,
      relationships: relationshipSlice.reducer,
    },
  })
}

function renderWithStore(store: ReturnType<typeof makeStore>) {
  return render(
    <Provider store={store}>
      <RelationshipManager currentKey={personKey(ALEX)} />
    </Provider>
  )
}

describe('RelationshipManager', () => {
  it('renders the add-relationship form with a search input', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN, MORGAN]))
    renderWithStore(store)
    expect(screen.getByRole('button', { name: /add relationship/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /search connections/i })).toBeInTheDocument()
  })

  it('does not include the current person as a suggestion', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN, MORGAN]))
    renderWithStore(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'alex' },
    })

    expect(screen.queryByRole('option', { name: /alex rivera/i })).not.toBeInTheDocument()
  })

  it('shows existing relationships with a remove button', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    store.dispatch(addRelationship({ a: personKey(ALEX), b: personKey(JORDAN), typeId: 'friend' }))
    renderWithStore(store)
    expect(screen.getByRole('link', { name: 'Jordan Lee' })).toBeInTheDocument()
    expect(screen.getAllByText('Friend').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('dispatches addRelationship via search → select → submit', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    renderWithStore(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'jor' },
    })
    fireEvent.click(screen.getByRole('option', { name: /jordan lee/i }))
    fireEvent.click(screen.getByRole('button', { name: /add relationship/i }))

    expect(store.getState().relationships.relationships).toHaveLength(1)
    expect(store.getState().relationships.relationships[0].typeId).toBe('friend')
  })

  it('dispatches removeRelationship when remove button is clicked', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    store.dispatch(addRelationship({ a: personKey(ALEX), b: personKey(JORDAN), typeId: 'friend' }))
    renderWithStore(store)

    fireEvent.click(screen.getByRole('button', { name: /remove/i }))

    expect(store.getState().relationships.relationships).toHaveLength(0)
  })

  it('shows empty state message when no relationships exist', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    renderWithStore(store)
    expect(screen.getByText(/no relationships yet/i)).toBeInTheDocument()
  })
})
