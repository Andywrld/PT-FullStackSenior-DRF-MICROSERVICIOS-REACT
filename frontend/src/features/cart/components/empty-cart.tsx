import { ShoppingCartIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyCartProps = {
  title?: string
  description?: string
  action: ReactNode
}

export function EmptyCart({
  title = 'Tu carrito está vacío',
  description = 'Explora el catálogo y agrega lo que necesites.',
  action,
}: EmptyCartProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShoppingCartIcon className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
