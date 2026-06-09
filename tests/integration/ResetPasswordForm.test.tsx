import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

const { mockPush, mockGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGet: vi.fn((k: string) => k === 'token' ? 'validtoken123' : null),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}))

beforeEach(() => {
  mockPush.mockClear()
  vi.restoreAllMocks()
  // Default: token is present
  mockGet.mockImplementation((k: string) => k === 'token' ? 'validtoken123' : null)
})

describe('ResetPasswordForm', () => {
  it('renders two password fields and a submit button', () => {
    render(<ResetPasswordForm />)
    const inputs = document.querySelectorAll('input[type="password"]')
    expect(inputs).toHaveLength(2)
    expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument()
  })

  it('submit button is disabled while fields are empty', () => {
    render(<ResetPasswordForm />)
    expect(screen.getByRole('button', { name: /set new password/i })).toBeDisabled()
  })

  it('shows an error when passwords do not match', async () => {
    render(<ResetPasswordForm />)
    const [pw, confirm] = Array.from(document.querySelectorAll('input[type="password"]'))
    fireEvent.change(pw, { target: { value: 'password123' } })
    fireEvent.change(confirm, { target: { value: 'different456' } })
    fireEvent.submit(screen.getByRole('button', { name: /set new password/i }))
    await waitFor(() => expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument())
  })

  it('shows an error when password is too short', async () => {
    render(<ResetPasswordForm />)
    const [pw, confirm] = Array.from(document.querySelectorAll('input[type="password"]'))
    fireEvent.change(pw, { target: { value: 'short' } })
    fireEvent.change(confirm, { target: { value: 'short' } })
    fireEvent.submit(screen.getByRole('button', { name: /set new password/i }))
    await waitFor(() => expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument())
  })

  it('redirects to /login?reset=1 on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<ResetPasswordForm />)
    const [pw, confirm] = Array.from(document.querySelectorAll('input[type="password"]'))
    fireEvent.change(pw, { target: { value: 'newpassword123' } })
    fireEvent.change(confirm, { target: { value: 'newpassword123' } })
    fireEvent.submit(screen.getByRole('button', { name: /set new password/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login?reset=1'))
  })

  it('shows a server error message on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400 })
    )
    render(<ResetPasswordForm />)
    const [pw, confirm] = Array.from(document.querySelectorAll('input[type="password"]'))
    fireEvent.change(pw, { target: { value: 'newpassword123' } })
    fireEvent.change(confirm, { target: { value: 'newpassword123' } })
    fireEvent.submit(screen.getByRole('button', { name: /set new password/i }))
    await waitFor(() => expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument())
  })
})

describe('ResetPasswordForm — missing token', () => {
  it('shows a missing token message when no token in URL', () => {
    mockGet.mockReturnValue(null)
    render(<ResetPasswordForm />)
    expect(screen.getByText(/missing reset token/i)).toBeInTheDocument()
  })
})
