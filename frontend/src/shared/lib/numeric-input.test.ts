import { describe, expect, it } from 'vitest'

import { sanitizeDecimal, sanitizeInteger } from './numeric-input'

describe('numeric inputs', () => {
  it.each([
    ['12a3', '123'],
    ['-5', '5'],
    ['abc', ''],
  ])('keeps only digits in an integer: %j -> %j', (raw, clean) => {
    expect(sanitizeInteger(raw)).toBe(clean)
  })

  it.each([
    ['19.99', '19.99'],
    ['19,9', '19.9'],
    ['1a2.5b', '12.5'],
    ['1.2.3', '1.23'],
    ['0.999', '0.99'],
    ['.5', '0.5'],
    ['$', ''],
  ])('keeps a money amount with up to 2 decimals: %j -> %j', (raw, clean) => {
    expect(sanitizeDecimal(raw)).toBe(clean)
  })
})
