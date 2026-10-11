import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { internshipService } from '../services/internshipService'
import { lookupService } from '../services/lookupService'
import CompanyLogo from '../components/CompanyLogo'

interface InternshipReview {
  id: string | number
  companyName: string
  companyLogo?: string
  sector: string
  rating: number | null
  companySlug?: string
  reviewCount: number
  authorInitials: string
  university: string
  term: string
  reviewSnippet: string
  status: 'VERIFIED' | 'PENDING' | 'EMPTY'
  location?: string
  department?: string
  cityId?: string
  departmentId?: string
  scores?: {
    learningScore?: number
    mentoringScore?: number
    techInfraScore?: number
    workEnvironmentScore?: number
    salaryScore?: number
  }
}

function normalizeCompanyName(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,/#!$%^&*;:{}=_`~()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getInternshipScore(internship: any) {
  if (typeof internship.averageScore === 'number') return internship.averageScore
  const scores = internship.scores || {}
  const values = [scores.learningScore, scores.mentoringScore, scores.techInfraScore, scores.workEnvironmentScore, scores.salaryScore]
    .filter((value): value is number => typeof value === 'number')
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function getExperienceText(internship: any) {
  const storedNotes = internship.scores?.additionalTips || ''
  const storedExperience = storedNotes.match(/Deneyim:\s*([\s\S]*?)(?=\n\nEk (?:öneri|tavsiye):|$)/i)?.[1]?.trim()
  return (internship.description || storedExperience || 'Deneyim metni bulunmamaktadır.').trim()
}

function formatTerm(term?: string) {
  const value = String(term || '').toLowerCase()
  if (value === 'longterm' || value === 'uzun' || value.includes('uzun')) return 'Uzun Dönem'
  if (value === 'shortterm' || value === 'kisa' || value === 'kısa' || value.includes('kısa')) return 'Kısa Dönem'
  return term || '-'
}

function normalizeTerm(term?: string) {
  return formatTerm(term) === 'Uzun Dönem' ? 'LongTerm' : formatTerm(term) === 'Kısa Dönem' ? 'ShortTerm' : ''
}

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [search, setSearch] = useState(initialSearch)
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [departments, setDepartments] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [items, setItems] = useState<InternshipReview[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 9

  useEffect(() => {
    const fetchLookups = async () => {
      const [departmentsRes, citiesRes] = await Promise.allSettled([
        lookupService.getDepartments(),
        lookupService.getCities(),
      ])
      if (departmentsRes.status === 'fulfilled') setDepartments(departmentsRes.value.data || [])
      if (citiesRes.status === 'fulfilled') setCities(citiesRes.value.data || [])
    }
    fetchLookups()
  }, [])

  // 1. MOCK DATA (Tasarımın birebir görünmesi için Stitch yedek verileri)
  const fallbackReviews: InternshipReview[] = [
    {
      id: 1,
      companyName: 'Trendyol',
      companyLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDihIWWomRLj2dVxH7JMCzWYifqdQeZ8ejjlaJeys_IB9gzkCzNIBNdGt_MnPj7_zO5RhTcv-KLFrHzeof0HbV6N6v9Qmkbz1weT1pN-JLERON6Bc3WrwbfPhOD2YFiP9kxySl3saG4y17bQ5aNcYOGQ2z7TiF5AQioUg7_wIei0XDZ_7_s1cT6v5tM_3Yzy66WDAKGmGK0oIv8k_YrlQ1Aep8gQOU6mkQTKN6F0k2081op3Vf-b93n',
      sector: 'Yazılım & Teknoloji',
      rating: 4.8,
      reviewCount: 124,
      authorInitials: 'A.B.',
      university: 'İTÜ',
      term: 'Yaz 2023 - Kısa Dönem',
      reviewSnippet: 'Çok yoğun ama bir o kadar da öğretici bir staj dönemiydi. Microservis mimarisi üzerine gerçek projelerde görev aldım. Mentorluk sistemi harika işliyor, her sorunuza yanıt bulabiliyorsunuz.',
      status: 'VERIFIED',
      location: 'istanbul',
      department: 'yazilim',
      scores: { learningScore: 4, mentoringScore: 4, techInfraScore: 5, workEnvironmentScore: 4, salaryScore: 3 },
    },
    {
      id: 2,
      companyName: 'Aselsan',
      companyLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjZlivtnsrocvTj-UJWHs9oX3wXSXwqdNdVGdxJs1PBzWdOlm9z-Puy-7zrVhx7WbdsuXMrroQDlYpGn-OHnavHHlUiL6w-Zt0i5iSNfMZtEEoVQWoNt2S0768JYukdp-fY4n8Wm84WJ_OUzMYyRsrLMxvGXxO3SyNICSd442xULsSjPvc6YHkvLPrlBiObk64_e9LfIXLVqdlagoH7Q3Ht-L_OHNnFqD5yNFZNbueYoWvmBt-u9Fw',
      sector: 'Savunma Sanayi',
      rating: 4.5,
      reviewCount: 85,
      authorInitials: 'C.D.',
      university: 'ODTÜ',
      term: 'Güz 2023 - Uzun Dönem',
      reviewSnippet: 'Kurumsal yapısı gereği süreçler biraz yavaş işleyebiliyor ancak gömülü sistemler konusunda Türkiye\'de staj yapılabilecek en iyi yer. Donanım ve yazılım entegrasyonu muazzam.',
      status: 'VERIFIED',
      location: 'ankara',
      department: 'savunma',
      scores: { learningScore: 5, mentoringScore: 4, techInfraScore: 5, workEnvironmentScore: 4, salaryScore: 4 },
    },
    {
      id: 3,
      companyName: 'Garanti BBVA Teknoloji',
      companyLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEqlO6Y5M26eWFAuAH-xmi1O46r5uuKLzN3Mmu7be5_Sfglsdr3Lc3dxVgKUNTpb0vDaCNQ4IyQR8lgBNmcbzzKEdOxsW6ENxRRpPSi61zvUGjp6s7ZQHS4TguHgOEf8ETwjP7NB_99_2baVeCXnyISWuB9sdNTceNZ1HZwIv9vmMEXp77_ORLD17Ao3FEDnO3BW_ecEdZYh7ux9FT0Z2QYfdatJ2R_oikHxHDIAMZ_Ri0UVJe_hU1',
      sector: 'Finans & Bankacılık',
      rating: 4.2,
      reviewCount: 42,
      authorInitials: 'E.F.',
      university: 'Boğaziçi',
      term: 'Yaz 2022 - Kısa Dönem',
      reviewSnippet: 'Veri bilimi ekibinde çalıştım. Büyük veri ile uğraşmak isteyenler için mükemmel bir fırsat. Eğitim programları çok kapsamlıydı fakat sorumluluk almak biraz zaman alıyor.',
      status: 'PENDING',
      location: 'istanbul',
      department: 'finans',
      scores: { learningScore: 4, mentoringScore: 4, techInfraScore: 4, workEnvironmentScore: 3, salaryScore: 3 },
    },
    {
      id: 4,
      companyName: 'Bilinmeyen A.Ş.',
      sector: 'Üretim & Otomotiv',
      rating: null,
      reviewCount: 0,
      authorInitials: '-',
      university: '-',
      term: '-',
      reviewSnippet: 'Bu şirket için henüz stajyer değerlendirmesi bulunmamaktadır. İlk değerlendiren siz olun.',
      status: 'EMPTY',
      location: 'kocaeli',
      department: 'uretim',
    },
  ]

  // 2. BACKEND BAĞLANTISI
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      try {
        const response = await internshipService.getAll({
          search: search || undefined,
          departmentId: selectedDepartment || undefined,
          cityId: selectedCity || undefined,
        })
        if (response.data && response.data.length > 0) {
          const internships = response.data
          const scoresByCompanyName = new Map<string, number[]>()
          internships.forEach((internship: any) => {
            const companyName = internship.companyName || 'Bilinmeyen Şirket'
            const score = getInternshipScore(internship)
            if (score === null) return
            const key = normalizeCompanyName(companyName)
            scoresByCompanyName.set(key, [...(scoresByCompanyName.get(key) || []), score])
          })

          setItems(internships.map((internship: any) => {
            const scores = internship.scores || {}
            const companyName = internship.companyName || 'Bilinmeyen Şirket'
            const companyScores = scoresByCompanyName.get(normalizeCompanyName(companyName)) || []
            const companyRating = companyScores.length
              ? companyScores.reduce((sum, value) => sum + value, 0) / companyScores.length
              : null

            return {
              id: internship.id,
              companyName: internship.companyName || 'Bilinmeyen Şirket',
              companyLogo: internship.companyLogo,
              sector: internship.departmentName || 'Belirtilmemiş',
              rating: companyRating,
              reviewCount: internship.reviewCount || 0,
              authorInitials: internship.isAnonymous ? '-' : (internship.authorName || '-').split(' ').map((part: string) => part[0]).join('').slice(0, 3),
              university: internship.universityName || '-',
              term: internship.term || '-',
              reviewSnippet: getExperienceText(internship),
              status: internship.status === 'Approved' ? 'VERIFIED' : internship.status === 'Pending' ? 'PENDING' : 'EMPTY',
              location: internship.cityName?.toLowerCase(),
              department: internship.departmentName?.toLowerCase(),
              cityId: internship.cityId || cities.find((city) => city.name === internship.cityName)?.id,
              departmentId: internship.departmentId || departments.find((department) => department.name === internship.departmentName)?.id,
              scores: {
                learningScore: scores.learningScore,
                mentoringScore: scores.mentoringScore,
                techInfraScore: scores.techInfraScore,
                workEnvironmentScore: scores.workEnvironmentScore,
                salaryScore: scores.salaryScore,
              },
            }
          }))
        } else {
          setItems(search || selectedDepartment || selectedCity ? [] : fallbackReviews)
        }
      } catch (err) {
        console.warn('Backend API verisi alınamadı, şablon verisi devrede:', err)
        setItems(fallbackReviews)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [search, selectedDepartment, selectedCity, departments, cities])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedDepartment, selectedCity, selectedTerm])

  // Filtreleme mantığı
  const filteredItems = items.filter((item) => {
    const matchSearch =
      search === '' ||
      item.companyName.toLowerCase().includes(search.toLowerCase()) ||
      item.sector.toLowerCase().includes(search.toLowerCase())
    const matchDept = selectedDepartment === '' || item.departmentId === selectedDepartment || item.department === selectedDepartment
    const matchCity = selectedCity === '' || item.cityId === selectedCity || item.location === selectedCity
    const matchTerm = selectedTerm === '' || normalizeTerm(item.term) === selectedTerm
    return matchSearch && matchDept && matchCity && matchTerm
  })
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const visibleItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <main className="flex-1 overflow-auto relative bg-background min-h-screen text-on-surface font-body">
      <div className="flex flex-col w-full">
        {/* Header Section */}
        <div className="flex flex-col relative w-full px-6 py-12 z-10 overflow-hidden">
          {/* Çizgili Grid Arka Planı */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(to right, #c4c6d1 1px, transparent 1px), linear-gradient(to bottom, #c4c6d1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="flex flex-col lg:flex-row justify-between items-end gap-12 relative max-w-[1200px] mx-auto w-full">
            <div className="flex flex-col max-w-2xl">
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary mb-3 tracking-tight">
                Staj Arşivi
              </h1>
              <p className="font-body text-lg text-on-surface-variant">
                Öğrenci deneyimlerinin objektif ve doğrulanmış kayıtları. Kariyer hedeflerinize uygun firmaları araştırın, sektörel standartları inceleyin ve gerçek stajyer geribildirimlerini okuyun.
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end font-label text-xs text-on-surface-variant text-right">
              {/* İsteğe bağlı sağ üst istatistik alanı */}
            </div>
          </div>
        </div>

        {/* Arama ve Filtreleme Barı */}
        <div className="w-full px-6 py-6 relative z-20">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col md:flex-row gap-3">
            {/* Firma Arama Input */}
            <div className="flex-1 relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">
                domain
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Firma, Marka Ara..."
                type="text"
                className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest text-on-surface text-base rounded-lg border border-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm transition-transform group-hover:scale-[1.01]"
              />
            </div>

            {/* Bölüm / Sektör Filtresi */}
            <div className="w-full md:w-56 relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">
                school
              </span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest text-on-surface text-base rounded-lg border border-outline-variant/50 appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm transition-transform group-hover:scale-[1.01] cursor-pointer"
              >
                <option value="">Bölüm (Tümü)</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Şehir Filtresi */}
            <div className="w-full md:w-48 relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">
                location_on
              </span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest text-on-surface text-base rounded-lg border border-outline-variant/50 appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm transition-transform group-hover:scale-[1.01] cursor-pointer"
              >
                <option value="">İl (Tümü)</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Staj Dönemi Filtresi */}
            <div className="w-full md:w-52 relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">
                calendar_month
              </span>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest text-on-surface text-base rounded-lg border border-outline-variant/50 appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm transition-transform group-hover:scale-[1.01] cursor-pointer"
              >
                <option value="">Staj Dönemi (Tümü)</option>
                <option value="LongTerm">Uzun Dönem</option>
                <option value="ShortTerm">Kısa Dönem</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* Staj Kartları Izgarası */}
        <div className="flex-1 w-full px-6 py-12">
          <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col w-full min-h-[450px] bg-surface-container-lowest text-on-surface shadow-sm hover:shadow-md hover:border-secondary/40 transition-all duration-300 hover:-translate-y-1 border border-outline-variant/40 rounded-xl overflow-hidden"
              >
                {/* Kart başlığı ve firma puanı */}
                <div className="flex items-start justify-between gap-3 p-6 pb-5 relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyLogo name={item.companyName} logoUrl={item.companyLogo} className="w-14 h-14 rounded-xl shadow-sm shrink-0 border border-outline-variant/50" textClassName="text-base" />
                    <div className="flex flex-col min-w-0 gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-xl font-bold text-primary truncate">{item.companyName}</h3>
                        <span className="rounded-full border border-outline-variant/50 bg-surface-container-low px-2 py-1 font-label text-[9px] font-semibold text-secondary">
                          {formatTerm(item.term)}
                        </span>
                      </div>
                      <span className="font-label text-[10px] text-on-surface-variant tracking-wide">{item.sector}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low px-3 py-2 font-label text-sm font-bold text-primary">
                      <span className="text-[10px]">Firma Puanı</span> {item.rating !== null ? item.rating.toFixed(1) : '-'} <span className="text-xs text-secondary">★</span>
                    </div>
                    <div className="mt-1 font-label text-[10px] text-on-surface-variant">{item.reviewCount} Onaylı Yorum</div>
                  </div>
                </div>

                {/* Metadata Şeridi */}
                <div className={`mx-5 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-lg ${item.status === 'EMPTY' ? 'opacity-50' : ''}`}>
                  <span className="font-label text-[10px] text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">school</span>
                    {item.university}
                  </span>
                  <span className="h-3 w-px bg-outline-variant" />
                  <span className="font-label text-[10px] text-on-surface-variant">{item.department || 'Bölüm belirtilmemiş'}</span>
                  <span className="ml-auto font-label text-[10px] text-on-surface-variant">{item.location || 'İzmir'} · {formatTerm(item.term)}</span>
                </div>

                {/* Yorum Metni & Onay Durumu */}
                <div className="p-6 pt-2 flex-1 flex flex-col">
                  <p className={`border-l-2 border-secondary pl-4 text-sm leading-6 text-on-surface mb-5 italic ${item.status === 'EMPTY' ? 'opacity-70' : 'line-clamp-3'}`}>
                    {item.status !== 'EMPTY' ? `"${item.reviewSnippet}"` : item.reviewSnippet}
                  </p>
                  {item.status !== 'EMPTY' && (
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                        <span className="material-symbols-outlined text-[17px]">star</span>
                      </span>
                      <span className="font-label text-xs text-on-surface-variant">Stajyer Değerlendirmesi:</span>
                      <strong className="font-label text-lg text-primary">{item.rating !== null ? item.rating.toFixed(1) : '-'} / 5.0</strong>
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-outline-variant/40 pt-4">
                    <span className="font-label text-[10px] text-on-surface-variant">DENEYİM KAYDI</span>
                    {item.status === 'EMPTY' && (
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        <span className="font-label text-[10px] font-bold tracking-wide">
                          BİLGİ YOK
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/internship/${item.id}`)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 font-label text-[10px] font-semibold text-on-secondary shadow-sm transition-colors hover:bg-primary-container"
                    >
                      Deneyim Detayı
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sayfalama */}
          {filteredItems.length > pageSize && (
            <div className="w-full flex justify-center items-center gap-2 mt-12 mb-12">
              <button
                type="button"
                aria-label="Önceki sayfa"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant transition hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  aria-label={`${page}. sayfa`}
                  aria-current={currentPage === page ? 'page' : undefined}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 font-label text-xs transition ${currentPage === page ? 'border-secondary bg-secondary text-on-secondary' : 'border-outline-variant/50 text-on-surface-variant hover:border-secondary hover:text-secondary'}`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                aria-label="Sonraki sayfa"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/50 text-on-surface-variant transition hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
          </div>
        </div>
    </main>
  )
}