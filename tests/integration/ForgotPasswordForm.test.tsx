import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

beforeEach(() => vi.restoreAllMocks())

describe('ForgotPasswordForm', () => {
  it('renders an email field and submit button', () => {
    render(<ForgotPasswordForm />)
    expect(document.querySelector('input[type="email"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('submit button is disabled while email is empty', () => {
    render(<ForgotPasswordForm />)
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeDisabled()
  })

  it('shows a success message after a successful submission', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<ForgotPasswordForm />)
    fireEvent.change(document.querySelector('input[type="email"]')!, { target: { value: 'a@b.com' } })
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => expect(screen.getByText(/reset link is on its way/i)).toBeInTheDocument())
  })

  it('shows the submitted email address in the success message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    render(<ForgotPasswordForm />)
    fireEvent.change(document.querySelector('input[type="email"]')!, { target: { value: 'chase@example.com' } })
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => expect(screen.getByText(/chase@example\.com/)).toBeInTheDocument())
  })

  it('shows an error message on a non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Too many attempts. Please try again later.' }), { status: 429 })
    )
    render(<ForgotPasswordForm />)
    fireEvent.change(document.querySelector('input[type="email"]')!, { target: { value: 'a@b.com' } })
    fireEvent.submit(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => expect(screen.getByText(/too many attempts/i)).toBeInTheDocument())
  })

  it('renders a back to sign in link', () => {
    render(<ForgotPasswordForm />)
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument()
  })
})
