import { CircleCheckIcon } from 'lucide-react'

import { orderNumber } from '../model/order'

export function OrderPlacedBanner({ orderId }: { orderId: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-4 rounded-2xl border border-success/30 bg-success/10 p-5 animate-in duration-(--duration-base) fade-in slide-in-from-top-2"
    >
      <CircleCheckIcon className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-medium">¡Tu orden fue generada!</p>
        <p className="text-sm text-muted-foreground">
          Número de orden <span className="font-medium text-foreground tabular-nums">#{orderNumber(orderId)}</span>. La
          encuentras cuando quieras en Mis órdenes.
        </p>
        <p className="text-xs break-all text-muted-foreground">
          ID: <span className="font-mono">{orderId}</span>
        </p>
      </div>
    </div>
  )
}
