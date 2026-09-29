import { z } from 'zod'

const envSchema = z.object({
  // Same origin as the app: the gateway serves both the SPA and the API.
  VITE_API_BASE_URL: z.string().default('/api/v1'),
  VITE_CURRENCY: z.string().length(3).default('USD'),
  VITE_LOCALE: z.string().default('es-US'),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  apiBaseUrl: parsed.VITE_API_BASE_URL.replace(/\/$/, ''),
  currency: parsed.VITE_CURRENCY,
  locale: parsed.VITE_LOCALE,
} as const
