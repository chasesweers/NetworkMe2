import { describe, it, expect } from 'vitest'
import { decodeTokenPayload } from '@/lib/jwt-edge'

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.fakesig`
}

describe('decodeTokenPayload', () => {
  it('decodes a valid JWT and returns userId, email, isAdmin', () => {
    const token = makeToken({ userId: 42, email: 'a@b.com', isAdmin: true })
    expect(decodeTokenPayload(token)).toEqual({ userId: 42, email: 'a@b.com', isAdmin: true })
  })

  it('returns isAdmin: false when payload has isAdmin: false', () => {
    const token = makeToken({ userId: 1, email: 'x@y.com', isAdmin: false })
    expect(decodeTokenPayload(token)?.isAdmin).toBe(false)
  })

  it('returns isAdmin: false when isAdmin field is absent', () => {
    const token = makeToken({ userId: 1, email: 'x@y.com' })
    expect(decodeTokenPayload(token)?.isAdmin).toBe(false)
  })

  it('returns undefined for userId when field is missing', () => {
    const token = makeToken({ email: 'x@y.com' })
    expect(decodeTokenPayload(token)?.userId).toBeUndefined()
  })

  it('returns undefined for userId when field is not a number', () => {
    const token = makeToken({ userId: 'notanumber', email: 'x@y.com' })
    expect(decodeTokenPayload(token)?.userId).toBeUndefined()
  })

  it('returns undefined for email when field is not a string', () => {
    const token = makeToken({ userId: 1, email: 99 })
    expect(decodeTokenPayload(token)?.email).toBeUndefined()
  })

  it('returns null for a string with fewer than 3 parts', () => {
    expect(decodeTokenPayload('header.body')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(decodeTokenPayload('')).toBeNull()
  })

  it('returns null for a malformed base64 payload', () => {
    expect(decodeTokenPayload('hdr.!!!.sig')).toBeNull()
  })

  it('returns null for a payload that is valid base64 but not JSON', () => {
    const notJson = btoa('not-json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    expect(decodeTokenPayload(`hdr.${notJson}.sig`)).toBeNull()
  })
})
