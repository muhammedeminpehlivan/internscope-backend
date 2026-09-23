import apiClient from './apiClient'

export const internshipService = {
  getAll: (filters?: any) => apiClient.get('/internship', { params: filters }),
  getMine: () => apiClient.get('/internship/mine'),
  getById: async (id: string) => {
    const response = await apiClient.get('/internship')
    const internships = Array.isArray(response.data) ? response.data : response.data?.items || []
    const found = internships.find((internship: any) => internship.id === id)
    console.log(`getById(${id}) found:`, found)
    return { ...response, data: found }
  },
  create: (data: any) => apiClient.post('/internship', data),
  update: (id: string, data: any) => apiClient.put(`/internship/${id}`, data),
  remove: (id: string) => apiClient.delete(`/internship/${id}`),
  getComments: (id: string) => apiClient.get(`/internship/${id}/comments`),
  addComment: (id: string, content: string) => apiClient.post(`/internship/${id}/comments`, { content }),
  getCommentReactions: (commentId: string) => apiClient.get(`/comment/${commentId}/reactions`),
  reactToComment: (commentId: string, isPositive: boolean) => apiClient.post(`/comment/${commentId}/reactions`, { isPositive }),
  uploadSGK: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post(`/internship/${id}/sgk`, form)
  },
}
