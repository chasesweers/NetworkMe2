import { describe, it, expect, beforeEach } from 'vitest'
import { loadPersistedState, saveState, store } from '@/stores/index'
import { setUser, signOut } from '@/stores/authSlice'

const PERSIST_KEY = 'nm_redux'

beforeEach(() => {
  localStorage.clear()
})

describe('loadPersistedState', () => {
  it('returns {} when localStorage has no entry', () => {
    expect(loadPersistedState()).toEqual({})
  })

  it('returns {} when the stored value is invalid JSON', () => {
    localStorage.setItem(PERSIST_KEY, 'not-json{{{')
    expect(loadPersistedState()).toEqual({})
  })

  it('returns the parsed object when valid JSON is stored', () => {
    const data = { ui: { theme: 'dark' } }
    localStorage.setItem(PERSIST_KEY, JSON.stringify(data))
    expect(loadPersistedState()).toEqual(data)
  })
})

describe('saveState', () => {
  it('always persists the ui slice', () => {
    saveState(store.getState())
    const saved = JSON.parse(localStorage.getItem(PERSIST_KEY)!)
    expect(saved).toHaveProperty('ui')
  })

  it('persists data slices when not authenticated (no nm_token)', () => {
    localStorage.removeItem('nm_token')
    saveState(store.getState())
    const saved = JSON.parse(localStorage.getItem(PERSIST_KEY)!)
    expect(saved).toHaveProperty('connections')
    expect(saved).toHaveProperty('relationships')
    expect(saved).toHaveProperty('notes')
    expect(saved).toHaveProperty('followUps')
  })

  it('omits data slices when authenticated (nm_token present)', () => {
    // Real authenticated state: both token AND user present in store
    store.dispatch(setUser({ id: 1, email: 'test@example.com' }))
    localStorage.setItem('nm_token', 'tok-abc')
    saveState(store.getState())
    const saved = JSON.parse(localStorage.getItem(PERSIST_KEY)!)
    expect(saved).not.toHaveProperty('connections')
    expect(saved).not.toHaveProperty('relationships')
    expect(saved).not.toHaveProperty('notes')
    expect(saved).not.toHaveProperty('followUps')
    store.dispatch(signOut())
  })

  it('clears nm_token when there is no logged-in user', () => {
    localStorage.setItem('nm_token', 'stale-tok')
    // store has no user by default
    saveState(store.getState())
    expect(localStorage.getItem('nm_token')).toBeNull()
  })
})
