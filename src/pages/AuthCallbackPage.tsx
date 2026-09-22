import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '../domain/types'

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
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('authToken', token)
        localStorage.setItem('tokenExpiry', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString())

        // JWT Çözme
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const payload = JSON.parse(jsonPayload)

        // User Interface'inize tam uyumlu nesne
        const userObj: User = {
          id: payload.sub || payload.id || '',
          linkedInId: payload.linkedInId || payload.sub || '',
          fullName: payload.name || payload.fullName || 'Öğrenci',
          email: payload.email || '',
          profilePictureUrl: payload.profilePictureUrl || payload.picture || '',
          isEmailVerified: payload.isEmailVerified ?? false,
          role: (payload.role as 'Student' | 'Admin') || 'Student'
        }

        localStorage.setItem('user', JSON.stringify(userObj))
        navigate('/discover', { replace: true })
      } catch (err) {
        console.error('Token ayrıştırma hatası:', err)
        navigate('/', { replace: true })
      }
    } else {
      navigate('/', { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#050B1A] flex flex-col items-center justify-center text-[#F8FAFC]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F59E0B] mb-4"></div>
      <p className="text-lg">Giriş işleniyor, profil yükleniyor...</p>
    </div>
  )
}