import { describe, it, expect } from 'vitest'
import { sameCompanyPairs } from '@/lib/autoColleague'
import type { Connection } from '@/lib/types'
import { personKey, canonPair } from '@/lib/data'

const mkConn = (name: string, company: string): Connection => ({
  name, company, title: '', connected: '2023-01-01', url: '', email: '',
})

const ALEX   = mkConn('Alex Rivera',  'Acme Corp')
const JORDAN = mkConn('Jordan Lee',   'Acme Corp')
const MORGAN = mkConn('Morgan Chen',  'Creative Studio')
const TAYLOR = mkConn('Taylor Kim',   'Acme Corp')
const NO_CO  = mkConn('No Company',   '')
const BLANK  = mkConn('Blank Co',     '   ')

describe('sameCompanyPairs', () => {
  it('returns one pair when two connections share the same company', () => {
    const pairs = sameCompanyPairs([ALEX, JORDAN, MORGAN])
    expect(pairs).toHaveLength(1)
    const [ca, cb] = canonPair(personKey(ALEX), personKey(JORDAN))
    expect(pairs[0].a).toBe(ca)
    expect(pairs[0].b).toBe(cb)
    expect(pairs[0].typeId).toBe('colleague')
  })

  it('returns all C(n,2) pairs for n connections at the same company', () => {
    const pairs = sameCompanyPairs([ALEX, JORDAN, TAYLOR, MORGAN])
    // ALEX, JORDAN, TAYLOR all at Acme → 3 pairs
    expect(pairs).toHaveLength(3)
  })

  it('does not include pairs from different companies', () => {
    const pairs = sameCompanyPairs([ALEX, MORGAN])
    expect(pairs).toHaveLength(0)
  })

  it('returns empty array when fewer than 2 connections share a company', () => {
    expect(sameCompanyPairs([ALEX])).toHaveLength(0)
    expect(sameCompanyPairs([])).toHaveLength(0)
  })

  it('does not create pairs for connections with an empty company', () => {
    const pairs = sameCompanyPairs([NO_CO, BLANK, ALEX])
    expect(pairs).toHaveLength(0)
  })

  it('does not create pairs for connections with a blank (whitespace) company', () => {
    const pairs = sameCompanyPairs([BLANK, mkConn('Other Blank', '   ')])
    expect(pairs).toHaveLength(0)
  })

  it('pairs use canonical (alphabetically sorted) key order', () => {
    const pairs = sameCompanyPairs([ALEX, JORDAN])
    const [ca, cb] = canonPair(personKey(ALEX), personKey(JORDAN))
    expect(pairs[0].a).toBe(ca)
    expect(pairs[0].b).toBe(cb)
  })

  it('every returned pair has typeId "colleague"', () => {
    const pairs = sameCompanyPairs([ALEX, JORDAN, TAYLOR])
    expect(pairs.every((p) => p.typeId === 'colleague')).toBe(true)
  })

  it('does not produce duplicate pairs', () => {
    const pairs = sameCompanyPairs([ALEX, JORDAN, ALEX, JORDAN])
    // Even with duplicates in the input, each pair appears once
    const keys = pairs.map((p) => `${p.a}|${p.b}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
