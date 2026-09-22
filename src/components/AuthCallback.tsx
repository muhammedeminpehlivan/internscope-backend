import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    const search = window.location.search

    let token: string | null = null

    if (hash && hash.includes('token=')) {
      token = hash.split('token=')[1]?.split('&')[0]
    } else if (search && search.includes('token=')) {
      const params = new URLSearchParams(search)
      token = params.get('token')
    }

    if (token) {
      // apiClient ve servislerin beklediği anahtarları kaydedin
      localStorage.setItem('token', token)
      localStorage.setItem('authToken', token)

      // useAuth hook'unun veya authService'in kullanıcıyı yüklemesini sağlayıp yönlendirin
      authService.getTokenFromCallback(token)
        .then(() => {
          // State'in ve AuthContext'in token'ı algılaması için tam yönlendirme:
          window.location.href = '/discover'
        })
        .catch(() => {
          window.location.href = '/discover'
        })
    } else {
      navigate('/landing', { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-ink-deep flex flex-col items-center justify-center text-ledger-paper">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ledger-paper mb-4"></div>
      <p className="text-lg">Giriş yapılıyor, profil yükleniyor...</p>
    </div>
  )
}