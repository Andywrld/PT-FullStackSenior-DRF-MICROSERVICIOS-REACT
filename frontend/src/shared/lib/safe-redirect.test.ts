import { describe, expect, it } from 'vitest'

import { safeRedirect } from './safe-redirect'

describe('safeRedirect', () => {
  it('keeps same-app paths', () => {
    expect(safeRedirect('/productos?category=1', '/')).toBe('/productos?category=1')
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '', null])(
    'falls back for %s',
    (target) => {
      expect(safeRedirect(target, '/productos')).toBe('/productos')
    },
  )
})
