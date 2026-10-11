import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'
import { notificationService } from '../services/notificationService'

interface NotificationItem {
  id: string
  type?: string
  message: string
  isRead: boolean
  internshipId?: string
  commentId?: string
  createdAt?: string
}

function formatNotificationDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Navbar() {
  const { user, isAuth } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [profilePicture, setProfilePicture] = useState('')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  const readNotifications = (data: any): NotificationItem[] => {
    const items = Array.isArray(data) ? data : data?.items || data?.data || []
    return Array.isArray(items) ? items : []
  }

  const loadUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount()
      const count = res.data?.count ?? res.data?.unreadCount ?? (typeof res.data === 'number' ? res.data : 0)
      setUnreadCount(Number(count) || 0)
    } catch {
      /* sessizce geç */
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getAll()
      setNotifications(readNotifications(res.data))
    } catch {
      /* sessizce geç */
    }
  }

  useEffect(() => {
    if (!isAuth) {
      setUnreadCount(0)
      setNotifications([])
      return
    }
    loadUnreadCount()
  }, [isAuth])

  const toggleNotifications = () => {
    const next = !notifOpen
    setNotifOpen(next)
    if (next) loadNotifications()
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    setNotifOpen(false)
    if (!item.isRead) {
      try {
        await notificationService.markRead(item.id)
        setNotifications((current) => current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)))
        setUnreadCount((count) => Math.max(0, count - 1))
      } catch {
        /* yut */
      }
    }
    if (item.internshipId) navigate(`/internship/${item.internshipId}`)
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications((current) => current.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      /* yut */
    }
  }

  useEffect(() => {
    if (!isAuth) {
      setProfilePicture('')
      return
    }
    setProfilePicture(user?.profilePictureUrl || '')
    userService
      .getCurrentUser()
      .then((res) => {
        if (res.data?.profilePictureUrl) setProfilePicture(res.data.profilePictureUrl)
      })
      .catch(() => {})
  }, [isAuth, user])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/landing'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#F8FAFC] border-b border-[#1E293B]/20 shadow-sm">
      <div className="h-20 max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-between">
        
        {/* Sol: Orijinal Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Staj'ın Logo"
              className="h-9 sm:h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>

        {/* Orta: Menü Sekmeleri */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`font-['Inter'] text-sm py-2 transition-all ${
              isActive('/')
                ? 'text-[#050B1A] font-bold border-b-2 border-[#700080]'
                : 'text-[#050B1A]/70 hover:text-[#050B1A]'
            }`}
          >
            Anasayfa
          </Link>

          <Link
            to="/discover"
            className={`font-['Inter'] text-sm py-2 transition-all ${
              isActive('/discover') || isActive('/staj-arsivi')
                ? 'text-[#050B1A] font-bold border-b-2 border-[#700080]'
                : 'text-[#050B1A]/70 hover:text-[#050B1A]'
            }`}
          >
            Staj Arşivi
          </Link>

          <Link
            to="/stats"
            className={`font-['Inter'] text-sm py-2 transition-all ${
              isActive('/stats') || isActive('/istatistikler')
                ? 'text-[#050B1A] font-bold border-b-2 border-[#700080]'
                : 'text-[#050B1A]/70 hover:text-[#050B1A]'
            }`}
          >
            İstatistikler
          </Link>

          {user?.role === 'Admin' && (
            <Link
              to="/admin"
              className={`font-['Inter'] text-sm py-2 transition-all ${
                isActive('/admin')
                  ? 'text-[#050B1A] font-bold border-b-2 border-[#700080]'
                  : 'text-[#050B1A]/70 hover:text-[#050B1A]'
              }`}
            >
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Sağ: Profilim / Giriş */}
        <div className="flex items-center gap-3">
          {isAuth && user ? (
            <>
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                aria-label="Bildirimler"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#050B1A]/70 hover:text-[#050B1A] hover:bg-[#050B1A]/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-[#1E293B]/15 bg-white shadow-xl">
                    <div className="sticky top-0 flex items-center justify-between border-b border-[#1E293B]/10 bg-white px-4 py-3">
                      <span className="font-['Inter'] text-sm font-semibold text-[#050B1A]">Bildirimler</span>
                      {unreadCount > 0 && (
                        <button type="button" onClick={handleMarkAllRead} className="font-['Inter'] text-xs text-[#0A66C2] hover:underline">Tümünü okundu yap</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center font-['Inter'] text-sm text-[#050B1A]/50">Bildirim yok</div>
                    ) : (
                      <ul>
                        {notifications.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => handleNotificationClick(n)}
                              className={`flex w-full gap-2 border-b border-[#1E293B]/5 px-4 py-3 text-left transition-colors hover:bg-[#050B1A]/5 ${n.isRead ? '' : 'bg-[#0A66C2]/5'}`}
                            >
                              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-[#0A66C2]'}`} />
                              <span className="min-w-0 flex-1">
                                <span className="block font-['Inter'] text-sm leading-snug text-[#050B1A]">{n.message}</span>
                                {n.createdAt && <span className="mt-0.5 block font-['Inter'] text-[11px] text-[#050B1A]/40">{formatNotificationDate(n.createdAt)}</span>}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
            <Link
              to="/internship/new"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-primary-container text-on-secondary rounded-lg transition-colors font-['Inter'] text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Deneyim Ekle</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-3 text-[#050B1A]/80 hover:text-[#050B1A] transition-colors group"
            >
              <span className="hidden sm:block font-['Inter'] text-sm font-medium">
                {user.fullName}
              </span>
              <div className="w-10 h-10 rounded-full bg-[#050B1A] flex items-center justify-center text-[#F8FAFC] shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                {profilePicture ? (
                  <img src={profilePicture} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
            </Link>
            </>
          ) : (
            <button
              onClick={() => {
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://internscope-backend.onrender.com'
                window.location.href = `${apiBaseUrl}/auth/login`
              }}
              className="flex items-center gap-2 px-5 py-2 bg-[#0A66C2] hover:bg-[#084399] text-white rounded-lg transition-colors font-['Inter'] text-sm font-medium group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
              <span>LinkedIn ile Giriş Yap</span>
            </button>
          )}
        </div>

      </div>
    </header>
  )
}