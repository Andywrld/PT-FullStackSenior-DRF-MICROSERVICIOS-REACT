import { ImagePlusIcon, LoaderCircleIcon, XIcon } from 'lucide-react'
import { useRef } from 'react'

import { cn } from '@/shared/lib/utils'

import { ACCEPTED_IMAGE_TYPES } from '../model/admin-product'

export type ImageTile = { id: string; src: string }

type ImageTilesProps = {
  tiles: ImageTile[]
  max: number
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  adding?: boolean
  addingLabel?: string
  disabled?: boolean
}

export function ImageTiles({ tiles, max, onAdd, onRemove, adding, addingLabel, disabled }: ImageTilesProps) {
  const input = useRef<HTMLInputElement>(null)
  const full = tiles.length >= max

  return (
    <section aria-labelledby="product-images" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="product-images" className="text-sm font-medium">
          Imágenes
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {tiles.length} de {max}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {tiles.map((tile, index) => (
          <li
            key={tile.id}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted animate-in duration-(--duration-base) fade-in zoom-in-95"
          >
            <img src={tile.src} alt="" className="size-full object-cover" />
            {index === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-background/90 px-1.5 py-0.5 text-[0.6875rem] font-medium">
                Portada
              </span>
            )}
            <button
              type="button"
              aria-label={`Quitar imagen ${index + 1}`}
              disabled={disabled}
              onClick={() => onRemove(tile.id)}
              className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity duration-(--duration-fast) group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none max-sm:opacity-100"
            >
              <XIcon className="size-4" />
            </button>
          </li>
        ))}
        {!full && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={disabled || adding}
              className={cn(
                'flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors duration-(--duration-fast) hover:border-primary/50 hover:bg-primary/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60',
                adding && 'cursor-progress',
              )}
            >
              {adding ? <LoaderCircleIcon className="size-5 animate-spin" /> : <ImagePlusIcon className="size-5" />}
              {adding ? (addingLabel ?? 'Subiendo…') : 'Agregar'}
            </button>
          </li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">JPG, PNG o WEBP, hasta 5 MB cada una. La primera es la portada.</p>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          onAdd(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
    </section>
  )
}
