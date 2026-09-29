import { describe, expect, it } from 'vitest'

import { orderingToSorting, sortingToOrdering } from './ordering'

describe('DRF ordering <-> table sorting', () => {
  it.each([
    ['price', [{ id: 'price', desc: false }]],
    ['-created_at', [{ id: 'created_at', desc: true }]],
    ['', []],
  ])('reads %j from the URL', (ordering, sorting) => {
    expect(orderingToSorting(ordering)).toEqual(sorting)
  })

  it('writes the first sorted column, or nothing when unsorted', () => {
    expect(sortingToOrdering([{ id: 'stock', desc: true }])).toBe('-stock')
    expect(sortingToOrdering([])).toBeNull()
  })
})
