import { type FormEvent, useState } from 'react'

import { formatMoney } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

import type { PriceRange } from '../filters/catalog-filters'

const PRESETS: { label: string; range: PriceRange }[] = [
  { label: `Hasta ${formatMoney('10')}`, range: { min: null, max: 10 } },
  { label: `${formatMoney('10')} – ${formatMoney('50')}`, range: { min: 10, max: 50 } },
  { label: `${formatMoney('50')} – ${formatMoney('200')}`, range: { min: 50, max: 200 } },
  { label: `Más de ${formatMoney('200')}`, range: { min: 200, max: null } },
]

type PriceRangeFilterProps = {
  value: PriceRange
  onChange: (range: PriceRange) => void
}

function parseAmount(raw: string): number | null {
  const amount = Number.parseFloat(raw)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

/** Inputs are local drafts until applied: remount with a `key` derived from `value` to reset them. */
export function PriceRangeFilter({ value, onChange }: PriceRangeFilterProps) {
  const [min, setMin] = useState(value.min?.toString() ?? '')
  const [max, setMax] = useState(value.max?.toString() ?? '')

  function apply(event: FormEvent) {
    event.preventDefault()
    let range = { min: parseAmount(min), max: parseAmount(max) }
    // A reversed range is almost always a typo: swap it instead of showing nothing.
    if (range.min !== null && range.max !== null && range.min > range.max) {
      range = { min: range.max, max: range.min }
    }
    onChange(range)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(({ label, range }) => {
          const active = value.min === range.min && value.max === range.max
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? { min: null, max: null } : range)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors hover:border-input hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                active && 'border-transparent bg-accent font-medium text-accent-foreground hover:bg-accent',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      <form onSubmit={apply} className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
          Mínimo
          <Input inputMode="decimal" value={min} onChange={(event) => setMin(event.target.value)} placeholder="0" />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
          Máximo
          <Input inputMode="decimal" value={max} onChange={(event) => setMax(event.target.value)} placeholder="Sin límite" />
        </label>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>
    </div>
  )
}
