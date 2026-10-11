import { useState, useEffect } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { adminService } from '../services/adminService'
import { lookupService } from '../services/lookupService'
import { internshipService } from '../services/internshipService'
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

const REPORT_REASON_LABELS: Record<string, string> = {
  Other: 'Diğer',
  Profanity: 'Küfür / Hakaret',
  Spam: 'Spam',
  Harassment: 'Taciz',
  Misinformation: 'Yanlış bilgi',
}

// Şikayet sebeplerini "Spam: 2 · Diğer: 1" biçiminde özetler (obje ya da dizi gelebilir)
function formatReportReasons(reasons: any): string {
  if (!reasons) return ''
  const counts: Record<string, number> = {}
  if (Array.isArray(reasons)) {
    reasons.forEach((r: any) => {
      const key = typeof r === 'string' ? r : r.reason || r.type || 'Other'
      const amount = typeof r === 'object' && r.count ? Number(r.count) : 1
      counts[key] = (counts[key] || 0) + amount
    })
  } else if (typeof reasons === 'object') {
    Object.entries(reasons).forEach(([key, value]) => { counts[key] = Number(value) || 0 })
  } else {
    return String(reasons)
  }
  return Object.entries(counts)
    .map(([key, value]) => `${REPORT_REASON_LABELS[key] || key}: ${value}`)
    .join(' · ')
}

// Şikayetli yorum nesnesini alan-adı belirsizliğine karşı savunmacı okur
function readReportedComment(c: any) {
  const notesRaw = c.notes ?? c.reportNotes
  const notes = Array.isArray(notesRaw) ? notesRaw.filter(Boolean) : notesRaw ? [notesRaw] : []
  return {
    id: c.commentId || c.id,
    content: c.content || c.commentText || c.text || '',
    author: c.authorName || c.userName || c.user?.fullName || c.author?.fullName || 'Anonim Öğrenci',
    companyName: c.companyName || c.company?.name || '-',
    companyDepartment: c.companyDepartment || c.departmentName || '',
    parentContent: c.parentContent || c.parent?.content || '',
    parentAuthorName: c.parentAuthorName || c.parent?.authorName || '',
    isHidden: !!c.isHidden,
    reasons: c.reasons ?? c.reportReasons,
    notes,
    date: c.createdAt ? formatDateTR(c.createdAt) : '',
  }
}

function formatWeekLabel(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}

function formatDateTR(value?: string) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Birden çok staj listesini id'ye göre birleştirir; boş/null alanlar dolu olanı ezmez
function buildEnrichmentSource(...sources: any[][]): any[] {
  const byId = new Map<string, any>()
  sources.forEach((list) => {
    ;(list || []).forEach((item: any) => {
      if (!item || item.id === undefined || item.id === null) return
      const key = String(item.id)
      const merged: any = { ...(byId.get(key) || {}) }
      Object.keys(item).forEach((k) => {
        const value = item[k]
        if (value !== undefined && value !== null && value !== '') merged[k] = value
        else if (!(k in merged)) merged[k] = value
      })
      byId.set(key, merged)
    })
  })
  return Array.from(byId.values())
}

function normalizeChanges(changes: any[], universities: any[], departments: any[], cities: any[] = [], allInternships: any[] = []): InternshipChange[] {
  return changes.map((item) => {
    const rawCurrent = item.current || item.original || item.internship || item
    const fullInternship: any = allInternships.find((entry) => String(entry.id) === String(rawCurrent.id)) || {}
    // Değişiklik kaydının "current" nesnesi eski değerleri taşımayabilir (ya da boş/null gönderebilir);
    // tam staj kaydından doldur — rawCurrent'taki boş alanlar fullInternship'i ezmesin
    const current: any = { ...fullInternship, ...rawCurrent }
    Object.keys(fullInternship).forEach((key) => {
      const value = (rawCurrent as any)[key]
      if (value === undefined || value === null || value === '') current[key] = fullInternship[key]
    })
    const proposed = item.proposed || item.proposedChanges || {}
    const currentClass = current.companyDepartment ?? current.grade ?? current.className
    const proposedClass = proposed.companyDepartment ?? proposed.grade ?? proposed.className
    const classChanged =
      proposedClass !== undefined &&
      proposedClass !== null &&
      String(proposedClass).trim() !== '' &&
      String(currentClass ?? '').trim() !== String(proposedClass).trim()
    const university = universities.find((entry) => entry.id === proposed.universityId)
    const department = departments.find((entry) => entry.id === proposed.departmentId)
    const city = cities.find((entry) => entry.id === current.cityId)
    const proposedCity = cities.find((entry) => entry.id === proposed.cityId)
    const currentCityName = city?.name || current.cityName || current.city || '-'

    return {
      ...item,
      classChanged,
      current: {
        ...current,
        companyDepartment: currentClass,
        term: normalizeTerm(current.term || current.internshipType),
        startDate: current.startDate ? current.startDate.split('T')[0] : current.startDate,
        endDate: current.endDate ? current.endDate.split('T')[0] : current.endDate,
        cityName: currentCityName,
      },
      proposed: {
        ...proposed,
        companyDepartment: proposedClass ?? currentClass,
        term: normalizeTerm(proposed.term || proposed.internshipType),
        universityName: proposed.universityName || university?.name,
        departmentName: proposed.departmentName || department?.name,
        startDate: proposed.startDate ? proposed.startDate.split('T')[0] : proposed.startDate,
        endDate: proposed.endDate ? proposed.endDate.split('T')[0] : proposed.endDate,
        cityName: proposed.cityName || proposedCity?.name || currentCityName,
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
  if (first !== null && second !== null && typeof first === 'object' && typeof second === 'object') {
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
  const [reportedComments, setReportedComments] = useState<any[]>([])
  const [reportedActionId, setReportedActionId] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const loadStats = async () => {
    try {
      const res = await adminService.getStats()
      setStats(res.data || null)
    } catch (err) {
      console.warn('İstatistikler alınamadı:', err)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const loadReportedComments = async () => {
    try {
      const res = await adminService.getReportedComments()
      const items = getResponseItems(res)
      setReportedComments(Array.isArray(items) ? items : [])
    } catch (err) {
      console.warn('Şikayetli yorumlar alınamadı:', err)
    }
  }

  useEffect(() => {
    loadReportedComments()
  }, [])

  const handleDeleteReported = async (commentId: string) => {
    if (!commentId) return
    if (!window.confirm('Bu yorumu kalıcı olarak kaldırmak istediğinize emin misiniz?')) return
    setReportedActionId(commentId)
    try {
      await adminService.deleteReportedComment(commentId)
      await loadReportedComments()
    } catch (err) {
      console.error('Yorum kaldırılamadı:', err)
      window.alert('Yorum kaldırılamadı.')
    } finally {
      setReportedActionId(null)
    }
  }

  const handleDismissReports = async (commentId: string) => {
    if (!commentId) return
    setReportedActionId(commentId)
    try {
      await adminService.dismissReports(commentId)
      await loadReportedComments()
    } catch (err) {
      console.error('Şikayetler yoksayılamadı:', err)
      window.alert('Şikayetler yoksayılamadı.')
    } finally {
      setReportedActionId(null)
    }
  }

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const [pendingRes, changesRes, universitiesRes, departmentsRes, citiesRes, allRes, publicRes] = await Promise.allSettled([
          adminService.getPendingInternships(),
          apiClient.get('/admin/pending-changes'),
          lookupService.getUniversities(),
          lookupService.getDepartments(),
          lookupService.getCities(),
          adminService.getAllInternships(),
          internshipService.getAll({ limit: 10000 }),
        ])
        const pendingData = pendingRes.status === 'fulfilled' ? getResponseItems(pendingRes.value) : []
        const changesData = changesRes.status === 'fulfilled' ? getResponseItems(changesRes.value) : []
        const universities = universitiesRes.status === 'fulfilled' ? getResponseItems(universitiesRes.value) : []
        const departments = departmentsRes.status === 'fulfilled' ? getResponseItems(departmentsRes.value) : []
        const cities = citiesRes.status === 'fulfilled' ? getResponseItems(citiesRes.value) : []
        const allInternships = allRes.status === 'fulfilled' ? getResponseItems(allRes.value) : []
        const publicInternships = publicRes.status === 'fulfilled' ? getResponseItems(publicRes.value) : []
        const enrichmentSource = buildEnrichmentSource(allInternships, publicInternships)
        setApprovedCount(allInternships.filter((item: any) => item.status?.toLowerCase() === 'approved').length)
        setRejectedCount(allInternships.filter((item: any) => item.status?.toLowerCase() === 'rejected').length)
        // Pending: yeni stajlar (normal internship nesnesi) → { current, proposed } formatına çevir
        const pendingItems = pendingData.map((item: any) => ({
          current: item,
          proposed: {}
        }))
        // Changes: güncellenmiş stajlar (proposed boş olmayan)
        const changesItems = normalizeChanges(changesData.filter(hasProposedChanges), universities, departments, cities, enrichmentSource)
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
      const [pendingRes, changesRes, universitiesRes, departmentsRes, citiesRes, allRes, publicRes] = await Promise.allSettled([
        adminService.getPendingInternships(),
        apiClient.get('/admin/pending-changes'),
        lookupService.getUniversities(),
        lookupService.getDepartments(),
        lookupService.getCities(),
        adminService.getAllInternships(),
        internshipService.getAll({ limit: 10000 }),
      ])
      const pendingData = pendingRes.status === 'fulfilled' ? getResponseItems(pendingRes.value) : []
      const changesData = changesRes.status === 'fulfilled' ? getResponseItems(changesRes.value) : []
      const universities = universitiesRes.status === 'fulfilled' ? getResponseItems(universitiesRes.value) : []
      const departments = departmentsRes.status === 'fulfilled' ? getResponseItems(departmentsRes.value) : []
      const cities = citiesRes.status === 'fulfilled' ? getResponseItems(citiesRes.value) : []
      const allInternships = allRes.status === 'fulfilled' ? getResponseItems(allRes.value) : []
      const publicInternships = publicRes.status === 'fulfilled' ? getResponseItems(publicRes.value) : []
      const enrichmentSource = buildEnrichmentSource(allInternships, publicInternships)
      setApprovedCount(allInternships.filter((item: any) => item.status?.toLowerCase() === 'approved').length)
      setRejectedCount(allInternships.filter((item: any) => item.status?.toLowerCase() === 'rejected').length)
      // Pending: yeni stajlar (normal internship) → { current, proposed } formatına çevir
      const pendingItems = pendingData.map((item: any) => ({
        current: item,
        proposed: {}
      }))
      // Changes: güncellenmiş stajlar (proposed boş olmayan)
      const changesItems = normalizeChanges(changesData.filter(hasProposedChanges), universities, departments, cities, enrichmentSource)
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
    <main className="w-full pt-6 bg-background min-h-screen text-on-surface font-body">
      <div className="flex flex-col w-full px-6 sm:px-10 gap-8 pb-12 max-w-[1200px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pt-6 border-b-2 border-outline-variant/40 pb-4">
          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-secondary uppercase tracking-[0.2em]">Yönetim Paneli</span>
            <h1 className="font-display text-4xl font-bold text-primary">Onay Bekleyen Stajlar</h1>
          </div>
          <div className="flex gap-3 items-center font-label text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded border border-outline-variant/40">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <span className="text-on-surface">{items.length} Bekleyen İşlem</span>
            </div>
          </div>
        </div>

        {/* Data Grid Layout */}
        <div className="flex flex-col gap-4">
          <div className="hidden md:grid grid-cols-12 gap-6 font-label text-xs text-on-surface-variant uppercase tracking-wider pb-2 border-b border-outline-variant/40">
            <div className="col-span-3">Öğrenci &amp; Şirket</div>
            <div className="col-span-2">Departman</div>
            <div className="col-span-2">Tarih Aralığı</div>
            <div className="col-span-2">Puan</div>
            <div className="col-span-3 text-right">Aksiyonlar</div>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-4 text-on-surface-variant border border-dashed border-outline-variant/40 p-8 rounded">
              <span className="material-symbols-outlined text-[48px] opacity-50">task_alt</span>
              <h3 className="font-display text-2xl font-bold text-primary">Tüm işlemler tamamlandı</h3>
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
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center p-4 bg-surface-container-low border border-outline-variant/40 hover:border-secondary transition-all relative overflow-hidden group cursor-pointer"
                >
                  <div className="col-span-1 md:col-span-3 flex flex-col">
                    <span className="font-display text-lg text-primary font-medium group-hover:text-primary transition-colors">{row.current.realAuthorName || 'Anonim'}</span>
                    <span className="font-label text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">domain</span>
                      {companyChanged ? (
                        <span><s>{row.current.companyName}</s> → {row.proposed.companyName}</span>
                      ) : (
                        row.current.companyName
                      )}
                    </span>
                  </div>

                  <div className="col-span-1 md:col-span-2 text-sm text-on-surface">
                    {gradeChanged
                      ? `${row.current.companyDepartment || '-'} → ${row.proposed.companyDepartment}`
                      : row.proposed.departmentName && row.proposed.departmentName !== row.current.departmentName
                      ? `${row.current.departmentName} → ${row.proposed.departmentName}`
                      : row.current.departmentName}
                  </div>
                  <div className="col-span-1 md:col-span-2 font-label text-xs text-on-surface-variant">
                    {dateRangeProposed}
                  </div>

                  <div className="col-span-1 md:col-span-2 flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
                    <span className="font-label text-xs font-bold">{hasActualChanges(row.current, row.proposed) ? 'Değişim Var' : 'Onay Bekle'}</span>
                  </div>

                  <div className="col-span-1 md:col-span-3 flex justify-start md:justify-end gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleApprove(row.current.id)
                      }}
                      className="px-3.5 py-1.5 bg-secondary/15 border border-secondary text-secondary font-label text-xs rounded hover:bg-secondary hover:text-on-secondary transition-all flex items-center gap-1.5"
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
                      className="px-3.5 py-1.5 bg-transparent border border-outline-variant/40 text-on-surface font-label text-xs rounded hover:border-rose-500 hover:text-rose-600 transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      Reddet
                    </button>
                  </div>


                  {/* Reddetme Satır İçi Açılır Formu */}
                  {activeRejectId === row.current.id && (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      className="absolute inset-0 bg-surface-container-lowest/95 backdrop-blur-sm z-10 flex items-center justify-between px-4"
                    >
                      <div className="flex-1 max-w-2xl mx-auto flex gap-3 items-center w-full">
                        <span className="material-symbols-outlined text-rose-600 text-[20px]">warning</span>
                        <input
                          type="text"
                          value={rejectReasonInput}
                          onChange={(e) => setRejectReasonInput(e.target.value)}
                          placeholder="Red nedenini giriniz (Örn: Yetersiz değerlendirme detayı)..."
                          className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-rose-500"
                        />
                        <button
                          onClick={() => setActiveRejectId(null)}
                          className="px-3 py-1.5 text-on-surface-variant hover:text-primary font-label text-xs uppercase"
                        >
                          İptal
                        </button>
                        <button
                          onClick={() => handleConfirmReject(row.current.id)}
                          className="px-4 py-1.5 bg-rose-600 text-white font-label text-xs rounded hover:bg-rose-700 transition-colors"
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

          {/* Panel Özeti (admin stats) */}
          {stats && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/40">
                <span className="material-symbols-outlined text-secondary text-[22px]">insights</span>
                <h2 className="font-display text-2xl font-bold text-primary">Panel Özeti</h2>
              </div>

              {/* Toplamlar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Kullanıcı', value: stats.totals?.users, icon: 'group' },
                  { label: 'Onaylı Staj', value: stats.totals?.approvedInternships, icon: 'verified' },
                  { label: 'Firma', value: stats.totals?.companies, icon: 'domain' },
                  { label: 'Yorum', value: stats.totals?.comments, icon: 'chat' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-secondary">{s.icon}</span>
                      <span className="font-label text-xs">{s.label}</span>
                    </div>
                    <div className="font-display text-3xl font-bold text-primary mt-1">{s.value ?? 0}</div>
                  </div>
                ))}
              </div>

              {/* Bekleyenler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <span className="font-label text-xs text-on-surface-variant">Bekleyen Staj</span>
                  <div className="font-display text-2xl font-bold text-primary mt-1">{stats.pending?.internships ?? 0}</div>
                </div>
                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <span className="font-label text-xs text-on-surface-variant">Bekleyen Düzenleme</span>
                  <div className="font-display text-2xl font-bold text-primary mt-1">{stats.pending?.internshipChanges ?? 0}</div>
                </div>
                <div className={`rounded-xl border p-4 ${(stats.pending?.reportedComments ?? 0) > 0 ? 'border-rose-500/40 bg-rose-500/5' : 'border-outline-variant/40 bg-surface-container-low'}`}>
                  <span className="font-label text-xs text-on-surface-variant">Şikayetli Yorum</span>
                  <div className={`font-display text-2xl font-bold mt-1 ${(stats.pending?.reportedComments ?? 0) > 0 ? 'text-rose-600' : 'text-primary'}`}>{stats.pending?.reportedComments ?? 0}</div>
                </div>
              </div>

              {/* Bu hafta */}
              <div className="mt-4 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 flex flex-wrap gap-x-8 gap-y-2 font-label text-xs text-on-surface-variant">
                <span>Bu hafta yeni staj: <strong className="text-primary">{stats.lastWeek?.newInternships ?? 0}</strong> <span>(önceki hafta {stats.lastWeek?.newInternshipsPreviousWeek ?? 0})</span></span>
                <span>Yeni kullanıcı: <strong className="text-primary">{stats.lastWeek?.newUsers ?? 0}</strong></span>
                <span>Yeni yorum: <strong className="text-primary">{stats.lastWeek?.newComments ?? 0}</strong></span>
              </div>

              {/* Grafik + En çok şikayet alanlar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5">
                  <h3 className="font-display text-base font-semibold text-primary mb-3">Haftalık Staj (son 8 hafta)</h3>
                  <div style={{ height: 240 }}>
                    <ResponsiveBar
                      data={((stats.weeklyInternships || []).map((w: any) => ({ week: formatWeekLabel(w.weekStart), count: w.count ?? 0 }))) as any}
                      keys={['count']}
                      indexBy="week"
                      margin={{ top: 10, right: 10, bottom: 50, left: 30 }}
                      padding={0.35}
                      colors={['#0058bd']}
                      enableLabel={false}
                      axisBottom={{ tickRotation: -45, tickPadding: 5 }}
                      theme={{
                        axis: { ticks: { line: { stroke: '#c4c6d1' }, text: { fill: '#141c28', fontSize: 10 } } },
                        grid: { line: { stroke: '#c4c6d1' } },
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5">
                  <h3 className="font-display text-base font-semibold text-primary mb-3">En Çok Şikayet Alan Kullanıcılar</h3>
                  {(!stats.topReportedUsers || stats.topReportedUsers.length === 0) ? (
                    <p className="font-label text-xs text-on-surface-variant">Kayıt yok.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {stats.topReportedUsers.map((u: any, index: number) => (
                        <li key={u.userId || index} className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2">
                          <div className="min-w-0">
                            <div className="font-label text-sm text-primary truncate">{u.fullName || 'Kullanıcı'}</div>
                            <div className="font-label text-[11px] text-on-surface-variant truncate">{u.email}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 font-label text-xs font-semibold text-rose-600">
                            <span className="material-symbols-outlined text-[14px]">flag</span>{u.totalReports ?? u.openReports ?? u.reportedCommentCount ?? 0}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Şikayetli Yorumlar */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-outline-variant/40">
              <span className="material-symbols-outlined text-rose-600 text-[22px]">flag</span>
              <h2 className="font-display text-2xl font-bold text-primary">Şikayetli Yorumlar</h2>
              <span className="ml-1 rounded-full bg-surface-container-low px-2 py-0.5 font-label text-xs text-on-surface-variant">{reportedComments.length}</span>
            </div>

            {reportedComments.length === 0 ? (
              <div className="py-10 text-center text-on-surface-variant border border-dashed border-outline-variant/40 rounded">
                <span className="material-symbols-outlined text-[40px] opacity-50 block mb-2">verified_user</span>
                <p className="text-sm">Şikayet edilen yorum bulunmuyor.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...reportedComments]
                  .sort((a, b) => (b.isHidden ? 1 : 0) - (a.isHidden ? 1 : 0))
                  .map((raw) => {
                    const c = readReportedComment(raw)
                    const reasonsText = formatReportReasons(c.reasons)
                    return (
                      <div key={c.id} className={`rounded-xl border p-4 ${c.isHidden ? 'border-rose-500/40 bg-rose-500/5' : 'border-outline-variant/40 bg-surface-container-low'}`}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display text-base font-semibold text-primary">{c.author}</span>
                              {c.isHidden && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                                  <span className="material-symbols-outlined text-[12px]">visibility_off</span>Otomatik gizlendi
                                </span>
                              )}
                            </div>
                            <div className="font-label text-xs text-on-surface-variant mt-0.5">
                              {c.companyName}{c.companyDepartment ? ` · ${c.companyDepartment}` : ''}{c.date ? ` · ${c.date}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={reportedActionId === String(c.id)}
                              onClick={() => handleDismissReports(String(c.id))}
                              className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/50 px-3 py-1.5 font-label text-xs text-on-surface-variant hover:border-secondary hover:text-secondary transition disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[15px]">done_all</span>Şikayetleri yoksay
                            </button>
                            <button
                              type="button"
                              disabled={reportedActionId === String(c.id)}
                              onClick={() => handleDeleteReported(String(c.id))}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-3 py-1.5 font-label text-xs text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>Yorumu kaldır
                            </button>
                          </div>
                        </div>

                        {c.parentContent && (
                          <div className="mt-3 rounded-lg border-l-2 border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
                            <span className="font-semibold text-on-surface">{c.parentAuthorName || 'Yorum'}:</span> {c.parentContent}
                          </div>
                        )}

                        <p className="mt-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 px-3 py-2 text-sm text-on-surface">{c.content}</p>

                        {reasonsText && (
                          <div className="mt-3 flex items-center gap-1.5 font-label text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[15px] text-rose-600">report</span>
                            <span className="font-semibold text-primary">Sebepler:</span> {reasonsText}
                          </div>
                        )}

                        {c.notes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {c.notes.map((note: string, index: number) => (
                              <p key={index} className="rounded border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 text-xs text-on-surface-variant">“{note}”</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Detail Modal */}
          {selectedDetailId && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-outline-variant/40 sticky top-0 bg-surface-container-lowest">
                  <h2 className="font-display text-2xl font-bold text-primary">Staj Detayları</h2>
                  <button
                    onClick={() => setSelectedDetailId(null)}
                    className="text-on-surface-variant hover:text-primary font-bold text-xl"
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
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-1">ÖĞRENCİ</p>
                            <p className="text-on-surface font-semibold">{display.realAuthorName}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{display.authorEmail}</p>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-1">ŞİRKET</p>
                            <p className={`text-on-surface font-semibold ${proposed.companyName && proposed.companyName !== current.companyName ? 'text-secondary' : ''}`}>
                              {proposed.companyName || current.companyName}
                            </p>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-1">ÜNİVERSİTE</p>
                            <p className={`font-semibold ${proposed.universityName && proposed.universityName !== current.universityName ? 'text-secondary' : 'text-on-surface'}`}>
                              {display.universityName}
                            </p>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-1">BÖLÜM</p>
                            <p className={`font-semibold ${proposed.departmentName && proposed.departmentName !== current.departmentName ? 'text-secondary' : 'text-on-surface'}`}>
                              {display.departmentName}
                            </p>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-1">ŞEHİR / TARİH</p>
                            <p className="text-on-surface font-semibold">{display.cityName || '-'} | {display.startDate || '-'} - {display.endDate || '-'}</p>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-1">STAJ TİPİ / SINIF</p>
                            <p className="text-on-surface font-semibold">{formatTerm(display.term)} | {display.companyDepartment || '-'}</p>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-1">İŞE DÖNÜŞ TEKLİFİ</p>
                            <p className="text-on-surface font-semibold">
                              {display.returnOfferReceived ? 'Teklif Var' : 'Teklif Yok'}
                            </p>
                          </div>
                        </div>

                        {/* Scores */}
                        <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                          <p className="text-xs text-on-surface-variant mb-3 font-bold">PUANLAR</p>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div><p className="text-xs text-on-surface-variant">Öğrenme</p><p className="text-lg font-bold text-primary">{display.scores?.learningScore}/5</p></div>
                            <div><p className="text-xs text-on-surface-variant">Mentoring</p><p className="text-lg font-bold text-primary">{display.scores?.mentoringScore}/5</p></div>
                            <div><p className="text-xs text-on-surface-variant">Tech Altyapı</p><p className="text-lg font-bold text-primary">{display.scores?.techInfraScore}/5</p></div>
                            <div><p className="text-xs text-on-surface-variant">Çalışma Ortamı</p><p className="text-lg font-bold text-primary">{display.scores?.workEnvironmentScore}/5</p></div>
                            <div><p className="text-xs text-on-surface-variant">Maaş</p><p className="text-lg font-bold text-primary">{display.scores?.salaryScore}/5</p></div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant">Tavsiye: <span className={`font-bold ${display.scores?.wouldRecommend ? 'text-emerald-600' : 'text-red-500'}`}>{display.scores?.wouldRecommend ? 'EVET' : 'HAYIR'}</span></p>
                          </div>
                        </div>

                        {/* Interview & Tips */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-2 font-bold">MÜLAKAT SÜRECİ</p>
                            <p className="text-sm text-on-surface"><span className="text-on-surface-variant">Yöntem:</span> {display.interview?.applicationMethod || 'Yok'}</p>
                            <p className="text-sm text-on-surface mt-1"><span className="text-on-surface-variant">Açıklama:</span> {display.interview?.description || 'Yok'}</p>
                          </div>
                          <div className="bg-surface-container-low p-4 rounded border border-outline-variant/40">
                            <p className="text-xs text-on-surface-variant mb-2 font-bold">EK ÖNERİLER</p>
                            <p className="text-sm text-on-surface">{display.scores?.additionalTips || 'Ek öneri yok'}</p>
                          </div>
                        </div>

                        {/* Proposed Changes Highlight */}
                        {hasChanges && (
                          <div className="bg-secondary/10 border-l-4 border-secondary p-4 rounded">
                            <p className="text-xs text-secondary font-bold mb-3">DEĞİŞKLİKLER</p>
                            <div className="space-y-2 text-sm">
                              {proposed.companyName && proposed.companyName !== current.companyName && (
                                <p className="text-secondary">• Şirket: <s>{current.companyName}</s> → <strong>{proposed.companyName}</strong></p>
                              )}
                              {proposed.universityName && proposed.universityName !== current.universityName && (
                                <p className="text-secondary">• Üniversite: <s>{current.universityName}</s> → <strong>{proposed.universityName}</strong></p>
                              )}
                              {proposed.departmentName && proposed.departmentName !== current.departmentName && (
                                <p className="text-secondary">• Bölüm: <s>{current.departmentName}</s> → <strong>{proposed.departmentName}</strong></p>
                              )}
                              {hasChangedField(current.startDate, proposed.startDate) || hasChangedField(current.endDate, proposed.endDate) ? (
                                <p className="text-secondary">• Tarih: {proposed.startDate} - {proposed.endDate}</p>
                              ) : null}
                              {data.classChanged && (
                                <p className="text-secondary">• Sınıf / departman: <s>{current.companyDepartment || '-'}</s> → <strong>{proposed.companyDepartment}</strong></p>
                              )}
                              {hasChangedField(current.term, proposed.term) && (
                                <p className="text-secondary">• Staj tipi: <s>{formatTerm(current.term)}</s> → <strong>{formatTerm(proposed.term)}</strong></p>
                              )}
                              {proposed.cityName && proposed.cityName !== current.cityName && (
                                <p className="text-secondary">• Şehir: <s>{current.cityName || '-'}</s> → <strong>{proposed.cityName}</strong></p>
                              )}
                              {proposed.returnOfferReceived !== undefined && proposed.returnOfferReceived !== current.returnOfferReceived && (
                                <p className="text-secondary">• İşe dönüş teklifi: <s>{current.returnOfferReceived ? 'Var' : 'Yok'}</s> → <strong>{proposed.returnOfferReceived ? 'Var' : 'Yok'}</strong></p>
                              )}
                              {proposed.scores && Object.keys(proposed.scores).map((key) => (
                                proposed.scores[key] !== current.scores?.[key] && (
                                  <p key={key} className="text-secondary">• {key}: <s>{String(current.scores?.[key] ?? '-')}</s> → <strong>{String(proposed.scores[key])}</strong></p>
                                )
                              ))}
                              {proposed.interview?.applicationMethod && !valuesEqual(proposed.interview.applicationMethod, current.interview?.applicationMethod) && (
                                <p className="text-secondary">• Başvuru yöntemi: <s>{current.interview?.applicationMethod || '-'}</s> → <strong>{proposed.interview.applicationMethod}</strong></p>
                              )}
                              {proposed.interview?.description && !valuesEqual(proposed.interview.description, current.interview?.description) && (
                                <p className="text-secondary">• Mülakat açıklaması güncellendi</p>
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
                          className="flex-1 px-4 py-2 bg-secondary text-white font-label text-sm rounded hover:bg-primary-container transition-all"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => {
                            setActiveRejectId(selectedDetailId)
                            setSelectedDetailId(null)
                          }}
                          className="flex-1 px-4 py-2 bg-transparent border border-rose-500 text-rose-600 font-label text-sm rounded hover:bg-rose-500/10 transition-all"
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