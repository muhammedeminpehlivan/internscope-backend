import apiClient from './apiClient'

export const lookupService = {
  getUniversities: () => apiClient.get('/university'),
  getDepartments: () => apiClient.get('/department'),
  getCities: () => apiClient.get('/city'),
}
