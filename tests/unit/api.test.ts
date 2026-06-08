import { describe, it, expect, beforeEach, vi } from 'vitest'

// getToken/setToken/clearToken use localStorage directly — no module tricks needed.
// The `api.*` methods use a module-level BASE const; we test the "no BASE" error path
// naturally (NEXT_PUBLIC_API_BASE is undefined in the test env).

import { getToken, setToken, clearToken, api } from '@/lib/api'

beforeEach(() => {
  localStorage.clear()
})

describe('getToken', () => {
  it('returns null when nothing is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('returns the stored token', () => {
    localStorage.setItem('nm_token', 'abc123')
    expect(getToken()).toBe('abc123')
  })
})

describe('setToken', () => {
  it('writes the token to localStorage', () => {
    setToken('tok-xyz')
    expect(localStorage.getItem('nm_token')).toBe('tok-xyz')
  })
})

describe('clearToken', () => {
  it('removes the token from localStorage', () => {
    localStorage.setItem('nm_token', 'tok-xyz')
    clearToken()
    expect(localStorage.getItem('nm_token')).toBeNull()
  })
})

describe('api — no BASE configured', () => {
  it('api.get throws "API base not configured"', async () => {
    await expect(api.get('/test')).rejects.toThrow('API base not configured')
  })

  it('api.post throws "API base not configured"', async () => {
    await expect(api.post('/test', {})).rejects.toThrow('API base not configured')
  })

  it('api.put throws "API base not configured"', async () => {
    await expect(api.put('/test', {})).rejects.toThrow('API base not configured')
  })

  it('api.delete throws "API base not configured"', async () => {
    await expect(api.delete('/test')).rejects.toThrow('API base not configured')
  })
})
