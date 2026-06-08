import { describe, it, expect, beforeEach } from 'vitest'
import { vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { uiSlice } from '@/stores/uiSlice'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

function makeStore() {
  return configureStore({ reducer: { ui: uiSlice.reducer } })
}

function renderWizard() {
  const store = makeStore()
  render(<Provider store={store}><OnboardingWizard /></Provider>)
  return store
}

beforeEach(() => mockPush.mockClear())

describe('OnboardingWizard', () => {
  it('renders the first step title', () => {
    renderWizard()
    expect(screen.getByText('Welcome to NetworkMe')).toBeInTheDocument()
  })

  it('shows a "Next" button on the first step', () => {
    renderWizard()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('advances to the next step when Next is clicked', () => {
    renderWizard()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Your data, your control')).toBeInTheDocument()
  })

  it('shows a Skip button on non-final steps', () => {
    renderWizard()
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  it('skip dispatches completeOnboarding and navigates to /import', () => {
    const store = renderWizard()
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(store.getState().ui.onboardingComplete).toBe(true)
    expect(mockPush).toHaveBeenCalledWith('/import')
  })

  it('shows "Get started" on the last step and no Skip button', () => {
    renderWizard()
    // Advance through all steps
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
    }
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
  })

  it('completing the last step dispatches completeOnboarding and navigates to /import', () => {
    const store = renderWizard()
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
    }
    fireEvent.click(screen.getByRole('button', { name: /get started/i }))
    expect(store.getState().ui.onboardingComplete).toBe(true)
    expect(mockPush).toHaveBeenCalledWith('/import')
  })
})
