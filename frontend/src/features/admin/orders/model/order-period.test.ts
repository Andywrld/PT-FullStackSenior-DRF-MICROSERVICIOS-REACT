import { describe, expect, it } from 'vitest'

import { periodStart } from './order-period'

describe('periodStart', () => {
  const now = new Date(2026, 8, 29, 15, 30) // 29 Sep 2026, 15:30 local time

  it('starts "today" at local midnight', () => {
    expect(periodStart('today', now)).toEqual(new Date(2026, 8, 29, 0, 0))
  })

  it('counts rolling days back from now', () => {
    expect(periodStart('7d', now)).toEqual(new Date(2026, 8, 22, 15, 30))
    expect(periodStart('30d', now)).toEqual(new Date(2026, 7, 30, 15, 30))
  })
})
