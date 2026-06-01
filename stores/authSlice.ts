import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/lib/types'
import type { RootState } from './index'

interface AuthState {
  user: AuthUser | null
  token: string | null
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  error: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
    },
    setToken(state, action: PayloadAction<string | null>) {
      state.token = action.payload
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
    signOut(state) {
      state.user = null
      state.token = null
      state.error = null
    },
  },
})

export const { setUser, setToken, setAuthError, signOut } = authSlice.actions

export const selectAuthUser = (s: RootState) => s.auth.user
export const selectAuthToken = (s: RootState) => s.auth.token
export const selectAuthError = (s: RootState) => s.auth.error
