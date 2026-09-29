import { ShieldAlertIcon } from 'lucide-react'
import { Link } from 'react-router'

import { paths } from '@/shared/config/routes'
import { buttonVariants } from '@/shared/ui/button'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShieldAlertIcon className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl tracking-tight">No tienes acceso a esta sección</h1>
        <p className="text-sm text-muted-foreground">Solo los administradores pueden entrar aquí.</p>
      </div>
      <Link to={paths.products} className={buttonVariants()}>
        Volver a la tienda
      </Link>
    </div>
  )
}
