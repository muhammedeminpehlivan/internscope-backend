import { useState, useEffect } from 'react'
import { adminService } from '../services/adminService'
import { lookupService } from '../services/lookupService'
import apiClient from '../services/apiClient'

interface InternshipChange {
  classChanged?: boolean
  current: {
    id: string
    companyName: string
    departmentName: string
    companyDepartment?: string
    universityName: string
    cityName?: string
    stipendMin?: number
    stipendMax?: number
    currency?: string
    returnOfferReceived?: boolean
    realAuthorName: string
    authorEmail: string
    term: string
    startDate?: string
    endDate?: string
    isAnonymous: boolean
    isSgkVerified: boolean
    status: string
    interview?: any
    scores?: any
  }
  proposed: {
    companyName?: string
    departmentName?: string
    companyDepartment?: string
    universityName?: string
    cityName?: string
    stipendMin?: number
    stipendMax?: number
    currency?: string
    returnOfferReceived?: boolean
    term?: string
    startDate?: string
    endDate?: string
    isAnonymous?: boolean
    interview?: any
    scores?: any
  }
}

interface PendingInternship extends InternshipChange {}

function normalizeChanges(changes: any[], universities: any[], departments: any[]): InternshipChange[] {
  return changes.map((item) => {
    const current = item.current || item.original || item.internship || item
    const proposed = item.proposed || item.proposedChanges || {}
    const currentClass = current.companyDepartment ?? current.grade ?? current.className
    const proposedClass = proposed.companyDepartment ?? proposed.grade ?? proposed.className
    const classChanged = currentClass !== undefined && proposedClass !== undefined && String(currentClass).trim() !== String(proposedClass).trim()
    const university = universities.find((entry) => entry.id === proposed.universityId)
    const department = departments.find((entry) => entry.id === proposed.departmentId)

    return {
      ...item,
      classChanged,
      current: {
        ...current,
        companyDepartment: currentClass,
        term: normalizeTerm(current.term || current.internshipType),
      },
      proposed: {
        ...proposed,
        companyDepartment: proposedClass,
        term: normalizeTerm(proposed.term || proposed.internshipType),
        universityName: proposed.universityName || university?.name,
        departmentName: proposed.departmentName || department?.name,
      },
    }
  })
}

function getResponseItems(response: any) {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.items)) return response.data.items
  return []
}

function hasProposedChanges(item: any) {
  const proposed = item.proposed || item.proposedChanges || {}
  return Object.keys(proposed).length > 0
}

function formatTerm(term?: string) {
  if (term === 'LongTerm') return 'Uzun Dönem'
  if (term === 'ShortTerm') return 'Kısa Dönem'
  return term || '-'
}

function normalizeTerm(term: unknown) {
  const value = String(term || '').trim().toLocaleLowerCase('tr-TR')
  if (value === 'longterm' || value === 'uzun' || value === 'uzun dönem') return 'LongTerm'
  if (value === 'shortterm' || value === 'kisa' || value === 'kısa' || value === 'kısa dönem') return 'ShortTerm'
  return term
}

function valuesEqual(first: unknown, second: unknown) {
  if (first === null || first === undefined || first === '') first = null
  if (second === null || second === undefined || second === '') second = null
  if (typeof first === 'string' && typeof second === 'string') {
    return first.trim().split('T')[0] === second.trim().split('T')[0]
  }
  if (typeof first === 'object' && typeof second === 'object') {
    const firstObject = first as Record<string, unknown>
    const secondObject = second as Record<string, unknown>
    const keys = new Set([...Object.keys(firstObject), ...Object.keys(secondObject)])
    return [...keys].every((key) => valuesEqual(firstObject[key], secondObject[key]))
  }
  return first === second || String(first) === String(second)
}

function hasActualChanges(current: Record<string, any>, proposed: Record<string, any>) {
  return Object.entries(proposed).some(([key, value]) => {
    if (current[key] === undefined) return false
    if (key === 'term') return normalizeTerm(current[key]) !== normalizeTerm(value)
    return !valuesEqual(current[key], value)
  })
}

function mergePendingItems(pendingItems: PendingInternship[], changesItems: PendingInternship[]) {
  const itemsById = new Map<string, PendingInternship>()
  pendingItems.forEach((item) => itemsById.set(String(item.current.id), item))
  changesItems.forEach((item) => itemsById.set(String(item.current.id), item))
  return Array.from(itemsById.values())
}

function hasChangedField(current: unknown, proposed: unknown) {
  return current !== undefined && proposed !== undefined && !valuesEqual(current, proposed)
}

export default function AdminDashboard() {
  const [items, setItems] = useState<PendingInternship[]>([])
  const [approvedCount, setApprovedCount] = useState(0)
  const [rejectedCount, setRejectedCount] = useState(0)
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())

  const [activeRejectId, setActiveRejectId] = useState<number | string | null>(null)
  const [rejectReasonInput, setRejectReasonInput] = useState('')
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const [pendingRes, changesRes, universitiesRes, departmentsRes, allRes] = await Promise.allSettled([
          adminService.getPendingInternships(),
          apiClient.get('/admin/pending-changes'),
          lookupService.getUniversities(),
          lookupService.getDepartments(),
          adminService.getAllInternships(),
        ])
        const pendingData = pendingRes.status === 'fulfilled' ? getResponseItems(pendingRes.value) : []
        const changesData = changesRes.status === 'fulfilled' ? getResponseItems(changesRes.value) : []
        const universities = universitiesRes.status === 'fulfilled' ? getResponseItems(universitiesRes.value) : []
        const departments = departmentsRes.status === 'fulfilled' ? getResponseItems(departmentsRes.value) : []
        const allInternships = allRes.status === 'fulfilled' ? getResponseItems(allRes.value) : []
        setApprovedCount(allInternships.filter((item: any) => item.status?.toLowerCase() === 'approved').length)
        setRejectedCount(allInternships.filter((item: any) => item.status?.toLowerCase() === 'rejected').length)
        // Pending: yeni stajlar (normal internship nesnesi) → { current, proposed } formatına çevir
        const pendingItems = pendingData.map((item: any) => ({
          current: item,
          proposed: {}
        }))
        // Changes: güncellenmiş stajlar (proposed boş olmayan)
        const changesItems = normalizeChanges(changesData.filter(hasProposedChanges), universities, departments)
        const allPending = mergePendingItems(pendingItems, changesItems)
        if (allPending.length > 0) setItems(allPending)
      } catch (err: any) {
        console.error('Admin API hatası:', err.message)
        console.error('Error status:', err.response?.status)
      }
    }
    fetchPending()
  }, [])

  const refetchPending = async () => {
    try {
      const [pendingRes, changesRes, universitiesRes, departmentsRes, allRes] = await Promise.allSettled([
        adminService.getPendingInternships(),
        apiClient.get('/admin/pending-changes'),
        lookupService.getUniversities(),
        lookupService.getDepartments(),
        adminService.getAllInternships(),
      ])
      const pendingData = pendingRes.status === 'fulfilled' ? getResponseItems(pendingRes.value) : []
      const changesData = changesRes.status === 'fulfilled' ? getResponseItems(changesRes.value) : []
      const universities = universitiesRes.status === 'fulfilled' ? getResponseItems(universitiesRes.value) : []
      const departments = departmentsRes.status === 'fulfilled' ? getResponseItems(departmentsRes.value) : []
      const allInternships = allRes.status === 'fulfilled' ? getResponseItems(allRes.value) : []
      setApprovedCount(allInternships.filter((item: any) => item.status?.toLowerCase() === 'approved').length)
      setRejectedCount(allInternships.filter((item: any) => item.status?.toLowerCase() === 'rejected').length)
      // Pending: yeni stajlar (normal internship) → { current, proposed } formatına çevir
      const pendingItems = pendingData.map((item: any) => ({
        current: item,
        proposed: {}
      }))
      // Changes: güncellenmiş stajlar (proposed boş olmayan)
      const changesItems = normalizeChanges(changesData.filter(hasProposedChanges), universities, departments)
      const allPending = mergePendingItems(pendingItems, changesItems)
      if (allPending.length > 0) setItems(allPending)
      else setItems([])
    } catch (err) {
      console.error('Refetch hatası:', err)
    }
  }

  const handleApprove = async (id: number | string) => {
    const item = items.find((entry) => entry.current.id === id)
    const isChange = !!item && Object.keys(item.proposed || {}).length > 0

    try {
      if (isChange) {
        await adminService.approveChanges(String(id))
      } else {
        await adminService.approveInternship(String(id))
      }
      await refetchPending()
    } catch (e: any) {
      console.error('Onay işlemi başarısız:', e.response?.data || e.message)
      window.alert('Onay işlemi başarısız oldu. Kayıt listeden kaldırılmadı.')
    }
  }

  const handleConfirmReject = async (id: number | string) => {
    const item = items.find((entry) => entry.current.id === id)
    const isChange = !!item && Object.keys(item.proposed || {}).length > 0

    try {
      if (isChange) {
        await adminService.rejectChanges(String(id), rejectReasonInput)
      } else {
        await adminService.rejectInternship(String(id), rejectReasonInput)
      }
      await refetchPending()
    } catch (e: any) {
      console.error('Red işlemi başarısız:', e.response?.data || e.message)
      window.alert('Red işlemi başarısız oldu. Kayıt listeden kaldırılmadı.')
    }
    setActiveRejectId(null)
    setRejectReasonInput('')
  }

  return (
    <main className="w-full pt-6 bg-[#101415] min-h-screen text-[#e0e3e5] font-['Inter']">
      <div className="flex flex-col w-full px-6 sm:px-10 gap-8 pb-12 max-w-[1200px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pt-6 border-b-2 border-[#1E293B] pb-4">
          <div className="flex flex-col gap-1">
            <span className="font-['IBM_Plex_Mono'] text-xs text-[#F59E0B] uppercase tracking-[0.2em]">Yönetim Paneli</span>
            <h1 className="font-['Newsreader'] text-4xl font-bold text-[#e0e3e5]">Onay Bekleyen Stajlar</h1>
          </div>
          <div className="flex gap-3 items-center font-['IBM_Plex_Mono'] text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#272a2c] rounded border border-[#1E293B]">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></div>
              <span className="text-[#e0e3e5]">{items.length} Bekleyen İşlem</span>
            </div>
          </div>
        </div>

        {/* Data Grid Layout */}
        <div className="flex flex-col gap-4">
          <div className="hidden md:grid grid-cols-12 gap-6 font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] uppercase tracking-wider pb-2 border-b border-[#1E293B]">
            <div className="col-span-3">Öğrenci &amp; Şirket</div>
            <div className="col-span-2">Departman</div>
            <div className="col-span-2">Tarih Aralığı</div>
            <div className="col-span-2">Puan</div>
            <div className="col-span-3 text-right">Aksiyonlar</div>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-4 text-[#c6c6cd] border border-dashed border-[#1E293B] p-8 rounded">
              <span className="material-symbols-outlined text-[48px] opacity-50">task_alt</span>
              <h3 className="font-['Newsreader'] text-2xl font-bold text-white">Tüm işlemler tamamlandı</h3>
              <p className="text-sm">Onay bekleyen başka staj kaydı bulunmuyor.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((row) => {
                const companyChanged = row.proposed.companyName && row.current.companyName !== row.proposed.companyName
                const gradeChanged = row.classChanged === true
                const dateRangeProposed = row.proposed.startDate
                  ? `${row.proposed.startDate} - ${row.proposed.endDate}`
                  : row.current.startDate
                    ? `${row.current.startDate} - ${row.current.endDate}`
                    : '—'

                return (
                <div
                  key={row.current.id}
                  onClick={() => setSelectedDetailId(row.current.id)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center p-4 bg-[#0b0f10] border border-[#1E293B] hover:border-[#F59E0B] transition-all relative overflow-hidden group cursor-pointer"
                >
                  <div className="col-span-1 md:col-span-3 flex flex-col">
                    <span className="font-['Newsreader'] text-lg text-white font-medium group-hover:text-[#c0c6db] transition-colors">{row.current.realAuthorName || 'Anonim'}</span>
                    <span className="font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">domain</span>
                      {companyChanged ? (
                        <span><s>{row.current.companyName}</s> → {row.proposed.companyName}</span>
                      ) : (
                        row.current.companyName
                      )}
                    </span>
                  </div>

                  <div className="col-span-1 md:col-span-2 text-sm text-[#e0e3e5]">
                    {gradeChanged
                      ? `${row.current.companyDepartment || '-'} → ${row.proposed.companyDepartment}`
                      : row.proposed.departmentName && row.proposed.departmentName !== row.current.departmentName
                      ? `${row.current.departmentName} → ${row.proposed.departmentName}`
                      : row.current.departmentName}
                  </div>
                  <div className="col-span-1 md:col-span-2 font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd]">
                    {dateRangeProposed}
                  </div>

                  <div className="col-span-1 md:col-span-2 flex items-center gap-1 text-[#F59E0B]">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
                    <span className="font-['IBM_Plex_Mono'] text-xs font-bold">{hasActualChanges(row.current, row.proposed) ? 'Değişim Var' : 'Onay Bekle'}</span>
                  </div>

                  <div className="col-span-1 md:col-span-3 flex justify-start md:justify-end gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleApprove(row.current.id)
                      }}
                      className="px-3.5 py-1.5 bg-[#700080]/15 border border-[#700080] text-[#fbaaff] font-['IBM_Plex_Mono'] text-xs rounded hover:bg-[#700080] hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      Onayla
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        setActiveRejectId(row.current.id)
                        setRejectReasonInput('')
                      }}
                      className="px-3.5 py-1.5 bg-transparent border border-[#1E293B] text-[#e0e3e5] font-['IBM_Plex_Mono'] text-xs rounded hover:border-[#ffb4ab] hover:text-[#ffb4ab] transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      Reddet
                    </button>
                  </div>


                  {/* Reddetme Satır İçi Açılır Formu */}
                  {activeRejectId === row.current.id && (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      className="absolute inset-0 bg-[#272a2c]/95 backdrop-blur-sm z-10 flex items-center justify-between px-4"
                    >
                      <div className="flex-1 max-w-2xl mx-auto flex gap-3 items-center w-full">
                        <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">warning</span>
                        <input
                          type="text"
                          value={rejectReasonInput}
                          onChange={(e) => setRejectReasonInput(e.target.value)}
                          placeholder="Red nedenini giriniz (Örn: Yetersiz değerlendirme detayı)..."
                          className="flex-1 bg-[#0b0f10] border border-[#1E293B] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ffb4ab]"
                        />
                        <button
                          onClick={() => setActiveRejectId(null)}
                          className="px-3 py-1.5 text-[#c6c6cd] hover:text-white font-['IBM_Plex_Mono'] text-xs uppercase"
                        >
                          İptal
                        </button>
                        <button
                          onClick={() => handleConfirmReject(row.current.id)}
                          className="px-4 py-1.5 bg-[#93000a] text-white font-['IBM_Plex_Mono'] text-xs rounded hover:bg-[#690005] transition-colors"
                        >
                          Kalıcı Olarak Reddet
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}

          {/* İstatistik Widget'ları */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#1d2022] border border-[#1E293B] relative overflow-hidden">
              <span className="font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] uppercase tracking-widest block mb-2">Toplam Onaylanan</span>
              <div className="font-['Newsreader'] text-4xl font-bold text-[#c0c6db] flex items-baseline gap-2">
                {approvedCount} <span className="text-sm font-['Inter'] text-[#c6c6cd]">staj</span>
              </div>
            </div>
            <div className="p-6 bg-[#1d2022] border border-[#1E293B] relative overflow-hidden">
              <span className="font-['IBM_Plex_Mono'] text-xs text-[#c6c6cd] uppercase tracking-widest block mb-2">Toplam Reddedilen</span>
              <div className="font-['Newsreader'] text-4xl font-bold text-[#ffb4ab] flex items-baseline gap-2">
                {rejectedCount} <span className="text-sm font-['Inter'] text-[#ffdad6]">staj</span>
              </div>
            </div>
            <div className="p-6 bg-[#1d2022] border border-[#1E293B] flex flex-col justify-center items-center text-center">
              <span className="material-symbols-outlined text-[32px] text-[#F59E0B] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-['Newsreader'] text-xl font-medium text-white">Arşiv Bütünlüğü</span>
              <span className="font-['IBM_Plex_Mono'] text-xs text-[#c0c6db] mt-1">Sistem Stabil</span>
            </div>
          </div>

          {/* Detail Modal */}
          {selectedDetailId && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#1d2022] border border-[#1E293B] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#1E293B] sticky top-0 bg-[#1d2022]">
                  <h2 className="font-['Newsreader'] text-2xl font-bold text-white">Staj Detayları</h2>
                  <button
                    onClick={() => setSelectedDetailId(null)}
                    className="text-[#c6c6cd] hover:text-white font-bold text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {items.find((i) => i.current.id === selectedDetailId) && (() => {
                    const data = items.find((i) => i.current.id === selectedDetailId)!
                    const hasChanges = hasActualChanges(data.current, data.proposed || {})
                    const current = data.current
                    const proposed = data.proposed || {}
                    const display = {
                      ...current,
                      ...proposed,
                      scores: { ...current.scores, ...proposed.scores },
                      interview: { ...current.interview, ...proposed.interview },
                    }

                    return (
                      <>
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-1">ÖĞRENCİ</p>
                            <p className="text-white font-semibold">{display.realAuthorName}</p>
                            <p className="text-xs text-[#c6c6cd] mt-1">{display.authorEmail}</p>
                          </div>
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-1">ŞİRKET</p>
                            <p className={`text-white font-semibold ${proposed.companyName && proposed.companyName !== current.companyName ? 'text-[#fbaaff]' : ''}`}>
                              {proposed.companyName || current.companyName}
                            </p>
                          </div>
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-1">ÜNİVERSİTE</p>
                            <p className={`font-semibold ${proposed.universityName && proposed.universityName !== current.universityName ? 'text-[#fbaaff]' : 'text-white'}`}>
                              {display.universityName}
                            </p>
                          </div>
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-1">BÖLÜM</p>
                            <p className={`font-semibold ${proposed.departmentName && proposed.departmentName !== current.departmentName ? 'text-[#fbaaff]' : 'text-white'}`}>
                              {display.departmentName}
                            </p>
                          </div>
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-1">ŞEHİR / TARİH</p>
                            <p className="text-white font-semibold">{display.cityName || '-'} | {display.startDate || '-'} - {display.endDate || '-'}</p>
                          </div>
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-1">STAJ TİPİ / SINIF</p>
                            <p className="text-white font-semibold">{formatTerm(display.term)} | {display.companyDepartment || '-'}</p>
                          </div>
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-1">İŞE DÖNÜŞ TEKLİFİ</p>
                            <p className="text-white font-semibold">
                              {display.returnOfferReceived ? 'Teklif Var' : 'Teklif Yok'}
                            </p>
                          </div>
                        </div>

                        {/* Scores */}
                        <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                          <p className="text-xs text-[#c6c6cd] mb-3 font-bold">PUANLAR</p>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div><p className="text-xs text-[#c6c6cd]">Öğrenme</p><p className="text-lg font-bold text-white">{display.scores?.learningScore}/5</p></div>
                            <div><p className="text-xs text-[#c6c6cd]">Mentoring</p><p className="text-lg font-bold text-white">{display.scores?.mentoringScore}/5</p></div>
                            <div><p className="text-xs text-[#c6c6cd]">Tech Altyapı</p><p className="text-lg font-bold text-white">{display.scores?.techInfraScore}/5</p></div>
                            <div><p className="text-xs text-[#c6c6cd]">Çalışma Ortamı</p><p className="text-lg font-bold text-white">{display.scores?.workEnvironmentScore}/5</p></div>
                            <div><p className="text-xs text-[#c6c6cd]">Maaş</p><p className="text-lg font-bold text-white">{display.scores?.salaryScore}/5</p></div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd]">Tavsiye: <span className={`font-bold ${display.scores?.wouldRecommend ? 'text-[#70c669]' : 'text-red-500'}`}>{display.scores?.wouldRecommend ? 'EVET' : 'HAYIR'}</span></p>
                          </div>
                        </div>

                        {/* Interview & Tips */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-2 font-bold">MÜLAKAT SÜRECİ</p>
                            <p className="text-sm text-white"><span className="text-[#c6c6cd]">Yöntem:</span> {display.interview?.applicationMethod || 'Yok'}</p>
                            <p className="text-sm text-white mt-1"><span className="text-[#c6c6cd]">Açıklama:</span> {display.interview?.description || 'Yok'}</p>
                          </div>
                          <div className="bg-[#0b0f10] p-4 rounded border border-[#1E293B]">
                            <p className="text-xs text-[#c6c6cd] mb-2 font-bold">EK ÖNERİLER</p>
                            <p className="text-sm text-white">{display.scores?.additionalTips || 'Ek öneri yok'}</p>
                          </div>
                        </div>

                        {/* Proposed Changes Highlight */}
                        {hasChanges && (
                          <div className="bg-[#fbaaff]/10 border-l-4 border-[#fbaaff] p-4 rounded">
                            <p className="text-xs text-[#fbaaff] font-bold mb-3">DEĞİŞKLİKLER</p>
                            <div className="space-y-2 text-sm">
                              {proposed.companyName && proposed.companyName !== current.companyName && (
                                <p className="text-[#fbaaff]">• Şirket: <s>{current.companyName}</s> → <strong>{proposed.companyName}</strong></p>
                              )}
                              {proposed.universityName && proposed.universityName !== current.universityName && (
                                <p className="text-[#fbaaff]">• Üniversite: <s>{current.universityName}</s> → <strong>{proposed.universityName}</strong></p>
                              )}
                              {proposed.departmentName && proposed.departmentName !== current.departmentName && (
                                <p className="text-[#fbaaff]">• Bölüm: <s>{current.departmentName}</s> → <strong>{proposed.departmentName}</strong></p>
                              )}
                              {hasChangedField(current.startDate, proposed.startDate) || hasChangedField(current.endDate, proposed.endDate) ? (
                                <p className="text-[#fbaaff]">• Tarih: {proposed.startDate} - {proposed.endDate}</p>
                              ) : null}
                              {data.classChanged && (
                                <p className="text-[#fbaaff]">• Sınıf / departman: <s>{current.companyDepartment || '-'}</s> → <strong>{proposed.companyDepartment}</strong></p>
                              )}
                              {hasChangedField(current.term, proposed.term) && (
                                <p className="text-[#fbaaff]">• Staj tipi: <s>{formatTerm(current.term)}</s> → <strong>{formatTerm(proposed.term)}</strong></p>
                              )}
                              {proposed.cityName && proposed.cityName !== current.cityName && (
                                <p className="text-[#fbaaff]">• Şehir: <s>{current.cityName || '-'}</s> → <strong>{proposed.cityName}</strong></p>
                              )}
                              {proposed.returnOfferReceived !== undefined && proposed.returnOfferReceived !== current.returnOfferReceived && (
                                <p className="text-[#fbaaff]">• İşe dönüş teklifi: <s>{current.returnOfferReceived ? 'Var' : 'Yok'}</s> → <strong>{proposed.returnOfferReceived ? 'Var' : 'Yok'}</strong></p>
                              )}
                              {proposed.scores && Object.keys(proposed.scores).map((key) => (
                                proposed.scores[key] !== current.scores?.[key] && (
                                  <p key={key} className="text-[#fbaaff]">• {key}: <s>{String(current.scores?.[key] ?? '-')}</s> → <strong>{String(proposed.scores[key])}</strong></p>
                                )
                              ))}
                              {proposed.interview?.applicationMethod && !valuesEqual(proposed.interview.applicationMethod, current.interview?.applicationMethod) && (
                                <p className="text-[#fbaaff]">• Başvuru yöntemi: <s>{current.interview?.applicationMethod || '-'}</s> → <strong>{proposed.interview.applicationMethod}</strong></p>
                              )}
                              {proposed.interview?.description && !valuesEqual(proposed.interview.description, current.interview?.description) && (
                                <p className="text-[#fbaaff]">• Mülakat açıklaması güncellendi</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => {
                            handleApprove(selectedDetailId)
                            setSelectedDetailId(null)
                          }}
                          className="flex-1 px-4 py-2 bg-[#700080] text-white font-['IBM_Plex_Mono'] text-sm rounded hover:bg-[#900000] transition-all"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => {
                            setActiveRejectId(selectedDetailId)
                            setSelectedDetailId(null)
                          }}
                          className="flex-1 px-4 py-2 bg-transparent border border-[#ffb4ab] text-[#ffb4ab] font-['IBM_Plex_Mono'] text-sm rounded hover:bg-[#ffb4ab]/10 transition-all"
                        >
                          Reddet
                        </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}