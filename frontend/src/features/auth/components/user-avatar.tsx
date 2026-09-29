import { Avatar, AvatarImage } from '@/shared/ui/avatar'

export function UserAvatar({ className }: { className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarImage src="/images/avatar-default.png" alt="" />
    </Avatar>
  )
}
