import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  onboardingComplete: boolean
  isGuest: boolean
}

const initialState: UIState = {
  theme: 'system',
  onboardingComplete: false,
  isGuest: false,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
    completeOnboarding(state) {
      state.onboardingComplete = true
    },
    setGuest(state, action: PayloadAction<boolean>) {
      state.isGuest = action.payload
    },
  },
})

export const { setTheme, completeOnboarding, setGuest } = uiSlice.actions

export const selectTheme = (s: RootState) => s.ui.theme
export const selectOnboardingComplete = (s: RootState) => s.ui.onboardingComplete
export const selectIsGuest = (s: RootState) => s.ui.isGuest
