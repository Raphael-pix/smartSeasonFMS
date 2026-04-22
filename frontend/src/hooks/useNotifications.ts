import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications.service'
import type { NotificationsListParams } from '@/services/notifications.service'
import type { NotificationsResponse } from '@/types/api.types'

const KEYS = {
  all: ['notifications'] as const,
  list: ({ page, limit, unreadOnly }: NotificationsListParams) =>
    ['notifications', 'list', page, limit, unreadOnly ?? 'all'] as const,
  unread: ['notifications', 'unread-count'] as const,
}

export function useNotifications(params: NotificationsListParams = {}) {
  const normalizedParams = {
    page: params.page,
    limit: params.limit,
    ...(params.unreadOnly ? { unreadOnly: true } : {}),
  }
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => notificationsService.list(normalizedParams),
    staleTime: 30_000,
  })
}

export function useUnreadNotificationCount(options?: { pollMs?: number }) {
  const pollMs = options?.pollMs ?? 45_000
  return useQuery({
    queryKey: KEYS.unread,
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: pollMs,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.all })

      // Snapshot for rollback
      const prevLists = qc.getQueriesData<NotificationsResponse>({
        queryKey: ['notifications', 'list'],
      })
      const prevUnread = qc.getQueryData<number>(KEYS.unread)

      // Optimistic: flip isRead in any cached list
      prevLists.forEach(([key, data]) => {
        if (!data) return
        qc.setQueryData<NotificationsResponse>(key, {
          ...data,
          data: data.data.map((n) =>
            n.id === id
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n,
          ),
        })
      })

      // Optimistic: decrement unread count
      if (typeof prevUnread === 'number') {
        qc.setQueryData<number>(KEYS.unread, Math.max(0, prevUnread - 1))
      }

      return { prevLists, prevUnread }
    },
    onError: (_err, _id, ctx) => {
      ctx?.prevLists.forEach(([key, data]) => qc.setQueryData(key, data))
      if (ctx?.prevUnread !== undefined) {
        qc.setQueryData(KEYS.unread, ctx.prevUnread)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      qc.setQueryData<number>(KEYS.unread, 0)
      qc.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
    },
  })
}
