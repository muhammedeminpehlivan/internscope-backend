import { useState, useEffect, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { internshipService } from '../services/internshipService'
import { newsService, type NewsItem } from '../services/newsService'
import { useAuth } from '../hooks/useAuth'

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery)}`)
    } else {
      navigate('/discover')
    }
  }

  return (
    <main className="w-full bg-[#101415] min-h-screen text-[#e0e3e5] font-['Inter'] selection:bg-[#700080] selection:text-white">
      <div className="flex flex-col w-full">
        
        {/* 1. HERO SECTION */}
        <section className="relative w-full min-h-[70vh] flex items-center justify-center pt-20 pb-16 px-4 md:px-10 overflow-hidden">
          {/* Çizgili Izgara Arka Planı */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern height="40" id="hero-grid" patternUnits="userSpaceOnUse" width="40">
                  <path className="text-[#45464c]" d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
                </pattern>
              </defs>
              <rect fill="url(#hero-grid)" height="100%" width="100%"></rect>
            </svg>
          </div>

          {/* Mor Gradyan Işıltısı */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#700080]/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
            {/* Rozet */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#272a2c] border border-[#1E293B] mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
              <span className="font-['IBM_Plex_Mono'] text-xs text-[#F59E0B] uppercase tracking-widest">
                Prestijli Kayıt Sistemi
              </span>
            </div>

            {/* Başlık */}
            <h1 className="font-['Newsreader'] text-4xl sm:text-5xl md:text-6xl font-bold text-[#e0e3e5] mb-6 leading-tight">
              Staj yapmadan önce,<br />
              <span className="text-[#c6c6cd] font-normal italic">orada çalışanlara sor.</span>
            </h1>

            {/* Alt Başlık */}
            <p className="text-base sm:text-lg text-[#c6c6cd] max-w-2xl mb-12 opacity-80 leading-relaxed">
              Kurumsal kariyer geçmişinin ve akademik liyakatin dijital mahzeni. Doğrulanmış öğrenci deneyimleriyle, prestijli kayıtların güvenli adresi.
            </p>

            {/* Arama Barı */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#700080] to-[#F59E0B] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-[#1d2022] border border-[#1E293B] rounded-xl shadow-xl flex items-center p-2 focus-within:ring-1 focus-within:ring-[#700080] transition-shadow">
                <span className="material-symbols-outlined text-[#45464c] px-4 text-2xl">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Şirket, pozisyon veya sektör ara..."
                  className="w-full bg-transparent border-none text-[#e0e3e5] text-base placeholder-[#909097] focus:outline-none focus:ring-0 py-3"
                />
                <button
                  type="submit"
                  className="bg-[#700080] hover:bg-[#7c158b] text-[#F8FAFC] font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shrink-0 font-medium"
                >
                  <span>Sorgula</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </form>

            {/* Sayaçlar (İstatistik Barı) */}
            <div className="mt-14 mb-2 flex flex-col items-center">
              <h2 className="font-['Newsreader'] text-xl font-medium text-[#e0e3e5] mb-1">İstatistikler</h2>
              <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#45464c] uppercase tracking-widest">Genel Platform Verileri</p>
            </div>

            <div className="mt-4 flex flex-wrap justify-center items-center gap-8 md:gap-16">
              <div className="flex flex-col items-center">
                <span className="font-['IBM_Plex_Mono'] text-2xl font-bold text-[#e0e3e5]">4,521</span>
                <span className="font-['IBM_Plex_Mono'] text-xs text-[#45464c] uppercase tracking-wider mt-1">Doğrulanmış Kayıt</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-[#1E293B]"></div>
              <div className="flex flex-col items-center">
                <span className="font-['IBM_Plex_Mono'] text-2xl font-bold text-[#e0e3e5]">1,204</span>
                <span className="font-['IBM_Plex_Mono'] text-xs text-[#45464c] uppercase tracking-wider mt-1">Kurum Endeksi</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-[#1E293B]"></div>
              <div className="flex flex-col items-center">
                <span className="font-['IBM_Plex_Mono'] text-2xl font-bold text-[#e0e3e5]">18,940</span>
                <span className="font-['IBM_Plex_Mono'] text-xs text-[#45464c] uppercase tracking-wider mt-1">Aktif Akademik Üye</span>
              </div>
            </div>
          </div>
        </section>

        {/* Ayrıcı Çizgi */}
        <div className="w-full border-t border-[#1E293B] border-dashed opacity-50 my-4 max-w-[1200px] mx-auto"></div>

        {/* 2. SON DEĞERLENDİRMELER (KARTLAR) */}
        <section className="w-full max-w-[1200px] mx-auto px-4 md:px-10 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="font-['Newsreader'] text-3xl font-bold text-[#e0e3e5] mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#F59E0B] text-3xl">verified</span>
                Son Değerlendirmeler
              </h2>
              <p className="font-['IBM_Plex_Mono'] text-xs text-[#45464c] uppercase tracking-widest">
                Paylaşılan Son Öğrenci Deneyimleri
              </p>
            </div>
            <Link
              to="/staj-arsivi"
              className="inline-flex items-center gap-2 text-[#700080] hover:text-[#fbaaff] font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider group transition-colors"
            >
              <span>Devamını Gör</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-lg">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((card, idx) => (
              <article
                key={card.id || idx}
                className="relative flex min-h-[370px] flex-col overflow-hidden rounded-xl border border-[#252c38] bg-[#0d1118] p-5 text-[#e0e3e5] shadow-[0_18px_45px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(112,0,128,0.18)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#303847] bg-[#202631]">
                        {card.companyLogo ? (
                          <img className="h-8 w-8 object-contain" alt={card.companyName} src={card.companyLogo} />
                        ) : (
                          <span className="material-symbols-outlined text-[22px] text-[#657084]">domain</span>
                        )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-['Newsreader'] text-lg font-bold leading-tight text-[#e8eaf0]">{card.companyName}</h3>
                      <p className="mt-1 truncate font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider text-[#8d96a8]">{card.role}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="rounded-lg border border-[#624a08] bg-[#241d0b] px-2.5 py-2 font-['IBM_Plex_Mono'] text-right text-[#f5b923]">
                      <div className="text-[8px] uppercase text-[#c59d3a]">Firma Ort. Puanı</div>
                      <strong className="text-sm">{card.companyRating !== null && card.companyRating !== undefined ? card.companyRating.toFixed(1) : '-'} <span className="text-xs">★</span></strong>
                    </div>
                    <div className="mt-1 font-['IBM_Plex_Mono'] text-[8px] text-[#657084]">{card.reviewCount || 0} ONAYLI YORUM</div>
                  </div>

                </div>

                <div className="my-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#252c38] bg-[#151b25] px-3 py-2 font-['IBM_Plex_Mono'] text-[9px] text-[#c7cbd5]">
                  <span className="material-symbols-outlined text-[14px] text-[#9955b2]">school</span>
                  <span>{card.university || 'Üniversite belirtilmemiş'}</span>
                  <span className="text-[#38404d]">•</span>
                  <span>{card.city || 'Şehir belirtilmemiş'}</span>
                  <span className="ml-auto text-[#8d96a8]">{card.term || 'Dönem belirtilmemiş'}</span>
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="mb-4 border-l-2 border-[#8c3ba6] pl-3 text-xs leading-5 text-[#c9cbd3] line-clamp-4">
                    <p><strong className="font-['IBM_Plex_Mono'] text-[9px] uppercase tracking-wide text-[#a982b4]">Deneyim:</strong> {card.reviewSnippet}</p>
                  </div>
                  <div className="mb-4 flex items-center justify-between rounded-lg border border-[#252c38] bg-[#151b25] px-3 py-2 font-['IBM_Plex_Mono'] text-[10px]">
                    <span className="text-[#9ea8bb]">Stajyer Değerlendirmesi</span>
                    <strong className="text-[#f5b923]">{card.internRating !== null && card.internRating !== undefined ? `${card.internRating.toFixed(1)} / 5.0` : '-'} ★</strong>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#252c38] pt-4">
                    {card.isVerified ? (
                      <span className="inline-flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-[10px] font-bold text-[#e0e3e5]"><span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#3d310d] text-[#F59E0B]"><span className="material-symbols-outlined text-[13px]">check</span></span>DOĞRULANMIŞ DENEYİM</span>
                    ) : <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#657084]">DENEYİM KAYDI</span>}
                    <Link to={`/internship/${card.id}`} className="inline-flex items-center gap-1 rounded-lg bg-[#9224dc] px-3 py-2 font-['IBM_Plex_Mono'] text-[10px] font-bold text-white shadow-[0_6px_18px_rgba(146,36,220,0.28)] transition-colors hover:bg-[#a93ff0]">Deneyim Detayı <span className="material-symbols-outlined text-[15px]">arrow_forward</span></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 3. ARA BANNER (Kendi Deneyimini Kaydet) */}
        <section className="w-full bg-[#272a2c] border-y border-[#1E293B] py-12 relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 md:px-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-['Newsreader'] text-2xl font-semibold text-[#e0e3e5] mb-2">
                Kendi Deneyimini Kaydet
              </h3>
              <p className="text-sm text-[#c6c6cd] max-w-lg leading-relaxed">
                Arşive katkıda bulun, diğer adayların kariyer yolculuklarına ışık tut. Değerlendirmelerin anonimleştirilerek güvenle saklanır.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                to={isAuth ? '/internship/new' : '/auth'}
                className="bg-[#F8FAFC] text-[#050B1A] border border-[#1E293B] hover:bg-[#F59E0B] hover:text-[#050B1A] hover:border-[#F59E0B] transition-all shadow-md font-['IBM_Plex_Mono'] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">edit_document</span>
                <span>Kayıt Ekle</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 4. STAJ HABERLERİ & ANALİZLER */}
        <section className="w-full max-w-[1200px] mx-auto px-4 md:px-10 py-16">
          <div className="flex flex-col mb-10">
            <h2 className="font-['Newsreader'] text-3xl font-bold text-[#e0e3e5] mb-1">Staj Haberleri</h2>
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#45464c] uppercase tracking-widest">
              SEKTÖREL ANALİZLER VE HABERLER
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sol Büyük Öne Çıkan Haber */}
            <article className="lg:col-span-8 group relative cursor-pointer" onClick={() => window.open(featuredArticle.sourceUrl, '_blank')}>
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-[#1d2022] border border-[#1E293B] mb-5 relative">
                {featuredArticle.imageUrl ? (
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                    alt={featuredArticle.title}
                    src={featuredArticle.imageUrl}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#700080] to-[#F59E0B] opacity-20"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050B1A] via-transparent to-transparent opacity-70"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="inline-block px-3 py-1 bg-[#700080]/90 backdrop-blur text-[#F8FAFC] font-['IBM_Plex_Mono'] uppercase tracking-wider text-[11px] rounded mb-2 shadow-md">
                    {featuredArticle.category}
                  </span>
                </div>
              </div>

              <h3 className="font-['Newsreader'] text-2xl sm:text-3xl text-[#e0e3e5] leading-snug mb-3 group-hover:text-[#c0c6db] transition-colors">
                {featuredArticle.title}
              </h3>
              <p className="text-sm sm:text-base text-[#c6c6cd] line-clamp-2 leading-relaxed">
                {featuredArticle.summary}
              </p>
              <div className="mt-4 flex items-center gap-3 text-[#909097] font-['IBM_Plex_Mono'] text-xs">
                <span>{new Date(featuredArticle.publishedAt).toLocaleDateString('tr-TR')}</span>
                <span className="w-1 h-1 bg-[#909097] rounded-full"></span>
                <span>{featuredArticle.sourceName}</span>
              </div>
            </article>

            {/* Sağ Yan Haber Listesi */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-6">
              {sideArticles.map((article, index) => (
                <Fragment key={article.id}>
                  <article
                    className="flex flex-col border-l-2 border-[#1E293B] pl-5 hover:border-[#F59E0B] transition-colors group cursor-pointer py-1"
                    onClick={() => window.open(article.sourceUrl, '_blank')}
                  >
                    <span className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-widest mb-1.5 block">
                      {article.category}
                    </span>
                    <h4 className="font-['Newsreader'] text-lg text-[#e0e3e5] mb-1.5 group-hover:text-[#c0c6db] transition-colors leading-snug">
                      {article.title}
                    </h4>
                    <p className="text-xs text-[#c6c6cd] line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                    <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#909097] mt-2.5 block">
                      {new Date(article.publishedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </article>
                  {index < sideArticles.length - 1 && (
                    <div className="w-full h-px bg-[#1E293B]/50"></div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* 5. FOOTER */}
        <footer className="w-full bg-[#0b0f10] border-t border-[#1E293B] py-12 mt-8">
          <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-2 text-[#e0e3e5]">
                <span className="material-symbols-outlined text-[20px]">history_edu</span>
                <span className="font-['Newsreader'] text-base uppercase tracking-widest font-bold">Staj'ın Archive</span>
              </div>
              <p className="text-[#c6c6cd] font-['IBM_Plex_Mono'] text-xs leading-relaxed opacity-70">
                Kurumsal kariyer geçmişinin ve akademik liyakatin dijital mahzeni. Prestijli kayıtların güvenli adresi.
              </p>
            </div>

            <div className="flex gap-12 font-['IBM_Plex_Mono']">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#e0e3e5] mb-1">Arşiv</span>
                <Link to="/discover" className="text-xs text-[#c6c6cd] hover:text-[#F59E0B] transition-colors">Koleksiyonlar</Link>
                <Link to="/discover" className="text-xs text-[#c6c6cd] hover:text-[#F59E0B] transition-colors">Doğrulama</Link>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#e0e3e5] mb-1">Kurumsal</span>
                <a href="#" className="text-xs text-[#c6c6cd] hover:text-[#F59E0B] transition-colors">Hakkımızda</a>
                <a href="#" className="text-xs text-[#c6c6cd] hover:text-[#F59E0B] transition-colors">İletişim</a>
              </div>
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-6 md:px-10 mt-10 pt-6 border-t border-[#1E293B]/40 text-center">
            <span className="text-[11px] text-[#909097] font-['IBM_Plex_Mono'] uppercase tracking-tighter">
              © 2026 Staj'ın Archive • Prestijli Kayıt Sistemi • Tüm Hakları Saklıdır
            </span>
          </div>
        </footer>

      </div>
    </main>
  )
}