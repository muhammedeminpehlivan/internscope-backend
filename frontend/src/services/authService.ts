import apiClient from './apiClient'

export const authService = {
  login: () => {
    const baseUrl = 'https://internscope-backend.onrender.com'
    window.location.href = `${baseUrl}/auth/login`
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiry')
  },
  getTokenFromCallback: async (token: string) => {
    try {
      localStorage.setItem('token', token)
      localStorage.setItem('tokenExpiry', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString())

      const response = await apiClient.get('/user/me')
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data))
        return response.data
      }
      return null
    } catch (err) {
      console.error('Token callback hatası:', err)
      return null
    }
  },
}