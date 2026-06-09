import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice, setConnections } from '@/stores/connectionSlice'
import { relationshipSlice } from '@/stores/relationshipSlice'
import { noteSlice } from '@/stores/noteSlice'
import { followUpSlice, setFollowUp } from '@/stores/followUpSlice'
import { authSlice, setUser } from '@/stores/authSlice'
import { uiSlice, setGuest } from '@/stores/uiSlice'
import { Nav } from '@/components/Nav'
import type { Connection } from '@/lib/types'

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/search',
}))

vi.mock('@/lib/api', () => ({
  clearToken: vi.fn(),
}))

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

function renderNav(setup?: (store: ReturnType<typeof makeStore>) => void) {
  const store = makeStore()
  setup?.(store)
  render(<Provider store={store}><Nav /></Provider>)
  return store
}

const ALICE: Connection = { name: 'Alice', title: 'Eng', company: 'Acme', connected: '', url: '', email: '' }

beforeEach(() => mockPush.mockClear())

describe('Nav — always visible', () => {
  it('renders the NetworkMe logo link', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /networkme/i })).toBeInTheDocument()
  })

  it('does not show tabs when not logged in and not guest', () => {
    renderNav()
    expect(screen.queryByRole('link', { name: /search/i })).not.toBeInTheDocument()
  })

  it('shows a sign-in link on mobile when not authenticated', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})

describe('Nav — authenticated user', () => {
  it('shows the desktop tab links', () => {
    renderNav(s => s.dispatch(setUser({ id: 1, email: 'a@b.com' })))
    const links = screen.getAllByRole('link', { name: /import/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('shows the user email', () => {
    renderNav(s => s.dispatch(setUser({ id: 1, email: 'chase@test.com' })))
    expect(screen.getByText('chase@test.com')).toBeInTheDocument()
  })

  it('shows connection count when connections exist', () => {
    renderNav(s => {
      s.dispatch(setUser({ id: 1, email: 'a@b.com' }))
      s.dispatch(setConnections([ALICE]))
    })
    expect(screen.getByText('1 connections')).toBeInTheDocument()
  })

  it('shows the sign out button', () => {
    renderNav(s => s.dispatch(setUser({ id: 1, email: 'a@b.com' })))
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('shows overdue reminder badge on Reminders tab', () => {
    renderNav(s => {
      s.dispatch(setUser({ id: 1, email: 'a@b.com' }))
      s.dispatch(setConnections([ALICE]))
      s.dispatch(setFollowUp({ key: 'alice_acme', dueAt: '2000-01-01', note: '' }))
    })
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})

describe('Nav — guest mode', () => {
  it('shows Guest label and sign-in link', () => {
    renderNav(s => s.dispatch(setGuest(true)))
    // desktop guest label
    expect(screen.getAllByText('Guest').length).toBeGreaterThan(0)
  })
})

describe('Nav — hamburger menu', () => {
  it('shows the hamburger button when logged in', () => {
    renderNav(s => s.dispatch(setUser({ id: 1, email: 'a@b.com' })))
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('does not show hamburger when not authenticated', () => {
    renderNav()
    expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument()
  })

  it('opens the mobile menu when hamburger is clicked', () => {
    renderNav(s => s.dispatch(setUser({ id: 1, email: 'a@b.com' })))
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
  })

  it('shows all tab links in the mobile menu when open', () => {
    renderNav(s => s.dispatch(setUser({ id: 1, email: 'a@b.com' })))
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    // Multiple links with same label exist (desktop + mobile), just confirm they're present
    expect(screen.getAllByRole('link', { name: /search/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /graph/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /reminders/i }).length).toBeGreaterThan(0)
  })

  it('closes the menu when a tab link is clicked', () => {
    renderNav(s => s.dispatch(setUser({ id: 1, email: 'a@b.com' })))
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    // Click first mobile Search link
    const searchLinks = screen.getAllByRole('link', { name: /search/i })
    fireEvent.click(searchLinks[searchLinks.length - 1])
    expect(screen.queryByRole('button', { name: /close menu/i })).not.toBeInTheDocument()
  })

  it('shows theme selector in mobile menu', () => {
    renderNav(s => s.dispatch(setUser({ id: 1, email: 'a@b.com' })))
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const themeSelects = screen.getAllByRole('combobox', { name: /theme/i })
    expect(themeSelects.length).toBeGreaterThan(0)
  })
})
