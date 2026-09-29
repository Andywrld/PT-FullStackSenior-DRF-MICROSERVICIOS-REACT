import { Link } from 'react-router'

import { useSession } from '@/features/auth/hooks/use-session'
import { getErrorMessage } from '@/shared/api/error-messages'
import { paths } from '@/shared/config/routes'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { Skeleton } from '@/shared/ui/skeleton'

import { CartSummary } from '../components/cart-summary'
import { EmptyCart } from '../components/empty-cart'
import { useCart } from '../hooks/use-cart'
import { CartLineItem } from './cart-line-item'

type CartDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { isAuthenticated } = useSession()
  const cart = useCart()
  const close = () => onOpenChange(false)
  const items = cart.data?.data.items ?? []

  return (
    <Sheet modal="trap-focus" open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(26rem,100vw)] gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="font-heading text-2xl font-normal">Tu carrito</SheetTitle>
          <SheetDescription>
            {items.length === 1 ? '1 producto' : `${items.length} productos`}
          </SheetDescription>
        </SheetHeader>

        {!isAuthenticated ? (
          <EmptyCart
            title="Inicia sesión para ver tu carrito"
            description="Tu carrito se guarda en tu cuenta, en cualquier dispositivo."
            action={
              <Link to={paths.login} onClick={close} className={buttonVariants()}>
                Iniciar sesión
              </Link>
            }
          />
        ) : cart.isPending ? (
          <div className="flex flex-col gap-4 p-6" aria-label="Cargando carrito">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : cart.isError ? (
          <p role="alert" className="p-6 text-sm text-destructive">
            {getErrorMessage(cart.error)}
          </p>
        ) : items.length === 0 ? (
          <EmptyCart
            action={
              <Button variant="outline" onClick={close}>
                Seguir comprando
              </Button>
            }
          />
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-6">
              {items.map((line) => (
                <CartLineItem key={line.product_id} line={line} compact onNavigate={close} />
              ))}
            </ul>
            <div className="border-t bg-surface px-6 py-5">
              <CartSummary cart={cart.data.data}>
                <div className="flex flex-col gap-2">
                  <Link to={paths.cart} onClick={close} className={buttonVariants({ size: 'lg', className: 'h-11' })}>
                    Ver detalle de la compra
                  </Link>
                  <Button variant="ghost" onClick={close}>
                    Seguir comprando
                  </Button>
                </div>
              </CartSummary>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
