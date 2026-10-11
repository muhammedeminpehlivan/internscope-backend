import apiClient from './apiClient'

export const companyService = {
  getAll: (filters?: any) => apiClient.get('/company', { params: filters }),
  getBySlug: (slug: string) => apiClient.get(`/company/${slug}`),
}
