import { env } from '@/shared/config/env'

const formatter = new Intl.NumberFormat(env.locale, { style: 'currency', currency: env.currency })

export function formatMoney(amount: string): string {
  return formatter.format(Number(amount))
}
