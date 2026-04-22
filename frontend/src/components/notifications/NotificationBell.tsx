import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications'
import { NotificationsList } from './NotificationsList'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: count = 0 } = useUnreadNotificationCount()
  const { data, isLoading } = useNotifications({ page: 1, limit: 6 })
  const markAll = useMarkAllNotificationsRead()

  const hasUnread = count > 0
  const display = count > 99 ? '99+' : String(count)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${hasUnread ? ` (${count} unread)` : ''}`}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground',
                'h-4.5 animate-in fade-in zoom-in-75',
              )}
            >
              {display}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-90 max-w-[calc(100vw-1.5rem)] p-0"
      >
        <div className="flex items-center justify-between border-b border-border p-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Notifications
            </p>
            <p className="text-[11px] text-muted-foreground">
              {hasUnread ? `${count} unread` : 'All caught up'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasUnread || markAll.isPending}
            onClick={() => markAll.mutate()}
            className="h-8 gap-1.5 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          <NotificationsList
            notifications={data?.data}
            isLoading={isLoading}
            compact
            onItemNavigated={() => setOpen(false)}
          />
        </div>
        <div className="border-t border-border p-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => setOpen(false)}
          >
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
