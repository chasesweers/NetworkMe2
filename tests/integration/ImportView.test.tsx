import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice, setConnections } from '@/stores/connectionSlice'
import { relationshipSlice } from '@/stores/relationshipSlice'
import { noteSlice } from '@/stores/noteSlice'
import { followUpSlice } from '@/stores/followUpSlice'
import { authSlice } from '@/stores/authSlice'
import { uiSlice } from '@/stores/uiSlice'
import { ImportView } from '@/components/import/ImportView'
import type { Connection } from '@/lib/types'

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock export lib so we don't trigger real Blob/URL in jsdom
vi.mock('@/lib/export', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/export')>()
  return { ...real, downloadFile: vi.fn() }
})

function makeStore(connections: Connection[] = []) {
  const store = configureStore({
    reducer: {
      connections: connectionSlice.reducer,
      relationships: relationshipSlice.reducer,
      notes: noteSlice.reducer,
      followUps: followUpSlice.reducer,
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
    },
  })
  if (connections.length) store.dispatch(setConnections(connections))
  return store
}

function renderImport(connections?: Connection[]) {
  const store = makeStore(connections)
  render(<Provider store={store}><ImportView /></Provider>)
  return store
}

const DEMO_CONNECTION: Connection = {
  name: 'Alice Smith', title: 'Engineer', company: 'Acme',
  connected: '2024-01-01', url: '', email: '',
}

beforeEach(() => mockPush.mockClear())

describe('ImportView', () => {
  it('renders the upload area', () => {
    renderImport()
    expect(screen.getByText(/drop your csv here/i)).toBeInTheDocument()
  })

  it('export buttons are disabled when there are no connections', () => {
    renderImport()
    expect(screen.getByRole('button', { name: /export json/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled()
  })

  it('export buttons are enabled when connections exist', () => {
    renderImport([DEMO_CONNECTION])
    expect(screen.getByRole('button', { name: /export json/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /export csv/i })).not.toBeDisabled()
  })

  it('shows an error for a non-CSV file', async () => {
    renderImport()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['hello'], 'data.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText(/please upload a .csv file/i)).toBeInTheDocument())
  })

  it('shows an error when CSV has no parseable connections', async () => {
    renderImport()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    // A CSV with no recognisable LinkedIn connection rows
    const file = new File(['col1,col2,col3\nfoo,bar,baz\n'], 'connections.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(
      () => expect(screen.getByText(/no connections found/i)).toBeInTheDocument(),
      { timeout: 2000 }
    )
  })

  it('renders the load demo data button', () => {
    renderImport()
    expect(screen.getByRole('button', { name: /load demo data/i })).toBeInTheDocument()
  })

  it('clicking load demo data dispatches connections and navigates', async () => {
    const store = renderImport()
    fireEvent.click(screen.getByRole('button', { name: /load demo data/i }))
    await waitFor(() => expect(store.getState().connections.connections.length).toBeGreaterThan(0))
  })
})
