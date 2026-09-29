import { DEFAULT_PRODUCT_IMAGE } from '@/features/catalog/components/product-image'
import { cn } from '@/shared/lib/utils'

type OrderItemThumbProps = {
  imageUrl: string | null
  className?: string
}

export function OrderItemThumb({ imageUrl, className }: OrderItemThumbProps) {
  return (
    <div className={cn('shrink-0 overflow-hidden rounded-lg bg-muted', className)}>
      <img src={imageUrl ?? DEFAULT_PRODUCT_IMAGE} alt="" loading="lazy" className="size-full object-cover" />
    </div>
  )
}
