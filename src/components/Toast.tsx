import { useEffect, useState } from 'react'

type ToastType = 'error' | 'success' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const TOAST_EVENT = 'app-toast'

// Herhangi bir yerden (React dışından da) toast göstermek için
export function showToast(message: string, type: ToastType = 'info') {
  if (!message) return
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }))
}

const STYLES: Record<ToastType, string> = {
  error: 'border-rose-500/40 bg-rose-50 text-rose-700',
  success: 'border-emerald-500/40 bg-emerald-50 text-emerald-700',
  info: 'border-outline-variant/50 bg-surface-container-lowest text-on-surface',
}

const ICONS: Record<ToastType, string> = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    let counter = 0
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { message: string; type: ToastType }
      const id = ++counter + Date.now()
      setToasts((current) => [...current, { id, message: detail.message, type: detail.type || 'info' }])
      window.setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id))
      }, 4000)
    }
    window.addEventListener(TOAST_EVENT, handler)
    return () => window.removeEventListener(TOAST_EVENT, handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 shadow-md font-['Plus_Jakarta_Sans'] text-sm ${STYLES[toast.type]}`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">{ICONS[toast.type]}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
            className="material-symbols-outlined text-[18px] shrink-0 opacity-60 hover:opacity-100"
            aria-label="Kapat"
          >
            close
          </button>
        </div>
      ))}
    </div>
  )
}
