import { apiClient } from '@/lib/apiClient'
import type {
  AppNotification,
  NotificationsResponse,
  UnreadCountResponse,
} from '@/types/api.types'

export interface NotificationsListParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

export const notificationsService = {
  async list(params: NotificationsListParams = {}) {
    const { data } = await apiClient.get<NotificationsResponse>(
      '/notifications',
      { params },
    )
    return data
  },
  async getUnreadCount() {
    const { data } = await apiClient.get<UnreadCountResponse>(
      '/notifications/unread-count',
    )
    return data.unreadCount
  },
  async markAsRead(id: string) {
    const { data } = await apiClient.patch<AppNotification>(
      `/notifications/${id}/read`,
    )
    return data
  },
  async markAllAsRead() {
    const { data } = await apiClient.patch<{ updated: number }>(
      '/notifications/read/all',
    )
    return data
  },
  async delete(id: string) {
    await apiClient.delete(`/notifications/${id}`)
  },
}
