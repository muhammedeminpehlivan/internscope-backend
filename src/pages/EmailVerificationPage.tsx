import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { userService } from '../services/userService'

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Geçersiz veya eksik doğrulama bağlantısı.')
      return
    }

    const verifyToken = async () => {
      try {
        await userService.verifyEmail(token)
        setStatus('success')
      } catch (err: any) {
        console.warn('Doğrulama API hatası:', err)
        setStatus('error')
        setMessage(err.response?.data?.message || 'Doğrulama bağlantısının süresi dolmuş veya geçersiz.')
      }
    }

    verifyToken()
  }, [token])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 font-body text-on-surface">
      <div className="bg-surface-container-lowest border border-outline-variant/50 p-8 md:p-10 rounded-xl shadow-md max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
            <h2 className="font-display text-2xl font-bold text-primary">E-posta Doğrulanıyor</h2>
            <p className="text-xs text-on-surface-variant">Lütfen bekleyin, üniversite kaydınız onaylanıyor...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-primary">Tebrikler!</h2>
            <p className="text-sm text-on-surface-variant">
              Üniversite e-postanız başarıyla doğrulandı. Artık "Doğrulanmış Öğrenci" rozetine sahipsiniz.
            </p>
            <Link
              to="/profile"
              className="mt-4 px-6 py-2.5 bg-secondary text-on-secondary font-label text-xs font-semibold tracking-wide rounded-full hover:bg-primary-container transition shadow-sm"
            >
              Profile Git
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-error/10 border border-error/30 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-primary">Doğrulama Başarısız</h2>
            <p className="text-sm text-error">{message}</p>
            <Link
              to="/profile"
              className="mt-4 px-6 py-2.5 bg-surface-container-low text-primary border border-outline-variant/50 font-label text-xs font-semibold tracking-wide rounded-full hover:border-secondary transition shadow-sm"
            >
              Yeniden Dene
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}