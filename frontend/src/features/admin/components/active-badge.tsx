import { Badge } from '@/shared/ui/badge'

type ActiveBadgeProps = {
  active: boolean
  activeLabel: string
  inactiveLabel: string
}

export function ActiveBadge({ active, activeLabel, inactiveLabel }: ActiveBadgeProps) {
  return active ? (
    <Badge variant="outline" className="text-success">
      {activeLabel}
    </Badge>
  ) : (
    <Badge variant="secondary">{inactiveLabel}</Badge>
  )
}
