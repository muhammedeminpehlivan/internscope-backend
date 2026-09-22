import apiClient from './apiClient'

export const adminService = {
  getPendingInternships: () => apiClient.get('/admin/pending'),
  getAllInternships: () => apiClient.get('/admin/all'),
  approveInternship: (id: string) => apiClient.put(`/admin/${id}/approve`),
  rejectInternship: (id: string, reason: string) => apiClient.put(`/admin/${id}/reject`, { reason }),
  approveChanges: (id: string) => apiClient.put(`/admin/${id}/approve-changes`),
  rejectChanges: (id: string, reason: string) => apiClient.put(`/admin/${id}/reject-changes`, { reason }),
}
