import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'

export interface FollowUp {
  dueAt: string  // ISO date "YYYY-MM-DD"
  note: string
}

interface FollowUpState {
  followUps: Record<string, FollowUp>
}

const initialState: FollowUpState = { followUps: {} }

export const followUpSlice = createSlice({
  name: 'followUps',
  initialState,
  reducers: {
    setFollowUp(state, action: PayloadAction<{ key: string; dueAt: string; note: string }>) {
      state.followUps[action.payload.key] = { dueAt: action.payload.dueAt, note: action.payload.note }
    },
    clearFollowUp(state, action: PayloadAction<string>) {
      delete state.followUps[action.payload]
    },
  },
})

export const { setFollowUp, clearFollowUp } = followUpSlice.actions

export const selectFollowUps = (s: RootState) => s.followUps.followUps
export const selectFollowUp = (key: string) => (s: RootState) => s.followUps.followUps[key] ?? null
