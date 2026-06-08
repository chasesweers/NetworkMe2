import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice, setConnections, toggleFavorite } from '@/stores/connectionSlice'
import { relationshipSlice } from '@/stores/relationshipSlice'
import { noteSlice } from '@/stores/noteSlice'
import { followUpSlice } from '@/stores/followUpSlice'
import { authSlice } from '@/stores/authSlice'
import { uiSlice } from '@/stores/uiSlice'
import { ProfileView } from '@/components/profile/ProfileView'
import type { Connection } from '@/lib/types'
import { personKey } from '@/lib/data'

const ALEX: Connection = {
  name: 'Alex Rivera', title: 'Engineer', company: 'Acme Corp',
  connected: '2023-01-15', url: '', email: '',
}
const KEY = personKey(ALEX)

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

function renderProfile(store: ReturnType<typeof makeStore>) {
  return render(
    <Provider store={store}>
      <ProfileView personKey={KEY} />
    </Provider>
  )
}

describe('ProfileView — favorite toggle', () => {
  it('shows "Add to favorites" button when connection is not a favorite', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX]))
    renderProfile(store)
    expect(screen.getByRole('button', { name: /add to favorites/i })).toBeInTheDocument()
  })

  it('shows "Remove from favorites" button when connection is already a favorite', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX]))
    store.dispatch(toggleFavorite(KEY))
    renderProfile(store)
    expect(screen.getByRole('button', { name: /remove from favorites/i })).toBeInTheDocument()
  })

  it('dispatches toggleFavorite and updates label when star is clicked (not fav → fav)', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX]))
    renderProfile(store)

    fireEvent.click(screen.getByRole('button', { name: /add to favorites/i }))

    expect(store.getState().connections.favorites).toContain(KEY)
    expect(screen.getByRole('button', { name: /remove from favorites/i })).toBeInTheDocument()
  })

  it('dispatches toggleFavorite and updates label when star is clicked (fav → not fav)', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX]))
    store.dispatch(toggleFavorite(KEY))
    renderProfile(store)

    fireEvent.click(screen.getByRole('button', { name: /remove from favorites/i }))

    expect(store.getState().connections.favorites).not.toContain(KEY)
    expect(screen.getByRole('button', { name: /add to favorites/i })).toBeInTheDocument()
  })
})
