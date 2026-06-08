import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }

// Mock GraphView to avoid canvas/physics complexity — just capture props
vi.mock('@/components/graph/GraphView', () => ({
  GraphView: (props: Record<string, unknown>) => (
    <div data-testid="graph-view" data-readonly={String(props.readOnly)}>
      {props.initialConnections ? `${(props.initialConnections as unknown[]).length} connections` : 'no data'}
    </div>
  ),
}))

import type { Connection, Relationship, RelationshipType } from '@/lib/types'

const connections: Connection[] = [
  { name: 'Bob', title: 'Eng', company: 'Acme', connected: '', url: '', email: '' },
]
const relationships: Relationship[] = []
const customTypes: RelationshipType[] = []

describe('SharedGraphView', () => {
  it('renders the "Viewing X shared network" banner', async () => {
    const { SharedGraphView } = await import('@/components/graph/SharedGraphView')
    render(<SharedGraphView ownerName="Alice" connections={connections} relationships={relationships} customTypes={customTypes} />)
    // Banner text is split across elements; check that the container includes all parts
    expect(screen.getByText(/shared network/i)).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders GraphView with readOnly=true and passes connection data', async () => {
    const { SharedGraphView } = await import('@/components/graph/SharedGraphView')
    render(<SharedGraphView ownerName="Alice" connections={connections} relationships={relationships} customTypes={customTypes} />)
    const gv = screen.getByTestId('graph-view')
    expect(gv).toHaveAttribute('data-readonly', 'true')
    expect(gv).toHaveTextContent('1 connections')
  })

  it('renders without a Redux Provider (no store needed)', async () => {
    const { SharedGraphView } = await import('@/components/graph/SharedGraphView')
    // If this throws due to missing store context, the test fails
    expect(() =>
      render(<SharedGraphView ownerName="Alice" connections={connections} relationships={relationships} customTypes={customTypes} />)
    ).not.toThrow()
  })
})
