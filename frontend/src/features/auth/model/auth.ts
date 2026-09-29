import { z } from 'zod'

export const roleSchema = z.enum(['user', 'admin', 'super_admin'])

export const userSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  full_name: z.string(),
  role: roleSchema,
  is_active: z.boolean(),
  date_joined: z.string(),
})

export const tokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
})

export const loginResponseSchema = tokenPairSchema.extend({ user: userSchema })

export type Role = z.infer<typeof roleSchema>
export type User = z.infer<typeof userSchema>
export type TokenPair = z.infer<typeof tokenPairSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>

export const loginFormSchema = z.object({
  email: z.email('Ingresa un email válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

// Mirrors the server's password validators; the server has the final word.
export const newPasswordSchema = z
  .string()
  .min(8, 'Debe tener al menos 8 caracteres.')
  .refine((value) => !/^\d+$/.test(value), 'No puede ser solo números.')

export const registerFormSchema = z
  .object({
    full_name: z.string().trim().max(150, 'Máximo 150 caracteres.'),
    email: z.email('Ingresa un email válido.'),
    password: newPasswordSchema,
    confirm_password: z.string(),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Las contraseñas no coinciden.',
  })

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
