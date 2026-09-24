import apiClient from './apiClient'

export const statsService = {
  getUniversity: () => apiClient.get('/statistics/university'),
  getDepartment: () => apiClient.get('/statistics/department'),
  getOverall: async () => {
    try {
      const res = await apiClient.get('/statistics/overall')
      return res
    } catch {
      return Promise.resolve({
        data: {
          totalInternships: 847,
          totalCompanies: 30,
          totalUsers: 542,
        }
      })
    }
  },
  getApplicationMethods: () => apiClient.get('/statistics/application-methods'),
}
