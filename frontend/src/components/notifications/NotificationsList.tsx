import { Bell } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { NotificationItem } from './NotificationItem'
import type { AppNotification } from '#/types/api.types'

interface Props {
  notifications: AppNotification[] | undefined
  isLoading: boolean
  compact?: boolean
  showDelete?: boolean
  emptyLabel?: string
  onItemNavigated?: () => void
  groupByDay?: boolean
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function NotificationsList({
  notifications,
  isLoading,
  compact = false,
  showDelete = false,
  emptyLabel = "You're all caught up.",
  onItemNavigated,
  groupByDay = false,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Bell className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">No notifications</p>
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      </div>
    )
  }

  if (!groupByDay) {
    return (
      <div className="space-y-2">
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            compact={compact}
            showDelete={showDelete}
            onNavigated={onItemNavigated}
          />
        ))}
      </div>
    )
  }

  const today = notifications.filter((n) => isToday(n.createdAt))
  const earlier = notifications.filter((n) => !isToday(n.createdAt))

  return (
    <div className="space-y-5">
      {today.length > 0 && (
        <Section title="Today">
          {today.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              compact={compact}
              showDelete={showDelete}
              onNavigated={onItemNavigated}
            />
          ))}
        </Section>
      )}
      {earlier.length > 0 && (
        <Section title="Earlier">
          {earlier.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              compact={compact}
              showDelete={showDelete}
              onNavigated={onItemNavigated}
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
