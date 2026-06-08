import { describe, it, expect, vi, afterEach } from 'vitest'

// Each test uses a unique IP so the module-level Map doesn't bleed between tests.
// Fake timers are used for the window-expiry test.

import { checkRateLimit } from '@/lib/rateLimit'

afterEach(() => {
  vi.useRealTimers()
})

describe('checkRateLimit', () => {
  it('allows the first request', () => {
    const { limited } = checkRateLimit('1.1.1.1')
    expect(limited).toBe(false)
  })

  it('allows up to MAX_ATTEMPTS (5) requests', () => {
    const ip = '2.2.2.2'
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip).limited).toBe(false)
    }
  })

  it('blocks the request after MAX_ATTEMPTS are exhausted', () => {
    const ip = '3.3.3.3'
    for (let i = 0; i < 5; i++) checkRateLimit(ip)
    const { limited, retryAfterSecs } = checkRateLimit(ip)
    expect(limited).toBe(true)
    expect(retryAfterSecs).toBeGreaterThan(0)
  })

  it('retryAfterSecs is at most the window size (15 min)', () => {
    const ip = '4.4.4.4'
    for (let i = 0; i < 6; i++) checkRateLimit(ip)
    const { retryAfterSecs } = checkRateLimit(ip)
    expect(retryAfterSecs).toBeLessThanOrEqual(15 * 60)
  })

  it('resets after the window expires', () => {
    vi.useFakeTimers()
    const ip = '5.5.5.5'
    for (let i = 0; i < 6; i++) checkRateLimit(ip)
    expect(checkRateLimit(ip).limited).toBe(true)

    // Advance past the 15-minute window
    vi.advanceTimersByTime(15 * 60 * 1000 + 1)

    expect(checkRateLimit(ip).limited).toBe(false)
  })

  it('different IPs have independent counters', () => {
    const ipA = '6.6.6.6'
    const ipB = '7.7.7.7'
    for (let i = 0; i < 6; i++) checkRateLimit(ipA)
    expect(checkRateLimit(ipA).limited).toBe(true)
    expect(checkRateLimit(ipB).limited).toBe(false)
  })
})
