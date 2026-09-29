import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { randomId } from '@/shared/lib/random-id'

import { imageFileError, MAX_PRODUCT_IMAGES } from '../model/admin-product'

export type PendingImage = { id: string; file: File; previewUrl: string }

/** Images picked before the product exists: local previews, uploaded once it is created. */
export function usePendingImages() {
  const [images, setImages] = useState<PendingImage[]>([])
  const latest = useRef(images)

  useEffect(() => {
    latest.current = images
  }, [images])
  useEffect(() => () => latest.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)), [])

  const add = (files: File[]) => {
    const accepted = files.filter((file) => {
      const problem = imageFileError(file)
      if (problem) toast.error(problem)
      return !problem
    })
    const room = MAX_PRODUCT_IMAGES - images.length
    if (accepted.length > room) toast.error(`Solo se admiten ${MAX_PRODUCT_IMAGES} imágenes por producto.`)
    const added = accepted
      .slice(0, room)
      .map((file) => ({ id: randomId(), file, previewUrl: URL.createObjectURL(file) }))
    setImages((current) => [...current, ...added])
  }

  const remove = (id: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return current.filter((image) => image.id !== id)
    })
  }

  const clear = () => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    setImages([])
  }

  return { images, add, remove, clear }
}
