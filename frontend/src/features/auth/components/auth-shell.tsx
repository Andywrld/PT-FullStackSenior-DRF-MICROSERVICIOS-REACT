import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  footer: ReactNode
  children: ReactNode
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 py-6 sm:py-12">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-heading text-4xl tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      <p className="text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  )
}
