import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { companyService } from '../services/companyService'
import { useAuth } from '../hooks/useAuth'

interface EvaluationItem {
  id: number | string
  studentName: string
  studentUniversity: string
  studentLinkedinUrl?: string
  internshipRole: string
  internshipTerm: string
  overallRating: number
  learningRating: number
  mentorshipRating: number
  environmentRating: number
  responsibilityRating: number
  maxRating: number
  reviewText: string
  isVerified: boolean
  startDate?: string
  endDate?: string
  cityName?: string
  stipendMin?: number
  stipendMax?: number
  currency?: string
  returnOfferReceived?: boolean
  salaryRating?: number
  techInfraRating?: number
  interview?: {
    applicationMethod?: string
    stageCount?: number
    description?: string
  }
  additionalTips?: string
}

interface CommentItem {
  id: number | string
  commenterName: string
  commenterInitials: string
  commentDate: string
  commentText: string
  profileUrl?: string
}

function normalizeLinkedInUrl(value?: string) {
  if (!value) return 'https://www.linkedin.com'

  const trimmed = value.trim()
  if (!trimmed) return 'https://www.linkedin.com'

  const lowered = trimmed.toLowerCase()

  if (lowered.startsWith('http://') || lowered.startsWith('https://')) {
    return trimmed
  }

  if (lowered.startsWith('linkedin.com')) {
    return `https://${trimmed}`
  }

  if (lowered.startsWith('www.linkedin.com')) {
    return `https://${trimmed}`
  }

  if (lowered.startsWith('/in/')) {
    return `https://www.linkedin.com${trimmed}`
  }

  if (trimmed.startsWith('in/')) {
    return `https://www.linkedin.com/${trimmed}`
  }

  return `https://www.linkedin.com/in/${trimmed.replace(/^\/+/, '')}`
}

export default function CompanyProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()

  const [companyName, setCompanyName] = useState(slug || 'TechNova Solutions A.Ş.')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [newComment, setNewComment] = useState('')

  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([
    {
      id: 1,
      studentName: 'Ahmet Yılmaz',
      studentUniversity: 'İTÜ',
      studentLinkedinUrl: 'https://linkedin.com',
      internshipRole: 'Yazılım Mühendisliği Stajyeri',
      internshipTerm: 'Yaz 2023 - 45 İş Günü',
      overallRating: 8.5,
      learningRating: 9,
      mentorshipRating: 8,
      environmentRating: 7,
      responsibilityRating: 8,
      maxRating: 10,
      reviewText: "TechNova'daki stajım boyunca mikroservis mimarisi üzerine kurulu gerçek bir projede yer aldım. Ekip arkadaşları çok yardımseverdi ve her hafta düzenlenen teknik sunumlar vizyonumu çok geliştirdi. Ofis imkanları ve donanım gerçekten üst düzeydeydi.",
      isVerified: true
    }
  ])

  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: 1,
      commenterName: 'Mert Aksoy',
      commenterInitials: 'MA',
      commentDate: '12 Eki 2024',
      commentText: 'Mülakat sürecinde algoritma soruları hangi zorluk seviyesindeydi? LeetCode Medium ayarında mı?',
      profileUrl: '#'
    }
  ])

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const res = await companyService.getBySlug(slug || '')
        if (res.data) {
          if (res.data.name) setCompanyName(res.data.name)
          if (res.data.reviews?.length) {
            setEvaluations(res.data.reviews.map((review: any) => {
              const scores = review.scores || {}
              const scoreValues = [
                scores.learningScore,
                scores.mentoringScore,
                scores.techInfraScore,
                scores.workEnvironmentScore,
                scores.salaryScore,
              ].filter((value): value is number => typeof value === 'number')

              return {
                id: review.id,
                studentName: review.isAnonymous ? 'Anonim Öğrenci' : review.authorName || 'Anonim Öğrenci',
                studentUniversity: review.universityName || 'Üniversite belirtilmemiş',
                studentLinkedinUrl: normalizeLinkedInUrl(review.authorLinkedInProfileUrl),
                internshipRole: review.companyDepartment || 'Stajyer',
                internshipTerm: review.term || 'Belirtilmemiş',
                overallRating: review.averageScore || (scoreValues.length > 0
                  ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length
                  : 0),
                learningRating: scores.learningScore || 0,
                mentorshipRating: scores.mentoringScore || 0,
                environmentRating: scores.workEnvironmentScore || 0,
                responsibilityRating: scores.techInfraScore || 0,
                maxRating: 5,
                reviewText: review.description || scores.additionalTips || 'Değerlendirme metni bulunmuyor.',
                isVerified: review.isSgkVerified || false,
                startDate: review.startDate,
                endDate: review.endDate,
                cityName: review.cityName,
                stipendMin: review.stipendMin,
                stipendMax: review.stipendMax,
                currency: review.currency,
                returnOfferReceived: review.returnOfferReceived,
                salaryRating: scores.salaryScore,
                techInfraRating: scores.techInfraScore,
                interview: review.interview,
                additionalTips: scores.additionalTips,
              }
            }))
          }
          if (res.data.comments?.length) setComments(res.data.comments)
        }
      } catch (err) {
        console.warn('Firma detay API isteği başarısız, mock veri kullanılıyor:', err)
      }
    }
    fetchCompanyData()
  }, [slug])

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const displayName = user?.fullName || 'Anonim Öğrenci'
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    const item: CommentItem = {
      id: Date.now(),
      commenterName: displayName,
      commenterInitials: initials || 'AÖ',
      commentDate: 'Az önce',
      commentText: newComment
    }

    setComments([item, ...comments])
    setNewComment('')
  }

  return (
    <main className="w-full pt-6 bg-[#101415] text-[#e0e3e5] min-h-screen font-['Inter']">
      <div className="flex flex-col w-full">
        {/* Header Section */}
        <div className="flex flex-col relative w-full px-6 py-12 z-10 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'linear-gradient(to right, #45464c 1px, transparent 1px), linear-gradient(to bottom, #45464c 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />
          <div className="flex flex-col lg:flex-row justify-between items-end gap-8 relative max-w-[1200px] mx-auto w-full">
            <div className="flex flex-col max-w-2xl">
              <div className="flex items-center gap-1 mb-4">
                <span className="font-['IBM_Plex_Mono'] text-xs text-[#ffddb8] tracking-widest uppercase">Kayıt: TN-2023-089</span>
              </div>
              <h1 className="font-['Newsreader'] text-4xl sm:text-5xl font-bold text-[#e0e3e5] mb-3">
                {companyName} Staj Değerlendirmeleri
              </h1>
              <p className="text-lg text-[#c6c6cd]">
                Kurumsal AR-GE ve yazılım süreçleri hakkında doğrulanmış stajyer deneyimleri ve detaylı puanlama arşivi.
              </p>
            </div>

            {/* Şirket Puan Kartı */}
            <div className="bg-[#272a2c] p-6 rounded-xl border border-[#45464c] flex items-center gap-6 shadow-lg min-w-[300px]">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center p-2 shrink-0">
                <span className="material-symbols-outlined text-4xl text-[#101415]">domain</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-4xl font-bold font-['Newsreader'] text-[#c0c6db]">8.5</span>
                  <span className="text-[#c6c6cd] font-['IBM_Plex_Mono'] text-xs">/ 10</span>
                </div>
                <div className="font-['Newsreader'] text-xl font-medium text-[#e0e3e5]">{companyName}</div>
                <div className="text-xs font-['IBM_Plex_Mono'] text-[#c6c6cd] uppercase tracking-widest">Yazılım &amp; Bilişim</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtre Barı */}
        <div className="w-full px-6 py-4 relative z-20">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col md:flex-row gap-3 justify-end">
            <div className="w-full md:w-56 relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full h-11 pl-4 pr-10 bg-[#272a2c] text-[#e0e3e5] text-sm rounded-full border border-[#45464c] appearance-none focus:outline-none cursor-pointer"
              >
                <option value="">Tüm Bölümler</option>
                <option value="ce">Bilgisayar Müh.</option>
                <option value="ee">Elektrik Elektronik Müh.</option>
                <option value="ie">Endüstri Müh.</option>
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c6c6cd] pointer-events-none text-[18px]">expand_more</span>
            </div>

            <div className="w-full md:w-48 relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full h-11 pl-4 pr-10 bg-[#272a2c] text-[#e0e3e5] text-sm rounded-full border border-[#45464c] appearance-none focus:outline-none cursor-pointer"
              >
                <option value="">Tüm İller</option>
                <option value="istanbul">İstanbul</option>
                <option value="ankara">Ankara</option>
                <option value="izmir">İzmir</option>
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#c6c6cd] pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* Değerlendirme Listesi */}
        <div className="w-full px-6 py-8 relative z-10">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
            {evaluations.map((item) => (
              <div key={item.id} className="bg-[#272a2c] p-6 rounded-xl border border-[#45464c]/40 shadow-lg flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-['Newsreader'] text-xl font-medium text-[#e0e3e5]">
                        <a
                          href={normalizeLinkedInUrl(item.studentLinkedinUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[#c0c6db] transition-colors underline decoration-[#45464c] underline-offset-4"
                        >
                          {item.studentName} — {item.studentUniversity}
                        </a>
                      </span>
                      {item.isVerified && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-[#700080]/15 rounded-full border border-[#700080]/30">
                          <span className="material-symbols-outlined text-[#fbaaff] text-[14px]">verified</span>
                          <span className="text-[10px] font-bold text-[#fbaaff] uppercase tracking-widest">DOĞRULANMIŞ</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[#c6c6cd] font-['IBM_Plex_Mono'] text-xs">
                      {item.internshipRole} • {item.internshipTerm} {item.cityName ? `• ${item.cityName}` : ''}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="flex gap-0.5 text-[#F59E0B]">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                    <span className="text-xs font-['IBM_Plex_Mono'] text-[#c6c6cd]">Genel Puan: {item.overallRating}</span>
                  </div>
                </div>

                {/* Form puanlari */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-y border-[#45464c]/20">
                  <div className="flex flex-col">
                    <span className="text-xs font-['IBM_Plex_Mono'] text-[#c6c6cd] uppercase">Öğrenme</span>
                    <span className="font-['Newsreader'] text-xl text-[#c0c6db]">{item.learningRating}/{item.maxRating}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-['IBM_Plex_Mono'] text-[#c6c6cd] uppercase">Mentorluk</span>
                    <span className="font-['Newsreader'] text-xl text-[#c0c6db]">{item.mentorshipRating}/{item.maxRating}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-['IBM_Plex_Mono'] text-[#c6c6cd] uppercase">Ortam</span>
                    <span className="font-['Newsreader'] text-xl text-[#c0c6db]">{item.environmentRating}/{item.maxRating}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-['IBM_Plex_Mono'] text-[#c6c6cd] uppercase">Teknik</span>
                    <span className="font-['Newsreader'] text-xl text-[#c0c6db]">{item.techInfraRating || 0}/{item.maxRating}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-['IBM_Plex_Mono'] text-[#c6c6cd] uppercase">Ücret</span>
                    <span className="font-['Newsreader'] text-xl text-[#c0c6db]">{item.salaryRating || 0}/{item.maxRating}</span>
                  </div>
                </div>

                <p className="text-base text-[#c6c6cd] leading-relaxed italic">
                  "{item.reviewText}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#c6c6cd]">
                  <div>
                    <span className="font-semibold text-[#e0e3e5]">Tarih:</span> {item.startDate || '-'} - {item.endDate || '-'}
                  </div>
                  <div>
                    <span className="font-semibold text-[#e0e3e5]">İşe dönüş teklifi:</span> {item.returnOfferReceived ? 'Evet' : 'Hayır'}
                  </div>
                  <div>
                    <span className="font-semibold text-[#e0e3e5]">Tavsiye:</span> {item.additionalTips || 'Ek öneri bulunmuyor.'}
                  </div>
                  {item.interview && (
                    <div className="md:col-span-2">
                      <span className="font-semibold text-[#e0e3e5]">Mülakat:</span>{' '}
                      {item.interview.applicationMethod || 'Belirtilmemiş'}
                      {item.interview.description ? ` - ${item.interview.description}` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Yorum Yap / Soru Sor Bölümü */}
            <div className="mt-8 border-t border-[#45464c]/30 pt-8">
              <h2 className="font-['Newsreader'] text-2xl font-semibold text-[#e0e3e5] mb-4">Yorum Yap / Soru Sor</h2>
              
              <form onSubmit={handleAddComment} className="bg-[#1d2022] p-6 rounded-xl border border-[#45464c]/30 mb-8 shadow-sm">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Staj deneyimi hakkında bir soru sorun veya yorum yapın..."
                  className="w-full bg-[#191c1e] text-[#e0e3e5] border border-[#45464c]/50 rounded-lg p-4 text-sm focus:outline-none focus:border-[#c0c6db] focus:ring-1 focus:ring-[#c0c6db] placeholder-[#c6c6cd]/50 min-h-[120px] resize-y"
                />
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    className="bg-[#c0c6db] text-[#050b1a] px-6 py-2 rounded-full font-['IBM_Plex_Mono'] text-sm font-semibold hover:bg-[#dce2f8] transition-colors shadow-sm"
                  >
                    Gönder
                  </button>
                </div>
              </form>

              {/* Tartışmalar Listesi */}
              <div className="flex flex-col gap-4">
                <h3 className="font-['Newsreader'] text-xl text-[#c6c6cd] mb-2">Tartışmalar</h3>
                {comments.map((c) => (
                  <div key={c.id} className="bg-[#272a2c] p-5 rounded-xl border border-[#45464c]/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#7c158b] flex items-center justify-center text-[#f794ff] font-['IBM_Plex_Mono'] text-sm font-bold">
                        {c.commenterInitials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#e0e3e5]">
                          {c.commenterName}
                        </span>
                        <span className="text-xs font-['IBM_Plex_Mono'] text-[#c6c6cd]/70">{c.commentDate}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#c6c6cd]">{c.commentText}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}