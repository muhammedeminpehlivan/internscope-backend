import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { companyService } from '../services/companyService'
import { useAuth } from '../hooks/useAuth'
import CompanyLogo from '../components/CompanyLogo'

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
    <main className="w-full pt-6 bg-background text-on-surface min-h-screen font-body">
      <div className="flex flex-col w-full">
        {/* Header Section */}
        <div className="flex flex-col relative w-full px-6 py-12 z-10 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'linear-gradient(to right, #c4c6d1 1px, transparent 1px), linear-gradient(to bottom, #c4c6d1 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />
          <div className="flex flex-col lg:flex-row justify-between items-end gap-8 relative max-w-[1200px] mx-auto w-full">
            <div className="flex flex-col max-w-2xl">
              <div className="flex items-center gap-1 mb-4">
                <span className="font-label text-xs text-secondary tracking-wide">Kayıt: TN-2023-089</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary mb-3 tracking-tight">
                {companyName} Staj Değerlendirmeleri
              </h1>
              <p className="text-lg text-on-surface-variant">
                Kurumsal AR-GE ve yazılım süreçleri hakkında doğrulanmış stajyer deneyimleri ve detaylı puanlama arşivi.
              </p>
            </div>

            {/* Şirket Puan Kartı */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/50 flex items-center gap-6 shadow-sm min-w-[300px]">
              <CompanyLogo name={companyName} className="w-20 h-20 rounded-lg shrink-0" textClassName="text-2xl" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-4xl font-bold font-display text-primary">8.5</span>
                  <span className="text-on-surface-variant font-label text-xs">/ 10</span>
                </div>
                <div className="font-display text-xl font-medium text-primary">{companyName}</div>
                <div className="text-xs font-label text-on-surface-variant tracking-wide">Yazılım &amp; Bilişim</div>
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
                className="w-full h-11 pl-4 pr-10 bg-surface-container-lowest text-on-surface text-sm rounded-full border border-outline-variant/50 appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/40 cursor-pointer"
              >
                <option value="">Tüm Bölümler</option>
                <option value="ce">Bilgisayar Müh.</option>
                <option value="ee">Elektrik Elektronik Müh.</option>
                <option value="ie">Endüstri Müh.</option>
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
            </div>

            <div className="w-full md:w-48 relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full h-11 pl-4 pr-10 bg-surface-container-lowest text-on-surface text-sm rounded-full border border-outline-variant/50 appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/40 cursor-pointer"
              >
                <option value="">Tüm İller</option>
                <option value="istanbul">İstanbul</option>
                <option value="ankara">Ankara</option>
                <option value="izmir">İzmir</option>
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* Değerlendirme Listesi */}
        <div className="w-full px-6 py-8 relative z-10">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6">
            {evaluations.map((item) => (
              <div key={item.id} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/40 shadow-lg flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-display text-xl font-medium text-primary">
                        <a
                          href={normalizeLinkedInUrl(item.studentLinkedinUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-primary transition-colors underline decoration-outline-variant underline-offset-4"
                        >
                          {item.studentName} — {item.studentUniversity}
                        </a>
                      </span>
                      {item.isVerified && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary/15 rounded-full border border-secondary/30">
                          <span className="material-symbols-outlined text-secondary text-[14px]">verified</span>
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">DOĞRULANMIŞ</span>
                        </div>
                      )}
                    </div>
                    <div className="text-on-surface-variant font-label text-xs">
                      {item.internshipRole} • {item.internshipTerm} {item.cityName ? `• ${item.cityName}` : ''}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="flex gap-0.5 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                    <span className="text-xs font-label text-on-surface-variant">Genel Puan: {item.overallRating}</span>
                  </div>
                </div>

                {/* Form puanlari */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-y border-outline-variant/20">
                  <div className="flex flex-col">
                    <span className="text-xs font-label text-on-surface-variant uppercase">Öğrenme</span>
                    <span className="font-display text-xl text-primary">{item.learningRating}/{item.maxRating}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-label text-on-surface-variant uppercase">Mentorluk</span>
                    <span className="font-display text-xl text-primary">{item.mentorshipRating}/{item.maxRating}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-label text-on-surface-variant uppercase">Ortam</span>
                    <span className="font-display text-xl text-primary">{item.environmentRating}/{item.maxRating}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-label text-on-surface-variant uppercase">Teknik</span>
                    <span className="font-display text-xl text-primary">{item.techInfraRating || 0}/{item.maxRating}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-label text-on-surface-variant uppercase">Ücret</span>
                    <span className="font-display text-xl text-primary">{item.salaryRating || 0}/{item.maxRating}</span>
                  </div>
                </div>

                <p className="text-base text-on-surface-variant leading-relaxed italic">
                  "{item.reviewText}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-on-surface-variant">
                  <div>
                    <span className="font-semibold text-primary">Tarih:</span> {item.startDate || '-'} - {item.endDate || '-'}
                  </div>
                  <div>
                    <span className="font-semibold text-primary">İşe dönüş teklifi:</span> {item.returnOfferReceived ? 'Evet' : 'Hayır'}
                  </div>
                  <div>
                    <span className="font-semibold text-primary">Tavsiye:</span> {item.additionalTips || 'Ek öneri bulunmuyor.'}
                  </div>
                  {item.interview && (
                    <div className="md:col-span-2">
                      <span className="font-semibold text-primary">Mülakat:</span>{' '}
                      {item.interview.applicationMethod || 'Belirtilmemiş'}
                      {item.interview.description ? ` - ${item.interview.description}` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Yorum Yap / Soru Sor Bölümü */}
            <div className="mt-8 border-t border-outline-variant/30 pt-8">
              <h2 className="font-display text-2xl font-semibold text-primary mb-4">Yorum Yap / Soru Sor</h2>
              
              <form onSubmit={handleAddComment} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 mb-8 shadow-sm">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Staj deneyimi hakkında bir soru sorun veya yorum yapın..."
                  className="w-full bg-surface-container-lowest text-on-surface border border-outline-variant/50 rounded-lg p-4 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary placeholder-outline min-h-[120px] resize-y"
                />
                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    className="bg-secondary text-on-secondary px-6 py-2 rounded-full font-label text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm"
                  >
                    Gönder
                  </button>
                </div>
              </form>

              {/* Tartışmalar Listesi */}
              <div className="flex flex-col gap-4">
                <h3 className="font-display text-xl text-on-surface-variant mb-2">Tartışmalar</h3>
                {comments.map((c) => (
                  <div key={c.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-label text-sm font-bold">
                        {c.commenterInitials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label text-sm font-semibold text-primary">
                          {c.commenterName}
                        </span>
                        <span className="text-xs font-label text-on-surface-variant/70">{c.commentDate}</span>
                      </div>
                    </div>
                    <p className="text-sm text-on-surface-variant">{c.commentText}</p>
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