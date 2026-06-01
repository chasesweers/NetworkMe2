import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  onboardingComplete: boolean
}

const initialState: UIState = {
  theme: 'system',
  onboardingComplete: false,
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
  },
})

export const { setTheme, completeOnboarding } = uiSlice.actions

export const selectTheme = (s: RootState) => s.ui.theme
export const selectOnboardingComplete = (s: RootState) => s.ui.onboardingComplete
