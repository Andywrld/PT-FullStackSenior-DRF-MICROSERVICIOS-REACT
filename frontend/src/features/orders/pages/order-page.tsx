import { ArrowLeftIcon } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'

import { isApiError } from '@/shared/api/api-error'
import { getErrorMessage } from '@/shared/api/error-messages'
import { paths } from '@/shared/config/routes'
import { buttonVariants } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { OrderLines } from '../components/order-lines'
import { OrderPlacedBanner } from '../components/order-placed-banner'
import { OrderStatusBadge } from '../components/order-status-badge'
import { OrderSummary } from '../components/order-summary'
import { useOrder } from '../hooks/use-orders'
import { orderNumber, type OrderPageState } from '../model/order'

export function OrderPage() {
  const { orderId = '' } = useParams()
  const { state } = useLocation() as { state: OrderPageState | null }
  const order = useOrder(orderId)

  const backToOrders = (
    <Link to={paths.orders} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-4" />
      Mis órdenes
    </Link>
  )

  if (order.isPending) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true" aria-label="Cargando orden">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    )
  }
  if (order.isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p role="alert" className="text-destructive">
          {isApiError(order.error) && order.error.status === 404
            ? 'No encontramos esta orden.'
            : getErrorMessage(order.error)}
        </p>
        {backToOrders}
      </div>
    )
  }

  const { data } = order.data

  return (
    <section className="flex flex-col gap-8">
      {backToOrders}
      {state?.justPlaced && <OrderPlacedBanner orderId={data.id} />}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
          Orden <span className="tabular-nums">#{orderNumber(data.id)}</span>
        </h1>
        <OrderStatusBadge status={data.status} />
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <OrderLines items={data.items} />
        <aside aria-label="Resumen de la orden" className="rounded-2xl border bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 text-base font-medium">Resumen</h2>
          <OrderSummary order={data}>
            <Link to={paths.products} className={buttonVariants({ variant: 'outline' })}>
              Seguir comprando
            </Link>
          </OrderSummary>
        </aside>
      </div>
    </section>
  )
}
