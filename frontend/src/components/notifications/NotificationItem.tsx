import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle, Sprout, UserPlus, Bell, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  useMarkNotificationRead,
  useDeleteNotification,
} from '@/hooks/useNotifications'
import type { AppNotification } from '@/types/api.types'

function iconFor(type: string) {
  switch (type) {
    case 'FIELD_AT_RISK':
      return AlertTriangle
    case 'FIELD_UPDATE':
      return Sprout
    case 'FIELD_ASSIGNED':
      return UserPlus
    default:
      return Bell
  }
}

function toneFor(type: string) {
  switch (type) {
    case 'FIELD_AT_RISK':
      return 'bg-destructive/10 text-destructive'
    case 'FIELD_UPDATE':
      return 'bg-primary-soft text-primary'
    case 'FIELD_ASSIGNED':
      return 'bg-accent text-accent-foreground'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

interface Props {
  notification: AppNotification
  compact?: boolean
  showDelete?: boolean
  onNavigated?: () => void
}

export function NotificationItem({
  notification,
  compact = false,
  showDelete = false,
  onNavigated,
}: Props) {
  const navigate = useNavigate()
  const markRead = useMarkNotificationRead()
  const remove = useDeleteNotification()

  const Icon = iconFor(notification.type)
  const tone = toneFor(notification.type)
  const fieldId = notification.fieldId

  const handleClick = () => {
    if (!notification.isRead) markRead.mutate(notification.id)
    if (fieldId) {
      navigate({ to: '/fields/$id', params: { id: String(fieldId) } })
      onNavigated?.()
    }
  }

  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded-lg border border-border p-3 transition-colors',
        !notification.isRead && 'bg-primary/5 border-primary/20',
        (fieldId || !notification.isRead) && 'cursor-pointer hover:bg-muted/60',
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          tone,
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm',
              notification.isRead
                ? 'font-medium text-foreground'
                : 'font-semibold text-foreground',
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span
              aria-label="Unread"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
            />
          )}
        </div>
        <p
          className={cn(
            'text-xs text-muted-foreground',
            compact ? 'line-clamp-2' : 'line-clamp-3',
          )}
        >
          {notification.message}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      {showDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            remove.mutate(notification.id)
          }}
          aria-label="Delete notification"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
