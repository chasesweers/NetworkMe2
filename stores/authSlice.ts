import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/lib/types'
import type { RootState } from './index'

interface AuthState {
  user: AuthUser | null
  token: string | null
  error: string | null
  isAdmin: boolean
}

const initialState: AuthState = {
  user: null,
  token: null,
  error: null,
  isAdmin: false,
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
    setIsAdmin(state, action: PayloadAction<boolean>) {
      state.isAdmin = action.payload
    },
    signOut(state) {
      state.user = null
      state.token = null
      state.error = null
      state.isAdmin = false
    },
  },
})

export const { setUser, setToken, setAuthError, setIsAdmin, signOut } = authSlice.actions

export const selectAuthUser = (s: RootState) => s.auth.user
export const selectAuthToken = (s: RootState) => s.auth.token
export const selectAuthError = (s: RootState) => s.auth.error
export const selectIsAdmin = (s: RootState) => s.auth.isAdmin
