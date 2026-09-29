import { useState } from 'react'
import { toast } from 'sonner'

import { useCategories } from '@/features/catalog/hooks/use-categories'
import type { CategorySummary } from '@/features/catalog/model/product'
import { getErrorMessage } from '@/shared/api/error-messages'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Skeleton } from '@/shared/ui/skeleton'

import { ImageTiles } from '../components/image-tiles'
import { ProductForm } from '../components/product-form'
import { useAdminProduct, useCreateProduct, useUpdateProduct, useUploadProductImage } from '../hooks/use-admin-products'
import { usePendingImages } from '../hooks/use-pending-images'
import {
  EMPTY_PRODUCT_FORM,
  imageUploadError,
  MAX_PRODUCT_IMAGES,
  type ProductFormValues,
  toProductForm,
  toProductPayload,
} from '../model/admin-product'
import { ProductImagesManager } from './product-images-manager'

type ProductFormDialogProps = {
  open: boolean
  productId: string | null
  onOpenChange: (open: boolean) => void
}

function categoryOptions(active: CategorySummary[], current: CategorySummary | null | undefined) {
  const options = [
    { value: null, label: 'Sin categoría' },
    ...active.map((category) => ({ value: category.id, label: category.name })),
  ]
  // An inactive category can stay on a product, but it is not in the active list.
  if (current && !active.some((category) => category.id === current.id)) {
    options.push({ value: current.id, label: `${current.name} (inactiva)` })
  }
  return options
}

export function ProductFormDialog({ open, productId, onOpenChange }: ProductFormDialogProps) {
  const product = useAdminProduct(open ? productId : null)
  const categories = useCategories()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const upload = useUploadProductImage()
  const pendingImages = usePendingImages()
  const [uploaded, setUploaded] = useState<number | null>(null)
  const editing = productId !== null
  const mutation = editing ? update : create

  const close = () => {
    onOpenChange(false)
    create.reset()
    update.reset()
    pendingImages.clear()
  }

  // Created first (the images need its id), then each picked image goes up in order.
  const createWithImages = async (values: ProductFormValues) => {
    let createdId: string
    try {
      createdId = (await create.mutateAsync(toProductPayload(values))).data.id
    } catch {
      return
    }
    let failed = 0
    for (const [index, image] of pendingImages.images.entries()) {
      setUploaded(index)
      try {
        await upload.mutateAsync({ productId: createdId, file: image.file })
      } catch (error) {
        failed += 1
        toast.error(imageUploadError(error))
      }
    }
    setUploaded(null)
    if (failed > 0) toast.warning('Producto creado, pero algunas imágenes no se subieron. Puedes agregarlas al editarlo.')
    else toast.success('Producto creado')
    close()
  }

  const submit = (values: ProductFormValues) => {
    const payload = toProductPayload(values)
    if (productId) {
      update.mutate(
        { productId, payload },
        {
          onSuccess: () => {
            toast.success('Producto actualizado')
            close()
          },
        },
      )
      return
    }
    void createWithImages(values)
  }
  const uploading = uploaded !== null

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="flex max-h-[min(92dvh,52rem)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle className="font-heading text-2xl font-normal">
            {editing ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? (product.data ? `SKU ${product.data.data.sku}` : 'Cargando…')
              : 'El SKU se genera automáticamente a partir de la categoría.'}
          </DialogDescription>
        </DialogHeader>

        {editing && product.isPending ? (
          <div className="flex flex-col gap-5 px-6 py-5" aria-busy="true" aria-label="Cargando producto">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : editing && product.isError ? (
          <p role="alert" className="px-6 py-10 text-center text-sm text-destructive">
            {getErrorMessage(product.error)}
          </p>
        ) : (
          <ProductForm
            key={productId ?? 'new'}
            defaultValues={product.data ? toProductForm(product.data.data) : EMPTY_PRODUCT_FORM}
            categoryOptions={categoryOptions(categories.data?.data ?? [], product.data?.data.category)}
            submitLabel={editing ? 'Guardar cambios' : 'Crear producto'}
            pendingLabel={
              uploading ? `Subiendo imágenes ${(uploaded ?? 0) + 1} de ${pendingImages.images.length}…` : undefined
            }
            pending={mutation.isPending || uploading}
            error={mutation.error}
            onSubmit={submit}
            onCancel={close}
          >
            {product.data ? (
              <ProductImagesManager product={product.data.data} />
            ) : (
              <ImageTiles
                tiles={pendingImages.images.map((image) => ({ id: image.id, src: image.previewUrl }))}
                max={MAX_PRODUCT_IMAGES}
                disabled={create.isPending || uploading}
                onAdd={pendingImages.add}
                onRemove={pendingImages.remove}
              />
            )}
          </ProductForm>
        )}
      </DialogContent>
    </Dialog>
  )
}
