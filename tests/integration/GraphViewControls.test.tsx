/**
 * Tests for GraphView's mobile controls (toggle button + bottom sheet).
 * Canvas rendering and physics are tested in unit/graphData.test.ts.
 * Touch events are tested in unit/graphPhysics.test.ts.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice } from '@/stores/connectionSlice'
import { relationshipSlice } from '@/stores/relationshipSlice'
import { uiSlice } from '@/stores/uiSlice'
import { followUpSlice } from '@/stores/followUpSlice'
import { authSlice } from '@/stores/authSlice'
import { noteSlice } from '@/stores/noteSlice'
import { GraphView } from '@/components/graph/GraphView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// jsdom stubs
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// Canvas methods are not implemented in jsdom — stub them out
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), scale: vi.fn(),
  translate: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
  arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(), fillText: vi.fn(),
  strokeStyle: '', fillStyle: '', lineWidth: 0, font: '',
  textAlign: 'center', textBaseline: 'middle',
})

function makeStore() {
  return configureStore({
    reducer: {
      connections: connectionSlice.reducer,
      relationships: relationshipSlice.reducer,
      notes: noteSlice.reducer,
      followUps: followUpSlice.reducer,
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
    },
  })
}

function renderGraph() {
  const store = makeStore()
  render(<Provider store={store}><GraphView /></Provider>)
  return store
}

describe('GraphView — mobile controls toggle', () => {
  it('renders the mobile toggle button', () => {
    renderGraph()
    expect(screen.getByRole('button', { name: /toggle graph controls/i })).toBeInTheDocument()
  })

  it('mobile bottom sheet is hidden by default', () => {
    renderGraph()
    expect(screen.queryByText('Graph controls')).not.toBeInTheDocument()
  })

  it('opens the bottom sheet when toggle is clicked', () => {
    renderGraph()
    fireEvent.click(screen.getByRole('button', { name: /toggle graph controls/i }))
    expect(screen.getByText('Graph controls')).toBeInTheDocument()
  })

  it('bottom sheet contains filter, labels, reset zoom and refresh controls', () => {
    renderGraph()
    fireEvent.click(screen.getByRole('button', { name: /toggle graph controls/i }))
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/reset zoom/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /refresh graph/i }).length).toBeGreaterThan(0)
  })

  it('closes the bottom sheet when the close button is clicked', () => {
    renderGraph()
    fireEvent.click(screen.getByRole('button', { name: /toggle graph controls/i }))
    expect(screen.getByText('Graph controls')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close controls/i }))
    expect(screen.queryByText('Graph controls')).not.toBeInTheDocument()
  })
})

describe('GraphView — empty state', () => {
  it('shows an import link when there are no connections', () => {
    renderGraph()
    expect(screen.getByRole('link', { name: /import connections/i })).toBeInTheDocument()
  })
})
