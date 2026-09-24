import apiClient from './apiClient'

export const userService = {
  getCurrentUser: () => apiClient.get('/user/me'),
  sendVerificationEmail: (email: string) => {
    return apiClient.post('/user/send-verification-email', `"${email}"`, {
      headers: { 'Content-Type': 'application/json' }
    })
  },
  verifyEmail: (token: string) => apiClient.get('/user/verify-email', { params: { token } }),
  updateProfile: (data: any) => apiClient.put('/user/profile', data),
}
