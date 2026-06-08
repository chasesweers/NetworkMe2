import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { uiSlice, setTheme } from '@/stores/uiSlice'
import { ThemeProvider } from '@/components/ThemeProvider'

function makeStore() {
  return configureStore({ reducer: { ui: uiSlice.reducer } })
}

function renderWithTheme(theme: 'dark' | 'light' | 'system') {
  const store = makeStore()
  store.dispatch(setTheme(theme))
  render(
    <Provider store={store}>
      <ThemeProvider><div /></ThemeProvider>
    </Provider>
  )
}

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  // Default matchMedia stub — reports light preference
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  })
})

describe('ThemeProvider', () => {
  it('adds the "dark" class when theme is dark', () => {
    renderWithTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes the "dark" class when theme is light', () => {
    document.documentElement.classList.add('dark')
    renderWithTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('applies dark class based on system preference when theme is system and prefers-dark', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    renderWithTheme('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('does not add dark class when system preference is light', () => {
    renderWithTheme('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('renders children', () => {
    const store = makeStore()
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider><span>hello</span></ThemeProvider>
      </Provider>
    )
    expect(getByText('hello')).toBeInTheDocument()
  })
})
