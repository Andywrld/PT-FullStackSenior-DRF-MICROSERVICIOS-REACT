import { ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { PlaceOrderButton } from '@/features/orders/containers/place-order-button'
import { getErrorMessage } from '@/shared/api/error-messages'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { paths } from '@/shared/config/routes'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import { CartSummary } from '../components/cart-summary'
import { EmptyCart } from '../components/empty-cart'
import { useCart } from '../hooks/use-cart'
import { useClearCart } from '../hooks/use-cart-mutations'
import { CartLineItem } from '../containers/cart-line-item'
import { hasUnavailableItems } from '../model/cart'

export function CartPage() {
  const cart = useCart()
  const clear = useClearCart()
  const [confirmClear, setConfirmClear] = useState(false)

  if (cart.isPending) {
    return (
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-busy="true" aria-label="Cargando carrito">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }
  if (cart.isError) {
    return (
      <p role="alert" className="py-24 text-center text-destructive">
        {getErrorMessage(cart.error)}
      </p>
    )
  }

  const { items } = cart.data.data
  const keepShopping = (
    <Link to={paths.products} className={buttonVariants({ variant: 'outline' })}>
      <ArrowLeftIcon />
      Seguir comprando
    </Link>
  )

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">Detalle de la compra</h1>
          <p className="text-sm text-muted-foreground">
            {items.length === 1 ? '1 producto' : `${items.length} productos`}
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmClear(true)}
          >
            Vaciar carrito
          </Button>
        )}
      </header>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="¿Vaciar el carrito?"
        description="Se quitarán todos los productos. Esta acción no se puede deshacer."
        confirmLabel={clear.isPending ? 'Vaciando…' : 'Vaciar carrito'}
        destructive
        pending={clear.isPending}
        onConfirm={() =>
          clear.mutate(undefined, {
            onSuccess: () => toast.success('Vaciaste el carrito'),
            onError: (error) => toast.error(getErrorMessage(error)),
            onSettled: () => setConfirmClear(false),
          })
        }
      />

      {items.length === 0 ? (
        <EmptyCart action={keepShopping} />
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ul className="divide-y border-y">
            {items.map((line) => (
              <CartLineItem key={line.product_id} line={line} />
            ))}
          </ul>
          <aside aria-label="Resumen de la compra" className="rounded-2xl border bg-surface p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 text-base font-medium">Resumen</h2>
            <CartSummary cart={cart.data.data}>
              <div className="flex flex-col gap-2">
                <PlaceOrderButton disabled={hasUnavailableItems(cart.data.data)} />
                {keepShopping}
              </div>
            </CartSummary>
          </aside>
        </div>
      )}
    </section>
  )
}
