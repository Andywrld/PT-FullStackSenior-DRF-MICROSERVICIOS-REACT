import { cn } from '@/shared/lib/utils'

import type { ProductImage as ProductImageModel } from '../model/product'

export const DEFAULT_PRODUCT_IMAGE = '/images/product-default.png'

type ProductImageProps = {
  image?: ProductImageModel
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export function ProductImage({ image, alt, className, loading = 'lazy' }: ProductImageProps) {
  return (
    <img
      src={image?.url ?? DEFAULT_PRODUCT_IMAGE}
      alt={alt}
      width={image?.width ?? 941}
      height={image?.height ?? 941}
      loading={loading}
      className={cn('size-full bg-muted object-cover', className)}
    />
  )
}
