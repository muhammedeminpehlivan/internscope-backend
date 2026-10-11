import apiClient from './apiClient'

export const notificationService = {
  // ?unreadOnly=true ile sadece okunmamışlar
  getAll: (unreadOnly = false) =>
    apiClient.get('/notification', { params: unreadOnly ? { unreadOnly: true } : {} }),
  getUnreadCount: () => apiClient.get('/notification/unread-count'),
  markRead: (id: string) => apiClient.put(`/notification/${id}/read`),
  markAllRead: () => apiClient.put('/notification/read-all'),
}
