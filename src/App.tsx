import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import DiscoverPage from './pages/DiscoverPage'
import CompanyProfilePage from './pages/CompanyProfilePage'
import InternshipFormPage from './pages/InternshipFormPage'
import ProfilePage from './pages/ProfilePage'
import StatsPage from './pages/StatsPage'
import AdminDashboard from './pages/AdminDashboard'
import AuthCallbackPage from './pages/AuthCallbackPage'
import InternshipDetailPage from './pages/InternshipDetailPage'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B1A] flex items-center justify-center text-[#F8FAFC]">
        Yükleniyor...
      </div>
    )
  }

  return (
    <BrowserRouter basename="/stajin-website">
      <div className="min-h-screen bg-[#050B1A] text-[#F8FAFC] flex flex-col">
        {/* TÜM SİTENİN TEK VE ORTAK NAVBAR'I */}
        <Navbar />

        {/* Sayfa İçerikleri (Navbar 80px olduğu için pt-20 ile altından başlar) */}
        <div className="flex-1 pt-20">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/staj-arsivi" element={<DiscoverPage />} />
            <Route path="/company/:slug" element={<CompanyProfilePage />} />
            <Route path="/internship/:id" element={<InternshipDetailPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/istatistikler" element={<StatsPage />} />

            {/* Login Gerektiren Sayfalar */}
            {user ? (
              <>
                <Route path="/email-verify" element={<EmailVerificationPage />} />
                <Route path="/internship/new" element={<InternshipFormPage />} />
                <Route path="/internship/:id/edit" element={<InternshipFormPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                {user.role === 'Admin' && (
                  <Route path="/admin" element={<AdminDashboard />} />
                )}
              </>
            ) : (
              <>
                <Route path="/email-verify" element={<Navigate to="/" replace />} />
                <Route path="/internship/new" element={<Navigate to="/" replace />} />
                <Route path="/profile" element={<Navigate to="/" replace />} />
                <Route path="/admin" element={<Navigate to="/" replace />} />
              </>
            )}

            <Route path="*" element={<Navigate to="/discover" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}