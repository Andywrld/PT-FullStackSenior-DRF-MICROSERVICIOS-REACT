import type { Role } from '@/features/auth/model/auth'
import { ROLE_LABELS } from '@/features/auth/model/roles'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'

const ROLE_STYLES: Record<Role, string> = {
  super_admin: 'border-primary/25 bg-primary/10 text-primary',
  admin: 'border-border text-foreground',
  user: 'border-transparent bg-muted text-muted-foreground',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="outline" className={cn(ROLE_STYLES[role])}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}
