import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
const TAYLOR: Connection = { name: 'Taylor Kim', title: 'Data Scientist', company: 'Analytics Co', connected: '2021-07-10', url: '', email: '' }

function makeStore() {
  return configureStore({
    reducer: {
      connections: connectionSlice.reducer,
      relationships: relationshipSlice.reducer,
    },
  })
}

function renderManager(store: ReturnType<typeof makeStore>) {
  return render(
    <Provider store={store}>
      <RelationshipManager currentKey={personKey(ALEX)} />
    </Provider>
  )
}

describe('ConnectionSearch — UI replaces dropdown', () => {
  it('renders a text input for searching, not a select for "With"', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN, MORGAN]))
    renderManager(store)
    expect(screen.getByRole('textbox', { name: /search connections/i })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /with/i })).not.toBeInTheDocument()
  })

  it('Add button is disabled when no connection is selected', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    renderManager(store)
    expect(screen.getByRole('button', { name: /add relationship/i })).toBeDisabled()
  })
})

describe('ConnectionSearch — filtering', () => {
  it('typing shows matching suggestions', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN, MORGAN, TAYLOR]))
    renderManager(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'jor' },
    })

    expect(screen.getByRole('option', { name: /jordan lee/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /morgan chen/i })).not.toBeInTheDocument()
  })

  it('search is case-insensitive', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN, MORGAN]))
    renderManager(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'MORGAN' },
    })

    expect(screen.getByRole('option', { name: /morgan chen/i })).toBeInTheDocument()
  })

  it('empty input shows no suggestion list', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN, MORGAN]))
    renderManager(store)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not suggest the current profile person', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    renderManager(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'alex' },
    })

    expect(screen.queryByRole('option', { name: /alex rivera/i })).not.toBeInTheDocument()
  })
})

describe('ConnectionSearch — selection', () => {
  it('clicking a suggestion fills the input and hides the list', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN, MORGAN]))
    renderManager(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'jor' },
    })
    fireEvent.click(screen.getByRole('option', { name: /jordan lee/i }))

    expect(screen.getByRole('textbox', { name: /search connections/i })).toHaveValue('Jordan Lee')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('Add button is enabled after selecting a connection', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    renderManager(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'jor' },
    })
    fireEvent.click(screen.getByRole('option', { name: /jordan lee/i }))

    expect(screen.getByRole('button', { name: /add relationship/i })).not.toBeDisabled()
  })

  it('clearing the input disables the Add button', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    renderManager(store)

    const input = screen.getByRole('textbox', { name: /search connections/i })
    fireEvent.change(input, { target: { value: 'jor' } })
    fireEvent.click(screen.getByRole('option', { name: /jordan lee/i }))
    fireEvent.change(input, { target: { value: '' } })

    expect(screen.getByRole('button', { name: /add relationship/i })).toBeDisabled()
  })

  it('dispatches addRelationship with the selected connection on submit', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    renderManager(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'jor' },
    })
    fireEvent.click(screen.getByRole('option', { name: /jordan lee/i }))
    fireEvent.click(screen.getByRole('button', { name: /add relationship/i }))

    expect(store.getState().relationships.relationships).toHaveLength(1)
    expect(store.getState().relationships.relationships[0].b).toBe(personKey(JORDAN))
  })

  it('clears the search input after adding a relationship', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    renderManager(store)

    fireEvent.change(screen.getByRole('textbox', { name: /search connections/i }), {
      target: { value: 'jor' },
    })
    fireEvent.click(screen.getByRole('option', { name: /jordan lee/i }))
    fireEvent.click(screen.getByRole('button', { name: /add relationship/i }))

    expect(screen.getByRole('textbox', { name: /search connections/i })).toHaveValue('')
  })
})
