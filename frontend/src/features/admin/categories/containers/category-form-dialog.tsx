import { toast } from 'sonner'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

import { CategoryForm } from '../components/category-form'
import { useCreateCategory, useUpdateCategory } from '../hooks/use-admin-categories'
import { type AdminCategory, type CategoryFormValues, EMPTY_CATEGORY_FORM, toCategoryForm } from '../model/admin-category'

type CategoryFormDialogProps = {
  open: boolean
  category: AdminCategory | null
  onOpenChange: (open: boolean) => void
}

export function CategoryFormDialog({ open, category, onOpenChange }: CategoryFormDialogProps) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const mutation = category ? update : create

  const close = () => {
    onOpenChange(false)
    create.reset()
    update.reset()
  }

  const submit = (values: CategoryFormValues) => {
    const onSuccess = () => {
      toast.success(category ? 'Categoría actualizada' : 'Categoría creada')
      close()
    }
    if (category) update.mutate({ categoryId: category.id, values }, { onSuccess })
    else create.mutate(values, { onSuccess })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          <DialogDescription>
            {category ? 'Los cambios se ven en la tienda al instante.' : 'Agrupa productos para que sea fácil encontrarlos.'}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          key={category?.id ?? 'new'}
          defaultValues={category ? toCategoryForm(category) : EMPTY_CATEGORY_FORM}
          submitLabel={category ? 'Guardar cambios' : 'Crear categoría'}
          pending={mutation.isPending}
          error={mutation.error}
          onSubmit={submit}
          onCancel={close}
        />
      </DialogContent>
    </Dialog>
  )
}
