import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { internshipService } from '../services/internshipService'
import { newsService, type NewsItem } from '../services/newsService'
import { useAuth } from '../hooks/useAuth'
import CompanyLogo from '../components/CompanyLogo'

interface FeaturedReview {
  id: string | number
  companyName: string
  companyLogo: string
  role: string
  rating: number
  internRating?: number | null
  companyRating?: number | null
  reviewSnippet: string
  tags: string[]
  isVerified: boolean
  borderTopColor: string
  reviewCount?: number
  university?: string
  city?: string
  term?: string
}

function calculateAverageScore(scores?: Record<string, unknown>) {
  if (!scores) return 0

  const scoreKeys = ['learningScore', 'mentoringScore', 'techInfraScore', 'workEnvironmentScore', 'salaryScore']
  const values = scoreKeys
    .map((key) => scores[key])
    .filter((value): value is number => typeof value === 'number')

  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function normalizeCompanyName(value: string) {
  return value.toLocaleLowerCase('tr-TR').replace(/[.,/#!$%^&*;:{}=_`~()\-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function getInternshipScore(internship: any) {
  if (typeof internship.averageScore === 'number') return internship.averageScore
  return calculateAverageScore(internship.scores) || null
}

function formatReviewContent(internship: any) {
  const storedNotes = internship.scores?.additionalTips || ''
  const storedExperience = storedNotes.match(/Deneyim:\s*([\s\S]*?)(?=\n\nEk (?:öneri|tavsiye):|$)/i)?.[1]?.trim()
  return (internship.description || storedExperience || 'Deneyim metni bulunmamaktadır.').trim()
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuth } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  // 1. MOCK DATA (Stitch Şablonundaki Birebir Veriler)
  const fallbackReviews: FeaturedReview[] = [
    {
      id: 1,
      companyName: 'Trendyol Tech',
      companyLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqtnmHpqgt8Iv4hlGkhWAO_wx_9MajIoyvHRXbb9NkMNuI2fOWauL40CKB_0v9fJEVypuNHb0m3X9vCxbZARCoQn8ZRFAEkqTB9FOWnFGA0HcWIvbAwzt1-xzunSOKukKg_hwq7jhDHNTEknkcfa35DnaJ4t9I4_vcJXL5GfyT4PU-j69nU_hXcMEg63PtJomSKyz3F4AE5ykYFdW5389U3GRTBzbbqZXdQSM_jTMEPdkObWU0p9DF5w',
      role: 'Software Engineering Intern',
      rating: 4.8,
      reviewSnippet: 'Sorumluluk almaktan çekinmiyorsanız harika bir ortam. Mentörlük sistemi çok güçlü, production ortamına kod atmak ilk haftadan mümkün...',
      tags: ['Yazılım', 'Hibrit'],
      isVerified: true,
      borderTopColor: 'border-t-[#1E293B]',
    },
    {
      id: 2,
      companyName: 'Aselsan',
      companyLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDS7iHy9sykSYUInDWh98nI4BEt6TVfAMFhxzDvRB-cYSx_uAhZ6-i6PEKvGInW875wWTxp5ZZUJYcKx-zYIeyz3wExeSgqp_xsOQcVmIUNzT-m1h3O-qpyub0Yubgi0gm6eJz5TEsSTznMukt7Y8p3iBUonLPBrgn37SVAq4pEeKSAIHwz7k4KQNaEAknT4HHWTrEeN2LwvNbL1QG4VCv4OAM9safdpe4VGP0P0Jnc1H0UTLq0MZJ2Aw',
      role: 'Aday Mühendis',
      rating: 4.5,
      reviewSnippet: 'Kurumsal kültür çok derin. Süreçler biraz yavaş işlese de, üzerinde çalışılan projelerin ölçeği ve teknik altyapı muazzam bir tecrübe katıyor.',
      tags: ['Savunma Sanayi'],
      isVerified: true,
      borderTopColor: 'border-t-[#700080]',
    },
    {
      id: 3,
      companyName: 'Garanti BBVA',
      companyLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwkd_BCt8M7ahyuRyWSlYNYAEQVzErRan01yO0jT7g3U09GKNGn-DjmOWYr0GyYUHDKO8wBWmL_cLX54mtCNdWTagi-30y_8P3WWQNWx77aOJqIL3dhp3Z-MJl5V2MRF2Mqxv7_XsNFEiLBEWPz0avjJXyXjAW7TTy2Hy03gCXGTE6DPPaRvLGGUFRE7DeqQdOt-W_xGcjtS04yTIzggWwRn7mYfDx_CxVN7rQ8b3IxLardqqZKqT7Rg',
      role: 'Veri Analisti Stajyeri',
      rating: 4.2,
      reviewSnippet: 'Finans sektörünün dinamiklerini anlamak için iyi bir başlangıç. Kullanılan toollar biraz eski olsa da, veri seti büyüklüğü gerçek hayat problemleri sunuyor.',
      tags: ['Finans', 'Veri'],
      isVerified: true,
      borderTopColor: 'border-t-[#1E293B]',
    },
  ]

  const fallbackFeaturedArticle: NewsItem = {
    id: '1',
    category: 'Sektör Analizi',
    publishedAt: '2023-10-12T10:00:00Z',
    title: 'Teknoloji Sektöründe Hibrit Çalışma: Stajyerler İçin Avantajlar ve Tuzaklar',
    summary: 'Uzaktan çalışmanın stajyerler üzerindeki etkilerini, kurumsal aidiyet ve mentörlük erişimi bağlamında 500+ veri noktasıyla inceliyoruz.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqF9xeJ8QuBfwO9wf061XczG8TslB4VoHdACRECSOZ8ivInowDraj-y3uqyISrYbfSCwq_xxt1PxrUDGTKXE3fDQZTkv8_Te6ETwMz79qQ7vJQ0lZxJTmPG9IDjwG6UPZJtZsL5fzv4m_LF92VAniFVbypxWLQh638k_-Qvg1SZVMTCIohl-3OES3UgUpbqnRLlWZKSVIginnNhzo-Sd4zKyd3UZkaPOD9d2KR7pGg8Nc4Fb-9r0zBkA',
    sourceName: 'StajIn',
    sourceUrl: 'https://stajin.com',
  }

  const fallbackSideArticles: NewsItem[] = [
    {
      id: '2',
      category: 'Mülakat İpuçları',
      publishedAt: '2023-10-08T10:00:00Z',
      title: 'Vaka Çalışmalarında Analitik Düşünceyi Yansıtmak',
      summary: 'Danışmanlık firmalarının vaka mülakatlarında beklentileri nelerdir? Gerçek değerlendirme kriterleri.',
      sourceName: 'StajIn',
      sourceUrl: 'https://stajin.com',
    },
    {
      id: '3',
      category: 'Yasal Haklar',
      publishedAt: '2023-10-03T10:00:00Z',
      title: 'Zorunlu vs. Gönüllü Staj: Sigorta ve Ücretlendirme',
      summary: 'Stajyerlerin yasal statüleri ve kurumsal şirketlerin bordro uygulamalarındaki gri alanlar.',
      sourceName: 'StajIn',
      sourceUrl: 'https://stajin.com',
    },
    {
      id: '4',
      category: 'Kariyer Yolları',
      publishedAt: '2023-09-28T10:00:00Z',
      title: "Erken Aşama Startup'larda Staj Yapmak",
      summary: 'Kurumsal şirketlere kıyasla daha fazla sorumluluk, daha az yapılandırılmış süreç. Hangisi size uygun?',
      sourceName: 'StajIn',
      sourceUrl: 'https://stajin.com',
    },
  ]

  const [reviews, setReviews] = useState<FeaturedReview[]>(fallbackReviews)
  const [featuredArticle, setFeaturedArticle] = useState<NewsItem>(fallbackFeaturedArticle)
  const [sideArticles, setSideArticles] = useState<NewsItem[]>(fallbackSideArticles)
  const [overallStats, setOverallStats] = useState<any>({ totalCompanies: 0, totalInternships: 0, totalUsers: 0 })

  // 2. BACKEND İSTEĞİ (Fallback korumalı)
  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        const res = await internshipService.getAll({ limit: 3, sort: 'recent' })
        if (res.data && res.data.length > 0) {
              const companyScores = new Map<string, number[]>()
              res.data.forEach((internship: any) => {
                const name = internship.companyName || 'Bilinmeyen Şirket'
                const score = getInternshipScore(internship)
                if (score !== null) {
                  const key = normalizeCompanyName(name)
                  companyScores.set(key, [...(companyScores.get(key) || []), score])
                }
              })

              const mapped = res.data.slice(0, 3).map((internship: any) => {
                const name = internship.companyName || 'Bilinmeyen Şirket'
                const companyValues = companyScores.get(normalizeCompanyName(name)) || []
                const companyRating = companyValues.length
                  ? companyValues.reduce((sum, value) => sum + value, 0) / companyValues.length
                  : null
                const internRating = getInternshipScore(internship)
                return {
            id: internship.id,
                companyName: name,
            companyLogo: internship.companyLogo || '',
            role: internship.companyDepartment || 'Stajyer',
                rating: companyRating ?? 0,
                companyRating,
                internRating,
                reviewSnippet: formatReviewContent(internship),
            tags: [internship.departmentName || 'Teknoloji'],
            isVerified: internship.isSgkVerified || false,
            reviewCount: internship.reviewCount || 0,
            university: internship.universityName || 'Üniversite belirtilmemiş',
            city: internship.cityName || 'Şehir belirtilmemiş',
            term: internship.term || 'Dönem belirtilmemiş',
            borderTopColor: 'border-t-[#1E293B]',
            }
          })
          setReviews(mapped)
        }
      } catch (err) {
        console.warn('Son değerlendirmeler API bağlantısı kurulamadı, mock veri gösteriliyor:', err)
      }
    }
    fetchRecentReviews()
  }, [])

  // 3. HABERLERİ BACKEND'DEN ÇEK
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await newsService.getLatest(4)
        const newsItems = Array.isArray(res.data) ? res.data : []

        if (newsItems.length > 0) {
          setFeaturedArticle(newsItems[0])
          if (newsItems.length > 1) {
            setSideArticles(newsItems.slice(1, 4))
          }
        }
      } catch (err) {
        console.warn('Haberler API bağlantısı kurulamadı, mock veri gösteriliyor:', err)
      }
    }
    fetchNews()
  }, [])

  // 4. İSTATİSTİKLER
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const allInternships = await internshipService.getAll({ limit: 10000 })
        const approved = Array.isArray(allInternships.data)
          ? allInternships.data.filter((i: any) => i.status === 'Approved')
          : []

        const uniqueCompanies = new Set(Array.isArray(allInternships.data)
          ? allInternships.data.map((i: any) => i.companyName).filter(Boolean)
          : [])

        setOverallStats({
          totalCompanies: uniqueCompanies.size || 0,
          totalInternships: approved.length || 0,
          totalUsers: 0,
        })
      } catch (err) {
        console.warn('İstatistikler API bağlantısı kurulamadı, mock veri gösteriliyor:', err)
      }
    }
    fetchStats()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`)
    } else {
      navigate('/discover')
    }
  }

  return (
    <main className="w-full bg-background min-h-screen text-on-surface font-body selection:bg-secondary selection:text-on-secondary">
      <div className="flex flex-col w-full">

        {/* 1. HERO SECTION */}
        <section className="relative w-full min-h-[70vh] flex items-center justify-center pt-20 pb-16 px-4 md:px-10 overflow-hidden">
          {/* Çizgili Izgara Arka Planı */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern height="40" id="hero-grid" patternUnits="userSpaceOnUse" width="40">
                  <path className="text-outline-variant" d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
                </pattern>
              </defs>
              <rect fill="url(#hero-grid)" height="100%" width="100%"></rect>
            </svg>
          </div>

          {/* Yumuşak Arka Plan Işıltısı */}
          <div className="absolute -top-20 -left-16 w-[520px] h-[520px] bg-secondary-fixed/40 rounded-full blur-[110px] pointer-events-none"></div>
          <div className="absolute top-1/2 right-0 w-[460px] h-[460px] bg-surface-container/70 rounded-full blur-[110px] pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
            {/* Rozet */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/40 mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label text-label-sm text-primary tracking-wide">
                Staj Değerlendirme Platformu
              </span>
            </div>

            {/* Başlık */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-6 leading-tight tracking-tight">
              Staj yapmadan önce,<br />
              <span className="text-secondary">orada çalışanlara sor.</span>
            </h1>

            {/* Alt Başlık */}
            <p className="font-body text-base sm:text-lg text-on-surface-variant max-w-2xl mb-12 leading-relaxed">
              Ekip, iş yükü, öğrenme fırsatları... Stajyerlerin gözünden şirketleri keşfet.
            </p>

            {/* Arama Barı */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
              <div className="relative bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-md flex items-center p-2 focus-within:ring-2 focus-within:ring-secondary/40 transition-shadow">
                <span className="material-symbols-outlined text-on-surface-variant px-4 text-2xl">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Şirketleri keşfet..."
                  className="w-full bg-transparent border-none text-on-surface text-base placeholder-outline focus:outline-none focus:ring-0 py-3"
                />
                <button
                  type="submit"
                  className="bg-secondary hover:bg-primary-container text-on-secondary font-label text-label-md tracking-wide px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shrink-0 font-medium shadow-sm"
                >
                  <span>Ara</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </form>

            {/* Sayaçlar (İstatistik Barı) */}
            <div className="mt-14 mb-2 flex flex-col items-center">
              <h2 className="font-display text-xl font-semibold text-primary mb-1">İstatistikler</h2>
              <p className="font-label text-label-sm text-on-surface-variant tracking-wide">Genel Platform Verileri</p>
            </div>

            <div className="mt-4 flex flex-wrap justify-center items-center gap-8 md:gap-16">
              <div className="flex flex-col items-center">
                <span className="font-display text-2xl font-bold text-primary">{overallStats.totalInternships.toLocaleString('tr-TR')}</span>
                <span className="font-label text-label-sm text-on-surface-variant tracking-wide mt-1">Değerlendirme</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-outline-variant/60"></div>
              <div className="flex flex-col items-center">
                <span className="font-display text-2xl font-bold text-primary">{overallStats.totalCompanies.toLocaleString('tr-TR')}</span>
                <span className="font-label text-label-sm text-on-surface-variant tracking-wide mt-1">Toplam Firma</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ayrıcı Çizgi */}
        <div className="w-full border-t border-outline-variant/40 border-dashed my-4 max-w-[1200px] mx-auto"></div>

        {/* 2. SON DEĞERLENDİRMELER (KARTLAR) */}
        <section className="w-full max-w-[1200px] mx-auto px-4 md:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="font-display text-3xl font-bold text-primary mb-2 flex items-center gap-3 tracking-tight">
                <span className="material-symbols-outlined text-secondary text-3xl">verified</span>
                Son Değerlendirmeler
              </h2>
              <p className="font-label text-label-sm text-on-surface-variant tracking-wide">
                Paylaşılan Son Öğrenci Deneyimleri
              </p>
            </div>
            <Link
              to="/staj-arsivi"
              className="inline-flex items-center gap-2 text-secondary hover:text-primary font-label text-label-md font-semibold tracking-wide group transition-colors"
            >
              <span>Devamını Gör</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-lg">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((card, idx) => (
              <article
                key={card.id || idx}
                className="relative flex min-h-[370px] flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 text-on-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-secondary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CompanyLogo name={card.companyName} logoUrl={card.companyLogo} className="h-11 w-11 shrink-0 rounded-lg border border-outline-variant/50" textClassName="text-sm" />
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold leading-tight text-primary">{card.companyName}</h3>
                      <p className="mt-1 truncate font-label text-label-sm tracking-wide text-on-surface-variant">{card.role}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-2.5 py-2 font-label text-right text-primary">
                      <div className="text-[9px] text-on-surface-variant">Firma Ort. Puanı</div>
                      <strong className="text-sm">{card.companyRating !== null && card.companyRating !== undefined ? card.companyRating.toFixed(1) : '-'} <span className="text-xs text-secondary">★</span></strong>
                    </div>
                    <div className="mt-1 font-label text-[9px] text-on-surface-variant">{card.reviewCount || 0} ONAYLI YORUM</div>
                  </div>

                </div>

                <div className="my-4 flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-label text-[10px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px] text-secondary">school</span>
                  <span>{card.university || 'Üniversite belirtilmemiş'}</span>
                  <span className="text-outline-variant">•</span>
                  <span>{card.city || 'Şehir belirtilmemiş'}</span>
                  <span className="ml-auto text-on-surface-variant">{card.term || 'Dönem belirtilmemiş'}</span>
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="mb-4 border-l-2 border-secondary pl-3 text-xs leading-5 text-on-surface line-clamp-4">
                    <p><strong className="font-label text-[10px] tracking-wide text-secondary">Deneyim:</strong> {card.reviewSnippet}</p>
                  </div>
                  <div className="mb-4 flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 font-label text-[11px]">
                    <span className="text-on-surface-variant">Stajyer Değerlendirmesi</span>
                    <strong className="text-primary">{card.internRating !== null && card.internRating !== undefined ? `${card.internRating.toFixed(1)} / 5.0` : '-'} <span className="text-secondary">★</span></strong>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-outline-variant/40 pt-4">
                    {card.isVerified ? (
                      <span className="inline-flex items-center gap-1.5 font-label text-[11px] font-semibold text-primary"><span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-secondary/15 text-secondary"><span className="material-symbols-outlined text-[13px]">check</span></span>DOĞRULANMIŞ DENEYİM</span>
                    ) : <span className="font-label text-[11px] text-on-surface-variant">DENEYİM KAYDI</span>}
                    <Link to={`/internship/${card.id}`} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 font-label text-[11px] font-semibold text-on-secondary shadow-sm transition-colors hover:bg-primary-container">Deneyim Detayı <span className="material-symbols-outlined text-[15px]">arrow_forward</span></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 3. ARA BANNER (Kendi Deneyimini Kaydet) */}
        <section className="w-full bg-surface-container-low border-y border-outline-variant/40 py-12 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-surface-container-high/50 pointer-events-none"></div>
          <div className="max-w-[1200px] mx-auto px-4 md:px-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display text-2xl font-semibold text-primary mb-2 tracking-tight">
                Kendi Deneyimini Kaydet
              </h3>
              <p className="font-body text-sm text-on-surface-variant max-w-lg leading-relaxed">
                Arşive katkıda bulun, diğer adayların kariyer yolculuklarına ışık tut. Değerlendirmelerin anonimleştirilerek güvenle saklanır.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                to={isAuth ? '/internship/new' : '/auth'}
                className="bg-secondary text-on-secondary border border-secondary hover:bg-primary-container hover:border-primary-container transition-all shadow-sm font-label text-label-md font-semibold tracking-wide px-8 py-4 rounded-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">edit_document</span>
                <span>Deneyim Ekle</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 4. STAJ HABERLERİ & ANALİZLER */}
        <section className="w-full max-w-[1200px] mx-auto px-4 md:px-10 py-10">
          <div className="flex flex-col mb-6">
            <h2 className="font-display text-2xl font-bold text-primary mb-1 tracking-tight">Staj Haberleri</h2>
            <p className="font-label text-label-sm text-on-surface-variant tracking-wide">
              SEKTÖREL ANALİZLER VE HABERLER
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {[featuredArticle, ...sideArticles].map((article) => (
              <article
                key={article.id}
                className="flex flex-col border-l-2 border-outline-variant/50 pl-5 hover:border-secondary transition-colors group cursor-pointer py-1"
                onClick={() => window.open(article.sourceUrl, '_blank')}
              >
                <span className="font-label text-[11px] text-secondary tracking-wide mb-1.5 block">
                  {article.category}
                </span>
                <h4 className="font-display text-lg font-semibold text-primary mb-1.5 group-hover:text-secondary transition-colors leading-snug">
                  {article.title}
                </h4>
                <p className="font-body text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>
                <span className="font-label text-[11px] text-on-surface-variant mt-2.5 block">
                  {new Date(article.publishedAt).toLocaleDateString('tr-TR')}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* 5. FOOTER */}
        <footer className="w-full bg-surface-container-low border-t border-outline-variant/40 py-12 mt-8">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="Staj'ın Logo" className="h-9 w-auto object-contain" />
              </div>
              <p className="text-on-surface-variant font-body text-xs leading-relaxed">
                Ekip, iş yükü, öğrenme fırsatları... Stajyerlerin gözünden şirketleri keşfet.
              </p>
            </div>

            <div className="flex gap-12 font-label">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface mb-1">Arşiv</span>
                <Link to="/discover" className="text-xs text-on-surface-variant hover:text-secondary transition-colors">Koleksiyonlar</Link>
                <Link to="/discover" className="text-xs text-on-surface-variant hover:text-secondary transition-colors">Doğrulama</Link>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface mb-1">Kurumsal</span>
                <a href="#" className="text-xs text-on-surface-variant hover:text-secondary transition-colors">Hakkımızda</a>
                <a href="#" className="text-xs text-on-surface-variant hover:text-secondary transition-colors">İletişim</a>
              </div>
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-6 md:px-10 mt-10 pt-6 border-t border-outline-variant/40 text-center">
            <span className="text-[11px] text-on-surface-variant font-label tracking-tight">
              © 2026 Staj'ın • Staj Değerlendirme Platformu • Tüm Hakları Saklıdır
            </span>
          </div>
        </footer>

      </div>
    </main>
  )
}