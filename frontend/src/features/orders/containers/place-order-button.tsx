import { LoaderCircleIcon } from 'lucide-react'
import { useRef } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { getErrorMessage } from '@/shared/api/error-messages'
import { paths } from '@/shared/config/routes'
import { randomId } from '@/shared/lib/random-id'
import { Button } from '@/shared/ui/button'

import { usePlaceOrder } from '../hooks/use-place-order'
import type { OrderPageState } from '../model/order'

export function PlaceOrderButton({ disabled }: { disabled?: boolean }) {
  const placeOrder = usePlaceOrder()
  const navigate = useNavigate()
  // Same key until an order comes back: a double click or a retry after a lost
  // response returns that order instead of creating a second one.
  const idempotencyKey = useRef<string | null>(null)

  const submit = async () => {
    idempotencyKey.current ??= randomId()
    try {
      const { data: order } = await placeOrder.mutateAsync(idempotencyKey.current)
      idempotencyKey.current = null
      const state: OrderPageState = { justPlaced: true }
      navigate(paths.order(order.id), { state })
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Button size="lg" className="h-11" disabled={disabled || placeOrder.isPending} onClick={submit}>
      {placeOrder.isPending && <LoaderCircleIcon className="animate-spin" />}
      {placeOrder.isPending ? 'Generando orden…' : 'Generar orden'}
    </Button>
  )
}
