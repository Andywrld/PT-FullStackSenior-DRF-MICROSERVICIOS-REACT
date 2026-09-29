import { ReceiptTextIcon } from 'lucide-react'
import { Link } from 'react-router'

import { getErrorMessage } from '@/shared/api/error-messages'
import { PaginationControls } from '@/shared/components/pagination-controls'
import { paths } from '@/shared/config/routes'
import { buttonVariants } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { OrderRow } from '../components/order-row'
import { useOrdersPage } from '../filters/orders-filters'
import { useMyOrders } from '../hooks/use-orders'

export function OrdersPage() {
  const [page, setPage] = useOrdersPage()
  const orders = useMyOrders(page)
  const pagination = orders.data?.meta.pagination

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Mis órdenes</h1>
        {pagination && pagination.total_items > 0 && (
          <p className="text-sm text-muted-foreground tabular-nums">
            {pagination.total_items} {pagination.total_items === 1 ? 'orden' : 'órdenes'}
          </p>
        )}
      </header>

      {orders.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando órdenes">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.isError ? (
        <p role="alert" className="py-24 text-center text-destructive">
          {getErrorMessage(orders.error)}
        </p>
      ) : orders.data.data.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ReceiptTextIcon className="size-6" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">Todavía no tienes órdenes</p>
            <p className="text-sm text-muted-foreground">Cuando generes una orden desde tu carrito, aparecerá aquí.</p>
          </div>
          <Link to={paths.products} className={buttonVariants()}>
            Explorar productos
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y border-y" aria-busy={orders.isPlaceholderData}>
            {orders.data.data.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
          {pagination && <PaginationControls pagination={pagination} onPageChange={(next) => void setPage(next)} />}
        </>
      )}
    </section>
  )
}
