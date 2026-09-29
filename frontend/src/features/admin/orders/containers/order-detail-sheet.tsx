import { MailIcon } from 'lucide-react'

import { OrderLines } from '@/features/orders/components/order-lines'
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge'
import { OrderSummary } from '@/features/orders/components/order-summary'
import { type Order, orderNumber } from '@/features/orders/model/order'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

type OrderDetailSheetProps = {
  open: boolean
  order: Order | null
  onOpenChange: (open: boolean) => void
}

export function OrderDetailSheet({ open, order, onOpenChange }: OrderDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(32rem,100vw)] gap-0 p-0 sm:max-w-lg">
        {order && (
          <>
            <SheetHeader className="gap-2 border-b px-6 py-5">
              <div className="flex items-center gap-3">
                <SheetTitle className="font-heading text-2xl font-normal">
                  Orden <span className="tabular-nums">#{orderNumber(order.id)}</span>
                </SheetTitle>
                <OrderStatusBadge status={order.status} />
              </div>
              <SheetDescription className="flex items-center gap-2">
                <MailIcon className="size-4" aria-hidden />
                <a href={`mailto:${order.customer_email}`} className="truncate hover:underline">
                  {order.customer_email}
                </a>
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <OrderLines items={order.items} />
            </div>
            <div className="border-t bg-surface px-6 py-5">
              <OrderSummary order={order} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
