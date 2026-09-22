import apiClient from './apiClient'

export const statsService = {
  getUniversity: () => apiClient.get('/statistics/university'),
  getDepartment: () => apiClient.get('/statistics/department'),
  getOverall: () => apiClient.get('/statistics/overall'),
  getApplicationMethods: () => apiClient.get('/statistics/application-methods'),
}
