import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('ShareControls', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('shows "Generate link" when no share token exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: null }) }))
    const { ShareControls } = await import('@/components/graph/ShareControls')
    render(<ShareControls />)
    await waitFor(() => expect(screen.getByRole('button', { name: /generate link/i })).toBeInTheDocument())
  })

  it('shows "Copy link" and "Revoke" when a token exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'abc-123' }) }))
    const { ShareControls } = await import('@/components/graph/ShareControls')
    render(<ShareControls />)
    await waitFor(() => expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /revoke/i })).toBeInTheDocument()
  })

  it('POSTs to /api/share on "Generate link" click', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: null }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'new-token' }) })
    vi.stubGlobal('fetch', fetchMock)
    const { ShareControls } = await import('@/components/graph/ShareControls')
    render(<ShareControls />)
    await waitFor(() => screen.getByRole('button', { name: /generate link/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate link/i }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/share', expect.objectContaining({ method: 'POST' }))
    })
  })

  it('DELETEs /api/share on "Revoke" click', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'abc-123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)
    const { ShareControls } = await import('@/components/graph/ShareControls')
    render(<ShareControls />)
    await waitFor(() => screen.getByRole('button', { name: /revoke/i }))
    fireEvent.click(screen.getByRole('button', { name: /revoke/i }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/share', expect.objectContaining({ method: 'DELETE' }))
    })
  })

  it('writes share URL to clipboard on "Copy link" click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'abc-123' }) }))
    vi.stubGlobal('location', { origin: 'http://localhost:3000' })
    const { ShareControls } = await import('@/components/graph/ShareControls')
    render(<ShareControls />)
    await waitFor(() => screen.getByRole('button', { name: /copy link/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost:3000/shared/abc-123'))
  })
})
