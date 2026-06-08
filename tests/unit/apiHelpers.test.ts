import { describe, it, expect, vi } from 'vitest'
import { serverError } from '@/lib/apiHelpers'

describe('serverError', () => {
  it('returns a 500 JSON response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = serverError(new Error('boom'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Internal server error' })
  })

  it('logs the error to console', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('oops')
    serverError(err)
    expect(spy).toHaveBeenCalledWith('[api]', err)
  })
})
