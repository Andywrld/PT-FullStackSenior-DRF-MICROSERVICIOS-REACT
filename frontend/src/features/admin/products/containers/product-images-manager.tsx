import { toast } from 'sonner'

import { getErrorMessage } from '@/shared/api/error-messages'

import { ImageTiles } from '../components/image-tiles'
import { useDeleteProductImage, useUploadProductImage } from '../hooks/use-admin-products'
import { type AdminProduct, imageFileError, imageUploadError, MAX_PRODUCT_IMAGES } from '../model/admin-product'

/** Images of an existing product: every change goes to the server right away. */
export function ProductImagesManager({ product }: { product: AdminProduct }) {
  const upload = useUploadProductImage()
  const remove = useDeleteProductImage(product.id)

  const addImages = async (files: File[]) => {
    const room = MAX_PRODUCT_IMAGES - product.images.length
    for (const file of files.slice(0, room)) {
      const problem = imageFileError(file)
      if (problem) {
        toast.error(problem)
        continue
      }
      try {
        await upload.mutateAsync({ productId: product.id, file })
      } catch (error) {
        toast.error(imageUploadError(error))
      }
    }
    if (files.length > room) toast.error(`Solo se admiten ${MAX_PRODUCT_IMAGES} imágenes por producto.`)
  }

  return (
    <ImageTiles
      tiles={product.images.map((image) => ({ id: image.id, src: image.url }))}
      max={MAX_PRODUCT_IMAGES}
      adding={upload.isPending}
      disabled={remove.isPending}
      onAdd={(files) => void addImages(files)}
      onRemove={(imageId) =>
        remove.mutate(imageId, {
          onSuccess: () => toast.success('Imagen eliminada'),
          onError: (error) => toast.error(getErrorMessage(error)),
        })
      }
    />
  )
}
