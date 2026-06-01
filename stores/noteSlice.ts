import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'

interface NoteState {
  notes: Record<string, string>
}

const initialState: NoteState = { notes: {} }

export const noteSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setNote(state, action: PayloadAction<{ key: string; text: string }>) {
      state.notes[action.payload.key] = action.payload.text
    },
    deleteNote(state, action: PayloadAction<string>) {
      delete state.notes[action.payload]
    },
  },
})

export const { setNote, deleteNote } = noteSlice.actions

export const selectNote = (key: string) => (s: RootState) => s.notes.notes[key] ?? ''
export const selectNotes = (s: RootState) => s.notes.notes
