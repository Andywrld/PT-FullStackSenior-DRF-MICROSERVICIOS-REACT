import { describe, expect, it } from 'vitest'

import { registerFormSchema } from './auth'

const valid = { full_name: 'Ana', email: 'ana@example.com', password: 'clave-segura-1', confirm_password: 'clave-segura-1' }

describe('registerFormSchema', () => {
  it('rejects passwords that do not match, on the confirmation field', () => {
    const result = registerFormSchema.safeParse({ ...valid, confirm_password: 'otra-clave-1' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]).toMatchObject({ path: ['confirm_password'], message: 'Las contraseñas no coinciden.' })
  })

  it('rejects numeric-only passwords like the server does', () => {
    const result = registerFormSchema.safeParse({ ...valid, password: '12345678', confirm_password: '12345678' })

    expect(result.success).toBe(false)
  })
})
