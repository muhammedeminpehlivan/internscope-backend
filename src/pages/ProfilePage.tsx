import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Internship } from '../domain/types'
import { userService } from '../services/userService'
import { internshipService } from '../services/internshipService'
import { lookupService } from '../services/lookupService'
import apiClient from '../services/apiClient'

interface ProfileInternshipCard extends Internship {
  companyName: string
  companyInitials: string
  role: string
  dateRange: string
  workDays: string
  rejectReason?: string
}

function normalizeInternshipStatus(status: unknown): Internship['status'] {
  const normalizedStatus = String(status || '').toLowerCase()
  if (normalizedStatus === 'approved') return 'Approved'
  if (normalizedStatus === 'rejected') return 'Rejected'
  return 'Pending'
}

function calculateDuration(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return 'Süre belirtilmemiş'
  const start = new Date(startDate)
  const end = new Date(endDate)
  const duration = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  return duration > 0 ? `${duration} gün` : 'Süre belirtilmemiş'
}

function getSchoolEmailFromApi(data: any) {
  const values = [
    data?.studentEmail,
    data?.universityEmail,
    data?.schoolEmail,
    data?.eduEmail,
    data?.email,
  ]

  const schoolEmail = values.find((value): value is string => {
    if (typeof value !== 'string') return false
    const trimmed = value.trim()
    return trimmed.length > 0 && trimmed.toLowerCase().endsWith('.edu.tr')
  })

  return schoolEmail ? schoolEmail.trim() : ''
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'internships'>('profile')

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [university, setUniversity] = useState('')
  const [department, setDepartment] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl || '')
  const [linkedInProfileUrl, setLinkedInProfileUrl] = useState('')
  const [universities, setUniversities] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [eduEmail, setEduEmail] = useState('') // LinkedIn maili kesinlikle çekilmez

  const [isMailSent, setIsMailSent] = useState(false)
  const [isVerified, setIsVerified] = useState(user?.isEmailVerified || false)
  const [isSendingMail, setIsSendingMail] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [internships, setInternships] = useState<ProfileInternshipCard[]>([])
  const [isLoadingInternships, setIsLoadingInternships] = useState(true)
  const [deletingInternshipId, setDeletingInternshipId] = useState<string | null>(null)
  const [internshipPage, setInternshipPage] = useState(1)

  const internshipsPerPage = 5
  const internshipPageCount = Math.max(1, Math.ceil(internships.length / internshipsPerPage))
  const visibleInternships = internships.slice(
    (internshipPage - 1) * internshipsPerPage,
    internshipPage * internshipsPerPage,
  )

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName)
    }

    const fetchUserData = async () => {
      try {
        const [res, universitiesRes, departmentsRes] = await Promise.all([
          userService.getCurrentUser(),
          lookupService.getUniversities(),
          lookupService.getDepartments(),
        ])
        setUniversities(universitiesRes.data || [])
        setDepartments(departmentsRes.data || [])
        console.log('getCurrentUser response:', res.data)
        if (res.data) {
          if (res.data.fullName) setFullName(res.data.fullName)
          if (res.data.profilePictureUrl) setProfilePictureUrl(res.data.profilePictureUrl)
          if (res.data.linkedInProfileUrl) setLinkedInProfileUrl(res.data.linkedInProfileUrl)
          if (res.data.universityName || res.data.universityId) {
            const uniName = res.data.universityName
            const matchedUni = (universitiesRes.data || []).find((u: any) => u.name === uniName)
            if (matchedUni) setUniversity(matchedUni.id)
            else if (res.data.universityId) setUniversity(res.data.universityId)
          }
          if (res.data.departmentName || res.data.departmentId) {
            const deptName = res.data.departmentName
            const matchedDept = (departmentsRes.data || []).find((d: any) => d.name === deptName)
            if (matchedDept) setDepartment(matchedDept.id)
            else if (res.data.departmentId) setDepartment(res.data.departmentId)
          }
          if (res.data.isEmailVerified !== undefined) setIsVerified(res.data.isEmailVerified)

          const schoolEmail = getSchoolEmailFromApi(res.data)
          if (schoolEmail) {
            setEduEmail(schoolEmail)
          } else if (!eduEmail && res.data.isEmailVerified && typeof res.data.email === 'string' && res.data.email.toLowerCase().endsWith('.edu.tr')) {
            setEduEmail(res.data.email.trim())
          }
        }
      } catch (err) {
        console.warn('/user/me çağrısı yapılamadı, yerel oturum kullanılıyor.')
      }
    }

    const fetchUserInternships = async () => {
      try {
        setIsLoadingInternships(true)
        const [mineRes, changesRes] = await Promise.all([
          internshipService.getMine(),
          apiClient.get('/admin/pending-changes').catch(() => ({ data: [] }))
        ])

        if (mineRes.data && Array.isArray(mineRes.data)) {
          // Pending-changes'ten benim staj'larımın güncel versiyonlarını bul
          const pendingChanges = (changesRes.data || []).reduce((acc: any, change: any) => {
            if (Object.keys(change.proposed || {}).length > 0 && change.current?.id) {
              acc[change.current.id] = change.proposed
            }
            return acc
          }, {})

          // Sadece getMine()'den gelen item'ları kullan (pending-changes merge edilsin ama duplicate olmasın)
          const formatted = mineRes.data.map((item: any) => {
            // Pending-changes'te güncel versiyonu varsa onu kullan
            const proposed = pendingChanges[item.id]
            const dataToUse = proposed ? { ...item, ...proposed } : item
            const status = normalizeInternshipStatus(item.status)
            const displayStatus: Internship['status'] = status === 'Rejected' ? 'Rejected' : proposed ? 'Pending' : status
            const rejectionReason = dataToUse.rejectionReason
              || dataToUse.rejectReason
              || dataToUse.rejectionMessage
              || dataToUse.reason
              || dataToUse.rejection?.reason
              || dataToUse.rejection?.message

            return {
              id: dataToUse.id,
              userId: dataToUse.userId,
              companyId: dataToUse.companyId,
              universityId: dataToUse.universityId,
              departmentId: dataToUse.departmentId,
              companyDepartment: dataToUse.companyDepartment,
              startDate: dataToUse.startDate,
              endDate: dataToUse.endDate,
              isAnonymous: dataToUse.isAnonymous,
              isSgkVerified: dataToUse.isSgkVerified,
              status: displayStatus,
              companyName: dataToUse.companyName || 'Şirket',
              companyInitials: (dataToUse.companyName || 'Ş')[0]?.toUpperCase() || 'Ş',
              role: dataToUse.companyDepartment || 'Pozisyon Belirtilmedi',
              dateRange: `${new Date(dataToUse.startDate).toLocaleDateString('tr-TR')} - ${new Date(dataToUse.endDate).toLocaleDateString('tr-TR')}`,
              workDays: calculateDuration(dataToUse.startDate, dataToUse.endDate),
              rejectReason: rejectionReason,
            }
          })
          setInternships(formatted)
          setInternshipPage(1)
        }
      } catch (err) {
        console.warn('/internship/mine çağrısı yapılamadı:', err)
        setInternships([])
      } finally {
        setIsLoadingInternships(false)
      }
    }

    fetchUserData()
    fetchUserInternships()
  }, [user])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setErrorMessage('')
    try {
      const selectedUniversity = universities.find((item: any) => item.name === university || item.id === university)
      const selectedDepartment = departments.find((item: any) => item.name === department || item.id === department)
      const payload = {
        universityId: selectedUniversity?.id,
        departmentId: selectedDepartment?.id,
        linkedInProfileUrl: linkedInProfileUrl.trim(),
      }
      console.log('Gönderilen payload:', payload)
      const response = await userService.updateProfile(payload)
      console.log('Backend response:', response)
      // State'i response'tan gelen veriler ile güncelle
      if (response.data?.universityId) {
        setUniversity(response.data.universityId)
      }
      if (response.data?.departmentId) {
        setDepartment(response.data.departmentId)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Profil güncelleme hatası:', err)
      setErrorMessage('Profil kaydedilemedi. Lütfen tekrar deneyin.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteInternship = async (id: string) => {
    if (!window.confirm('Bu staj kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return

    setDeletingInternshipId(id)
    try {
      await internshipService.remove(id)
      setInternships((current) => current.filter((internship) => internship.id !== id))
      setInternshipPage((currentPage) => Math.min(currentPage, Math.max(1, Math.ceil((internships.length - 1) / internshipsPerPage))))
    } catch (error) {
      console.error('Staj silinemedi:', error)
      setErrorMessage('Staj kaydı silinemedi. Lütfen tekrar deneyin.')
    } finally {
      setDeletingInternshipId(null)
    }
  }

  // Swagger/Backend .NET JSON formatına uygun: { studentEmail: "..." }
const handleSendVerificationEmail = async () => {
    setErrorMessage('')
    setIsMailSent(false)
    const targetEmail = eduEmail.trim()

    if (!targetEmail) {
      setErrorMessage('Lütfen üniversite e-posta adresinizi giriniz.')
      return
    }

    if (!targetEmail.toLowerCase().endsWith('.edu.tr')) {
      setErrorMessage('Lütfen .edu.tr uzantılı üniversite e-posta adresinizi giriniz.')
      return
    }

    const token = localStorage.getItem('token') || localStorage.getItem('authToken')

    if (!token) {
      setErrorMessage('Oturum süreniz dolmuş. Lütfen tekrar giriş yapınız.')
      return
    }

    setIsSendingMail(true)

    try {
      await userService.sendVerificationEmail(targetEmail)

      setIsMailSent(true)
    } catch (error: any) {
      console.error('Mail gönderme hatası:', error)
      const msg =
        error.response?.data?.errors?.studentEmail?.[0] ||
        error.response?.data?.message ||
        error.response?.data?.title ||
        (error.response?.status === 401 ? 'Oturum geçersiz (401). Lütfen tekrar giriş yapın.' : 'E-posta gönderilemedi.')
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setIsSendingMail(false)
    }
  }

  return (
    <main className="w-full pt-6 bg-[#050B1A] min-h-screen text-white font-['Inter']">
      <div className="flex flex-col w-full px-6 sm:px-10 pb-12 max-w-[1200px] mx-auto gap-8">
        
        {/* Üst Profil Başlığı */}
        <div className="flex items-center justify-between border-b border-[#45464c]/30 pb-6 pt-4 flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#1d2022] flex items-center justify-center shadow-sm relative border border-[#909097]/20">
              {profilePictureUrl ? (
                <img className="h-full w-full rounded-full object-cover" src={profilePictureUrl} alt={fullName || 'Profil fotoğrafı'} />
              ) : (
                <span className="material-symbols-outlined text-white text-[54px]">person</span>
              )}
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#F8FAFC] border border-[#909097]/20 rounded-full flex items-center justify-center -rotate-6 shadow-sm">
                <span className="material-symbols-outlined text-[#F59E0B] text-[16px]">school</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="font-['Newsreader'] text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {fullName || 'Öğrenci Profili'}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap text-xs sm:text-sm">
                <span className="font-['IBM_Plex_Mono'] text-[#c6c6cd] uppercase tracking-widest border-r border-[#45464c]/30 pr-3">
                  ROL: {user?.role || 'Student'}
                </span>
                <span className="text-[#c6c6cd]">
                  {university && department
                    ? `${university}, ${department}`
                    : 'Öğrenim bilgileri henüz girilmedi'}
                </span>
              </div>
            </div>
          </div>

          {/* Profil Sayfası Çıkış Yap Butonu */}
          <button
            onClick={() => {
              localStorage.clear()
              window.location.href = import.meta.env.BASE_URL

            }}
            className="flex items-center gap-1.5 px-4 py-2 border border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Çıkış Yap
          </button>
        </div>

        
        {/* Sekmeler */}
        <div className="w-full">
          <div className="flex items-center gap-8 border-b border-[#45464c]/30 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`font-['Newsreader'] text-xl pb-3 border-b-2 flex items-center gap-2 transition ${
                activeTab === 'profile'
                  ? 'border-[#F59E0B] text-white font-semibold'
                  : 'border-transparent text-[#c6c6cd] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">badge</span>
              Profil Bilgileri
            </button>
            <button
              onClick={() => setActiveTab('internships')}
              className={`font-['Newsreader'] text-xl pb-3 border-b-2 flex items-center gap-2 transition ${
                activeTab === 'internships'
                  ? 'border-[#F59E0B] text-white font-semibold'
                  : 'border-transparent text-[#c6c6cd] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">work_history</span>
              Stajlarım
              <span className="bg-[#1d2022] text-white font-['IBM_Plex_Mono'] text-xs px-2 py-0.5 rounded-full ml-1">
                {internships.length}
              </span>
            </button>
          </div>

          {/* 1. SEKME: Profil Formu */}
          {activeTab === 'profile' && (
            <div className="bg-[#1d2022] border border-[#909097]/20 p-6 sm:p-8 relative rounded-sm">
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-['Newsreader'] text-2xl font-bold text-white">Öğrenci Detayları</h2>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#F8FAFC] text-[#050B1A] font-bold rounded-full font-['IBM_Plex_Mono'] text-xs hover:bg-[#F59E0B] transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {saveSuccess ? 'check' : 'save'}
                  </span>
                  {isSaving ? 'KAYDEDİLİYOR...' : saveSuccess ? 'KAYDEDİLDİ' : 'KAYDET'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ad Soyad */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] uppercase tracking-wider flex items-center gap-1">
                    Ad Soyad
                    <span className="text-[10px] text-[#F59E0B] font-sans">(LinkedIn'den Alındı)</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="bg-[#272a2c] border border-[#45464c] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>

                {/* Üniversite */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] uppercase tracking-wider">
                    Üniversite
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="h-10 px-3 bg-[#272a2c] border border-[#45464c] rounded text-sm text-white appearance-none focus:outline-none focus:border-[#F59E0B] transition-colors cursor-pointer"
                  >
                    <option value="">Üniversite Seç...</option>
                    {universities.map((item: any) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bölüm */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] uppercase tracking-wider">
                    Bölüm
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-10 px-3 bg-[#272a2c] border border-[#45464c] rounded text-sm text-white appearance-none focus:outline-none focus:border-[#F59E0B] transition-colors cursor-pointer"
                  >
                    <option value="">Bölüm Seç...</option>
                    {departments.map((item: any) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LinkedIn Profili */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] uppercase tracking-wider">
                    LinkedIn Profil Linki
                  </label>
                  <input
                    type="url"
                    value={linkedInProfileUrl}
                    onChange={(event) => setLinkedInProfileUrl(event.target.value)}
                    placeholder="https://www.linkedin.com/in/kullanici-adin"
                    className="bg-[#272a2c] border border-[#45464c] rounded px-3 py-2.5 text-sm text-white placeholder-[#909097] focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>

                {/* Okul E-postası */}
                <div className="flex flex-col gap-2">
                  <label className="font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] uppercase tracking-wider">
                    Okul E-postası
                  </label>
                  <div className="bg-[#323537] p-4 border border-[#45464c] rounded flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#F59E0B] text-[20px]">
                        {isVerified ? 'verified' : 'mark_email_unread'}
                      </span>
                      <span className="font-['IBM_Plex_Mono'] text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                        {isVerified ? 'Doğrulandı' : 'Doğrulama Bekleniyor'}
                      </span>
                    </div>

                    <p className="text-xs text-[#c6c6cd] leading-relaxed">
                      "Doğrulanmış Öğrenci" rozeti almak için üniversite e-postanızı girip onay linki isteyiniz.
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="email"
                        value={eduEmail}
                        disabled={isVerified}
                        onChange={(e) => setEduEmail(e.target.value)}
                        placeholder="ogrenci@ogr.sakarya.edu.tr"
                        className="bg-[#1d2022] border border-[#45464c] rounded py-2 px-3 font-['IBM_Plex_Mono'] text-xs text-white placeholder-[#909097] flex-grow focus:outline-none focus:border-[#F59E0B]"
                      />
                      {!isVerified && (
                        <button
                          type="button"
                          onClick={handleSendVerificationEmail}
                          disabled={isSendingMail}
                          className="px-3.5 py-2 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded font-['IBM_Plex_Mono'] text-xs text-[#F59E0B] hover:bg-[#F59E0B]/25 uppercase tracking-wider whitespace-nowrap font-medium transition disabled:opacity-50"
                        >
                          {isSendingMail ? 'Gönderiliyor...' : 'Onay Linki Gönder'}
                        </button>
                      )}
                    </div>

                    {isMailSent && !isVerified && (
                      <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400 flex items-center gap-2 font-['IBM_Plex_Mono']">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Doğrulama bağlantısı e-posta adresinize iletildi. Lütfen gelen kutunuzu (ve Spam klasörünü) kontrol ediniz.
                      </div>
                    )}

                    {errorMessage && (
                      <div className="mt-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-400 flex items-center gap-2 font-['IBM_Plex_Mono']">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. SEKME: Stajlarım */}
          {activeTab === 'internships' && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h2 className="font-['Newsreader'] text-2xl font-bold text-white flex items-center gap-2">
                  Kayıtlı Stajlar
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
                </h2>
                <Link
                  to="/internship/new"
                  className="bg-[#F59E0B] text-[#050B1A] px-5 py-2 rounded-full font-['IBM_Plex_Mono'] text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  STAJ EKLE
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {visibleInternships.map((item) => (
                  <div key={item.id} className="bg-[#1d2022] border border-[#909097]/20 p-5 relative rounded-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-[#272a2c] border border-[#909097]/20 rounded flex flex-col items-center justify-center shrink-0">
                        <span className="font-['Newsreader'] text-xl font-bold text-white">{item.companyInitials}</span>
                        <span className="font-['IBM_Plex_Mono'] text-[9px] text-[#909097]">CORP</span>
                      </div>

                      <div className="flex flex-col gap-1 flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-['Newsreader'] text-xl font-semibold text-white truncate">{item.companyName}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/internship/${item.id}/edit`}
                              className="px-3 py-1.5 bg-[#272a2c] text-[#c0c6db] border border-[#45464c] rounded font-['IBM_Plex_Mono'] text-xs hover:bg-[#323537] hover:border-[#F59E0B] transition whitespace-nowrap flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              Düzenle
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteInternship(String(item.id))}
                              disabled={deletingInternshipId === String(item.id)}
                              className="px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded font-['IBM_Plex_Mono'] text-xs hover:bg-rose-500/20 transition whitespace-nowrap flex items-center gap-1 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              {deletingInternshipId === String(item.id) ? 'Siliniyor...' : 'Sil'}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {item.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full font-['IBM_Plex_Mono'] text-xs border border-green-500/30">
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              Onaylandı
                            </span>
                          )}
                          {item.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-['IBM_Plex_Mono'] text-xs border border-amber-500/30">
                              <span className="material-symbols-outlined text-[14px]">pending</span>
                              İnceleniyor
                            </span>
                          )}
                          {item.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-400 px-2.5 py-0.5 rounded-full font-['IBM_Plex_Mono'] text-xs border border-rose-500/30">
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              Reddedildi
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-[#c6c6cd] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#909097]">work</span>
                          {item.role}
                        </div>

                        <div className="flex items-center gap-6 mt-2 text-xs font-['IBM_Plex_Mono']">
                          <div>
                            <span className="text-[#909097] uppercase mr-1">Tarih:</span>
                            <span className="text-white">{item.dateRange}</span>
                          </div>
                          <div>
                            <span className="text-[#909097] uppercase mr-1">Süre:</span>
                            <span className="text-white">{item.workDays}</span>
                          </div>
                        </div>

                        {item.rejectReason && (
                          <div className="mt-3 rounded border border-rose-500/25 bg-rose-500/10 px-3 py-2">
                            <div className="mb-1 flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-[10px] font-bold uppercase tracking-wider text-rose-300">
                              <span className="material-symbols-outlined text-[14px]">info</span>
                              Red Nedeni
                            </div>
                            <p className="font-['IBM_Plex_Mono'] text-xs leading-5 text-[#ffb4ab]">
                            {item.rejectReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {internshipPageCount > 1 && (
                <nav className="flex items-center justify-center gap-2 pt-2" aria-label="Staj sayfaları">
                  <button
                    type="button"
                    onClick={() => setInternshipPage((page) => Math.max(1, page - 1))}
                    disabled={internshipPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded border border-[#45464c] text-[#c6c6cd] transition hover:border-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Önceki sayfa"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  {Array.from({ length: internshipPageCount }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setInternshipPage(page)}
                      className={`flex h-9 min-w-9 items-center justify-center rounded border px-2 font-['IBM_Plex_Mono'] text-xs transition ${internshipPage === page ? 'border-[#F59E0B] bg-[#F59E0B] text-[#050B1A]' : 'border-[#45464c] text-[#c6c6cd] hover:border-[#F59E0B]'}`}
                      aria-current={internshipPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setInternshipPage((page) => Math.min(internshipPageCount, page + 1))}
                    disabled={internshipPage === internshipPageCount}
                    className="flex h-9 w-9 items-center justify-center rounded border border-[#45464c] text-[#c6c6cd] transition hover:border-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Sonraki sayfa"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}