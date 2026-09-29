import { Link } from 'react-router'

import { paths } from '@/shared/config/routes'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="font-heading text-2xl font-semibold">No encontramos esta página</h1>
      <Link to={paths.products} className="text-primary underline underline-offset-4">
        Ver los productos
      </Link>
    </div>
  )
}
