import { CircleCheckIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'

import { orderStatusLabel } from '../model/order'

type OrderStatusBadgeProps = {
  status: string
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('text-success', className)}>
      <CircleCheckIcon data-icon="inline-start" />
      {orderStatusLabel(status)}
    </Badge>
  )
}
