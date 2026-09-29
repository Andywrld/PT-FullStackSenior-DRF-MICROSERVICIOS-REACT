import { useState } from 'react'

import { cn } from '@/shared/lib/utils'

import type { ProductImage as ProductImageModel } from '../model/product'
import { ProductImage } from './product-image'

type ProductGalleryProps = {
  images: ProductImageModel[]
  alt: string
}

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = images[selectedIndex] ?? images[0]

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
        {/* key: remount on change so the new photo fades in. */}
        <ProductImage
          key={selected?.id ?? 'default'}
          image={selected}
          alt={alt}
          loading="eager"
          className="animate-in duration-300 fade-in"
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2" aria-label="Fotos del producto">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                aria-label={`Ver foto ${index + 1} de ${images.length}`}
                aria-current={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'size-16 overflow-hidden rounded-lg border-2 border-transparent opacity-70 transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none hover:opacity-100',
                  index === selectedIndex && 'border-primary opacity-100',
                )}
              >
                <ProductImage image={image} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
