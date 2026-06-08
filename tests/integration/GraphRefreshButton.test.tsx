import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// JSDOM doesn't implement ResizeObserver
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice, setConnections } from '@/stores/connectionSlice'
import { relationshipSlice } from '@/stores/relationshipSlice'
import { noteSlice } from '@/stores/noteSlice'
import { uiSlice } from '@/stores/uiSlice'
import { GraphView } from '@/components/graph/GraphView'
import type { Connection } from '@/lib/types'

const ALEX: Connection = { name: 'Alex Rivera', title: 'Engineer', company: 'Acme', connected: '2023-01-15', url: '', email: '' }
const JORDAN: Connection = { name: 'Jordan Lee', title: 'PM', company: 'Startup', connected: '2022-11-03', url: '', email: '' }

function makeStore() {
  return configureStore({
    reducer: {
      connections: connectionSlice.reducer,
      relationships: relationshipSlice.reducer,
      notes: noteSlice.reducer,
      ui: uiSlice.reducer,
    },
  })
}

describe('GraphView — refresh button', () => {
  it('renders a "Refresh graph" button in the controls panel', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    render(<Provider store={store}><GraphView /></Provider>)
    expect(screen.getByRole('button', { name: /refresh graph/i })).toBeInTheDocument()
  })

  it('Refresh graph button is clickable without error', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX, JORDAN]))
    render(<Provider store={store}><GraphView /></Provider>)
    expect(() => fireEvent.click(screen.getByRole('button', { name: /refresh graph/i }))).not.toThrow()
  })
})
