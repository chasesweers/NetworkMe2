import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { authSlice } from '@/stores/authSlice'
import { uiSlice } from '@/stores/uiSlice'
import { LoginForm } from '@/components/auth/LoginForm'

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}))

function makeStore() {
  return configureStore({ reducer: { auth: authSlice.reducer, ui: uiSlice.reducer } })
}

function renderForm() {
  const store = makeStore()
  const result = render(<Provider store={store}><LoginForm /></Provider>)
  return { store, container: result.container }
}

// LoginForm labels lack htmlFor, so we query inputs by type directly
function getEmailInput(container: HTMLElement) {
  return container.querySelector('input[type="email"]') as HTMLInputElement
}
function getPasswordInput(container: HTMLElement) {
  return container.querySelector('input[type="password"]') as HTMLInputElement
}

beforeEach(() => {
  mockPush.mockClear()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('LoginForm', () => {
  it('renders email and password fields and a submit button', () => {
    const { container } = renderForm()
    expect(getEmailInput(container)).toBeInTheDocument()
    expect(getPasswordInput(container)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders a link to the register page', () => {
    renderForm()
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument()
  })

  it('renders the guest button', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument()
  })

  it('shows a server error message on failed login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 })
    )
    const { container } = renderForm()
    fireEvent.change(getEmailInput(container), { target: { value: 'a@b.com' } })
    fireEvent.change(getPasswordInput(container), { target: { value: 'wrongpassword' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument())
  })

  it('stores the token and dispatches setUser on successful login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'tok-abc', user: { id: 1, email: 'a@b.com', isAdmin: false } }), { status: 200 })
    )
    const { store, container } = renderForm()
    fireEvent.change(getEmailInput(container), { target: { value: 'a@b.com' } })
    fireEvent.change(getPasswordInput(container), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(store.getState().auth.user).not.toBeNull())
    expect(localStorage.getItem('nm_token')).toBe('tok-abc')
    expect(mockPush).toHaveBeenCalledWith('/search')
  })

  it('redirects to the "from" param after login', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 't', user: { id: 1, email: 'a@b.com', isAdmin: false } }), { status: 200 })
    )
    const { container } = renderForm()
    fireEvent.change(getEmailInput(container), { target: { value: 'a@b.com' } })
    fireEvent.change(getPasswordInput(container), { target: { value: 'password123' } })
    fireEvent.submit(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(mockPush).toHaveBeenCalled())
  })
})
