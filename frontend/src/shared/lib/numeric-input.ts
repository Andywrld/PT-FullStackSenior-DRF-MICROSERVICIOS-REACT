export function sanitizeInteger(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Digits and a single decimal separator (a comma counts as one), up to `decimals` places. */
export function sanitizeDecimal(raw: string, decimals = 2): string {
  const [whole, ...fraction] = raw.replace(/,/g, '.').replace(/[^\d.]/g, '').split('.')
  if (fraction.length === 0) return whole
  return `${whole || '0'}.${fraction.join('').slice(0, decimals)}`
}
