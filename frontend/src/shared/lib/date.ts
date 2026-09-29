import { env } from '@/shared/config/env'

const dateFormatter = new Intl.DateTimeFormat(env.locale, { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat(env.locale, { dateStyle: 'medium', timeStyle: 'short' })

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate))
}

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}
