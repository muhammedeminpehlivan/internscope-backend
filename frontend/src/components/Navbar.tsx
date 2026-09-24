import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, isAuth } = useAuth()
  const location = useLocation()

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
            <Link
              to="/profile"
              className="flex items-center gap-3 text-[#050B1A]/80 hover:text-[#050B1A] transition-colors group"
            >
              <span className="hidden sm:block font-['Inter'] text-sm font-medium">
                Profilim
              </span>
              <div className="w-10 h-10 rounded-full bg-[#050B1A] flex items-center justify-center text-[#F8FAFC] shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </Link>
          ) : (
            <button
              onClick={() => {
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://internscope-backend.onrender.com/api'
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