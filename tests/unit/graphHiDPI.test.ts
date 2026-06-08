import { describe, it, expect } from 'vitest'
import { scaledCanvasSize } from '@/lib/graphData'

describe('scaledCanvasSize', () => {
  it('multiplies CSS dimensions by dpr on a 2× display', () => {
    expect(scaledCanvasSize(800, 600, 2)).toEqual({ bufW: 1600, bufH: 1200 })
  })

  it('returns CSS dimensions unchanged on a 1× display', () => {
    expect(scaledCanvasSize(800, 600, 1)).toEqual({ bufW: 800, bufH: 600 })
  })

  it('clamps dpr to 1 when given 0 or a negative value', () => {
    expect(scaledCanvasSize(800, 600, 0)).toEqual({ bufW: 800, bufH: 600 })
    expect(scaledCanvasSize(800, 600, -1)).toEqual({ bufW: 800, bufH: 600 })
  })

  it('handles fractional dpr values (e.g. 1.5×)', () => {
    expect(scaledCanvasSize(800, 600, 1.5)).toEqual({ bufW: 1200, bufH: 900 })
  })
})
