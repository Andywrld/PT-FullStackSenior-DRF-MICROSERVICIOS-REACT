export const ORDER_PERIODS = ['today', '7d', '30d'] as const
export type OrderPeriod = (typeof ORDER_PERIODS)[number]

export const ORDER_PERIOD_OPTIONS: { value: OrderPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
]

const ROLLING_DAYS: Record<Exclude<OrderPeriod, 'today'>, number> = { '7d': 7, '30d': 30 }

export function periodStart(period: OrderPeriod, now: Date): Date {
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(now)
  start.setDate(start.getDate() - ROLLING_DAYS[period])
  return start
}
