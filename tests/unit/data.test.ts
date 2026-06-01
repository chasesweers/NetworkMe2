import { describe, it, expect } from 'vitest'
import {
  personKey,
  noteKey,
  canonPair,
  formatDate,
  getYear,
  initials,
  avatarHue,
  splitCSVLine,
  parseCSV,
} from '@/lib/data'

describe('personKey', () => {
  it('produces a lowercase underscore-safe key', () => {
    expect(personKey({ name: 'Alex Rivera', company: 'Acme Corp' })).toBe('alex_rivera__acme_corp')
  })

  it('is deterministic', () => {
    const c = { name: 'Jordan Lee', company: 'Startup Inc' }
    expect(personKey(c)).toBe(personKey(c))
  })

  it('handles special characters', () => {
    const key = personKey({ name: "O'Brien", company: 'AT&T' })
    expect(key).toMatch(/^[a-z0-9_]+$/)
  })
})

describe('noteKey', () => {
  it('returns a key prefixed with note__', () => {
    expect(noteKey({ name: 'Alex Rivera', company: 'Acme Corp' })).toBe('note__alex_rivera__acme_corp')
  })
})

describe('canonPair', () => {
  it('returns alphabetical order', () => {
    expect(canonPair('zebra', 'apple')).toEqual(['apple', 'zebra'])
  })

  it('is stable when already in order', () => {
    expect(canonPair('alpha', 'beta')).toEqual(['alpha', 'beta'])
  })

  it('is idempotent regardless of input order', () => {
    expect(canonPair('b', 'a')).toEqual(canonPair('a', 'b'))
  })
})

describe('formatDate', () => {
  it('formats an ISO date', () => {
    expect(formatDate('2023-01-15')).toMatch(/Jan(uary)? 15,? 2023/)
  })

  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })

  it('returns the original string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('getYear', () => {
  it('extracts the year from an ISO date', () => {
    expect(getYear('2022-07-04')).toBe('2022')
  })

  it('returns empty string for empty input', () => {
    expect(getYear('')).toBe('')
  })
})

describe('initials', () => {
  it('returns up to two initials', () => {
    expect(initials('Alex Rivera')).toBe('AR')
  })

  it('handles single name', () => {
    expect(initials('Madonna')).toBe('M')
  })

  it('caps at two letters even for long names', () => {
    expect(initials('John Paul George Ringo')).toBe('JP')
  })
})

describe('avatarHue', () => {
  it('returns a number between 0 and 359', () => {
    const h = avatarHue('test')
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(360)
  })

  it('is deterministic', () => {
    expect(avatarHue('hello')).toBe(avatarHue('hello'))
  })

  it('returns different hues for different inputs', () => {
    expect(avatarHue('Alex Rivera')).not.toBe(avatarHue('Jordan Lee'))
  })
})

describe('splitCSVLine', () => {
  it('splits a simple comma-separated line', () => {
    expect(splitCSVLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted fields with commas', () => {
    expect(splitCSVLine('"Smith, John",Engineer,Acme')).toEqual(['Smith, John', 'Engineer', 'Acme'])
  })

  it('handles escaped quotes inside quoted fields', () => {
    expect(splitCSVLine('"say ""hello""",world')).toEqual(['say "hello"', 'world'])
  })

  it('trims whitespace from fields', () => {
    expect(splitCSVLine('  a ,  b  ')).toEqual(['a', 'b'])
  })
})

describe('parseCSV', () => {
  const CSV = `First Name,Last Name,Position,Company,Connected On,Email Address,URL
Alex,Rivera,Engineer,Acme Corp,15 Jan 2023,alex@example.com,https://linkedin.com/in/alex`

  it('parses a valid CSV into Connection objects', () => {
    const result = parseCSV(CSV)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alex Rivera')
    expect(result[0].title).toBe('Engineer')
    expect(result[0].company).toBe('Acme Corp')
  })

  it('returns empty array for empty input', () => {
    expect(parseCSV('')).toEqual([])
  })

  it('skips rows with no name', () => {
    const csv = `First Name,Last Name,Company\n,,Acme\nJordan,Lee,Startup`
    expect(parseCSV(csv)).toHaveLength(1)
  })
})
