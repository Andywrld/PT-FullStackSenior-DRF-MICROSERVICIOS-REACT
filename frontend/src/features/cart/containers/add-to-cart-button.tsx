import { ShoppingCartIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useSession } from '@/features/auth/hooks/use-session'
import { getErrorMessage } from '@/shared/api/error-messages'
import { paths } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'

import { useAddToCart } from '../hooks/use-cart-mutations'

type AddToCartButtonProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  productId: string
  productName: string
  quantity?: number
  label?: string
}

export function AddToCartButton({
  productId,
  productName,
  quantity = 1,
  label = 'Agregar al carrito',
  disabled,
  ...buttonProps
}: AddToCartButtonProps) {
  const { isAuthenticated } = useSession()
  const add = useAddToCart()
  const navigate = useNavigate()
  const location = useLocation()

  function handleClick() {
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(location.pathname + location.search)
      toast('Inicia sesión para agregar productos a tu carrito.')
      navigate(`${paths.login}?redirect=${redirect}`)
      return
    }
    add.mutate(
      { productId, quantity },
      {
        onSuccess: () =>
          toast.success(`${productName} se agregó al carrito`, {
            action: { label: 'Ver carrito', onClick: () => navigate(paths.cart) },
          }),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  return (
    <Button {...buttonProps} disabled={disabled || add.isPending} onClick={handleClick}>
      <ShoppingCartIcon />
      {add.isPending ? 'Agregando…' : label}
    </Button>
  )
}
