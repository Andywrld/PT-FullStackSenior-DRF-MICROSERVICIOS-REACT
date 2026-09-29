import type { ReactNode } from 'react'

type AdminPageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">{title}</h1>
        <p className="min-h-5 text-sm text-muted-foreground tabular-nums">{description}</p>
      </div>
      {actions}
    </header>
  )
}
