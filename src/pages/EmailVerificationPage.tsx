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
    <main className="min-h-screen bg-[#050B1A] flex items-center justify-center px-4 font-['Inter'] text-[#e0e3e5]">
      <div className="bg-[#1d2022] border border-[#45464c] p-8 md:p-10 rounded-xl shadow-2xl max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
            <h2 className="font-['Newsreader'] text-2xl font-bold text-white">E-posta Doğrulanıyor</h2>
            <p className="text-xs text-[#c6c6cd]">Lütfen bekleyin, üniversite kaydınız onaylanıyor...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h2 className="font-['Newsreader'] text-3xl font-bold text-white">Tebrikler!</h2>
            <p className="text-sm text-[#c6c6cd]">
              Üniversite e-postanız başarıyla doğrulandı. Artık "Doğrulanmış Öğrenci" rozetine sahipsiniz.
            </p>
            <Link
              to="/profile"
              className="mt-4 px-6 py-2.5 bg-[#F59E0B] text-[#050B1A] font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider rounded-full hover:opacity-90 transition shadow-sm"
            >
              Profile Git
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="font-['Newsreader'] text-2xl font-bold text-white">Doğrulama Başarısız</h2>
            <p className="text-sm text-[#ffb4ab]">{message}</p>
            <Link
              to="/profile"
              className="mt-4 px-6 py-2.5 bg-[#272a2c] text-white border border-[#45464c] font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider rounded-full hover:border-[#F59E0B] transition shadow-sm"
            >
              Yeniden Dene
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}