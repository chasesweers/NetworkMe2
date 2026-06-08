import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminTable } from '@/components/admin/AdminTable'

type Row = { id: number; name: string; role: string }

const COLUMNS = [
  { key: 'name' as const, label: 'Name' },
  { key: 'role' as const, label: 'Role' },
]

const ROWS: Row[] = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
]

describe('AdminTable', () => {
  it('renders column headers', () => {
    render(<AdminTable columns={COLUMNS} rows={ROWS} keyField="id" />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
  })

  it('renders a row for each data item', () => {
    render(<AdminTable columns={COLUMNS} rows={ROWS} keyField="id" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('shows "No data" when rows array is empty', () => {
    render(<AdminTable columns={COLUMNS} rows={[]} keyField="id" />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('uses a custom render function when provided', () => {
    const columns = [
      { key: 'name' as const, label: 'Name', render: (row: Row) => <strong>{row.name.toUpperCase()}</strong> },
    ]
    render(<AdminTable columns={columns} rows={[ROWS[0]]} keyField="id" />)
    expect(screen.getByText('ALICE')).toBeInTheDocument()
  })

  it('falls back to stringifying the value when no render function', () => {
    render(<AdminTable columns={COLUMNS} rows={ROWS} keyField="id" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
})
