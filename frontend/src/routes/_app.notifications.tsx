import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Pagination } from '@/components/ui/PagerControls'
import { NotificationsList } from '@/components/notifications/NotificationsList'
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications'

export const Route = createFileRoute('/_app/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const params = {
    page,
    limit,
    ...(filter === 'unread' ? { unreadOnly: true } : {}),
  }

  const { data, isLoading } = useNotifications(params)
  const { data: unreadCount = 0 } = useUnreadNotificationCount()
  const markAll = useMarkAllNotificationsRead()

  const meta = data?.meta

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : "You're all caught up."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={unreadCount === 0 || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => {
          setFilter(v as 'all' | 'unread')
          setPage(1)
        }}
      >
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <NotificationsList
                notifications={data?.data}
                isLoading={isLoading}
                showDelete
                groupByDay
                emptyLabel={
                  filter === 'unread'
                    ? 'No unread notifications.'
                    : 'Notifications about your fields will appear here.'
                }
              />
            </CardContent>
          </Card>

          {meta && meta.totalPages > 1 && (
            <div className="mt-3">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
