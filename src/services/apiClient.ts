import axios from 'axios'
import { showToast } from '../components/Toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://internscope-backend.onrender.com'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const serverMessage = err.response?.data?.message || err.response?.data?.title
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tokenExpiry')
    } else if (status === 429) {
      showToast(typeof serverMessage === 'string' ? serverMessage : 'Çok hızlı işlem yapıyorsunuz, lütfen biraz bekleyin.', 'error')
    } else if (status === 409) {
      showToast(typeof serverMessage === 'string' ? serverMessage : 'Bu içeriği az önce zaten gönderdiniz.', 'error')
    }
    return Promise.reject(err)
  }
)

export default apiClient