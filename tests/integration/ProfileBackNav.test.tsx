import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { connectionSlice, setConnections } from '@/stores/connectionSlice'
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

function renderProfile(store: ReturnType<typeof makeStore>, from?: string) {
  return render(
    <Provider store={store}>
      <ProfileView personKey={KEY} from={from} />
    </Provider>
  )
}

describe('ProfileView — back navigation', () => {
  it('back link points to /search when no from prop is given', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX]))
    renderProfile(store)
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/search')
  })

  it('back link points to /graph when from="/graph"', () => {
    const store = makeStore()
    store.dispatch(setConnections([ALEX]))
    renderProfile(store, '/graph')
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/graph')
  })
})
