import { describe, it, expect } from 'vitest'
import { shouldResetLayout } from '@/lib/graphData'

describe('shouldResetLayout', () => {
  it('returns true when a new relationship is added (count increases)', () => {
    expect(shouldResetLayout(2, 3)).toBe(true)
    expect(shouldResetLayout(0, 1)).toBe(true)
  })

  it('returns false when relationship count is unchanged', () => {
    expect(shouldResetLayout(3, 3)).toBe(false)
    expect(shouldResetLayout(0, 0)).toBe(false)
  })

  it('returns false when a relationship is removed (count decreases)', () => {
    expect(shouldResetLayout(3, 2)).toBe(false)
    expect(shouldResetLayout(1, 0)).toBe(false)
  })
})
