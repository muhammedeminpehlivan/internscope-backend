import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { internshipService } from '../services/internshipService'
import { userService } from '../services/userService'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../services/apiClient'

interface InternshipDetail {
  id: string | number
  companyName: string
  companyLogo?: string
  companyDepartment?: string
  authorName?: string
  userName?: string
  authorLinkedInProfileUrl?: string
  profilePictureUrl?: string
  linkedInProfileUrl?: string
  linkedinProfileUrl?: string
  linkedInUrl?: string
  universityName?: string
  departmentName?: string
  cityName?: string
  term?: string
  startDate?: string
  endDate?: string
  description?: string
  additionalNotes?: string
  isAnonymous?: boolean
  isSgkVerified?: boolean
  returnOfferReceived?: boolean
  status?: string
  averageScore?: number
  companyAverageScore?: number
  companyRating?: number
  companySlug?: string
  company?: { slug?: string; averageScore?: number; rating?: number; overallScore?: number; reviews?: any[] }
  scores?: {
    learningScore?: number
    mentoringScore?: number
    techInfraScore?: number
    workEnvironmentScore?: number
    salaryScore?: number
    wouldRecommend?: boolean
    additionalTips?: string
  }
  interview?: {
    applicationMethod?: string
    stageCount?: number
    description?: string
  }
}

interface DetailComment {
  id: number | string
  userId?: string
  name: string
  initials: string
  text: string
  date: string
  linkedInProfileUrl?: string
  profilePictureUrl?: string
  universityName?: string
  departmentName?: string
}

interface CommentReaction {
  positiveCount: number
  negativeCount: number
  userReaction?: boolean | null
}

const fallbackDetail: InternshipDetail = {
  id: '',
  companyName: 'Siemens',
  companyDepartment: 'Bilgisayar Mühendisliği Stajyeri',
  universityName: 'Ege Üniversitesi',
  departmentName: 'Bilgisayar Mühendisliği',
  cityName: 'İzmir',
  term: 'ShortTerm',
  startDate: '2024-06-01',
  endDate: '2024-08-31',
  description: 'Almanya merkezli ekiplerle koordineli akıllı fabrika simülasyonlarında bulundum. Süreç optimizasyonu ve küresel kurumsal disiplini öğrenmek için eşsiz bir ortam sağlandı. Mentorlar her soruda detaylı yönlendirme yaptı.',
  isSgkVerified: true,
  returnOfferReceived: false,
  status: 'Approved',
  scores: {
    learningScore: 4,
    mentoringScore: 4,
    techInfraScore: 5,
    workEnvironmentScore: 4,
    salaryScore: 3,
    wouldRecommend: true,
  },
  interview: {
    applicationMethod: 'LinkedIn',
    stageCount: 2,
    description: 'İK görüşmesi ve teknik ekip görüşmesi yapıldı.',
  },
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTerm(term?: string) {
  if (term === 'ShortTerm') return 'Kısa Dönem'
  if (term === 'LongTerm') return 'Uzun Dönem'
  return term || '-'
}

function formatValue(value?: string) {
  return value?.trim() || '-'
}

function normalizeLinkedInUrl(value?: string) {
  if (!value?.trim()) return ''
  const trimmed = value.trim()
  const lowered = trimmed.toLowerCase()
  if (lowered.startsWith('http://') || lowered.startsWith('https://')) return trimmed
  if (lowered.startsWith('linkedin.com')) return `https://${trimmed}`
  if (lowered.startsWith('www.linkedin.com')) return `https://${trimmed}`
  if (lowered.startsWith('/in/')) return `https://www.linkedin.com${trimmed}`
  if (lowered.startsWith('in/')) return `https://www.linkedin.com/${trimmed}`
  return `https://www.linkedin.com/in/${trimmed.replace(/^\/+/, '')}`
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

function getExperienceText(description?: string, additionalTips?: string) {
  const storedExperience = additionalTips?.match(/Deneyim:\s*([\s\S]*?)(?=\n\nEk (?:öneri|tavsiye):|$)/i)?.[1]?.trim()
  return description?.trim() || storedExperience || ''
}

function getAdviceText(additionalTips?: string) {
  return additionalTips?.match(/Ek (?:öneri|tavsiye):\s*([\s\S]*)/i)?.[1]?.trim() || ''
}

export default function InternshipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<InternshipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<DetailComment[]>([])
  const [commentReactions, setCommentReactions] = useState<Record<string, CommentReaction>>({})
  const [reactingCommentId, setReactingCommentId] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [reactionError, setReactionError] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [currentProfilePicture, setCurrentProfilePicture] = useState('')
  const [currentLinkedInProfileUrl, setCurrentLinkedInProfileUrl] = useState('')
  const [activeProfilePreview, setActiveProfilePreview] = useState<string | null>(null)

  const readCommentReactions = (data: any): CommentReaction => {
    if (Array.isArray(data)) {
      return data.reduce((result: CommentReaction, reaction: any) => {
        const isPositive = reaction.isPositive ?? reaction.positive ?? (reaction.type === 'like' || reaction.type === 'Like')
        if (isPositive) result.positiveCount += 1
        else result.negativeCount += 1
        return result
      }, { positiveCount: 0, negativeCount: 0 })
    }

    const source = data?.data || data?.result || data || {}
    return {
      positiveCount: Number(source.positiveCount ?? source.likeCount ?? source.likes ?? source.like ?? source.upvotes ?? 0),
      negativeCount: Number(source.negativeCount ?? source.dislikeCount ?? source.dislikes ?? source.dislike ?? source.downvotes ?? 0),
      userReaction: source.userReaction ?? source.currentUserReaction ?? source.isPositive ?? null,
    }
  }

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const profileResponse = await userService.getCurrentUser().catch(() => ({ data: null }))
        const profile = profileResponse.data
        if (profile?.profilePictureUrl) setCurrentProfilePicture(profile.profilePictureUrl)
        if (profile?.linkedInProfileUrl) setCurrentLinkedInProfileUrl(profile.linkedInProfileUrl)
        const response = await internshipService.getById(id || '')
        if (!response.data) throw new Error('Staj kaydı bulunamadı')
        let detailData = response.data as InternshipDetail & { user?: any; author?: any }
        detailData = {
          ...detailData,
          authorName: detailData.isAnonymous
            ? 'Anonim Öğrenci'
            : detailData.authorName || detailData.author?.fullName || detailData.user?.fullName || detailData.userName,
          authorLinkedInProfileUrl: detailData.authorLinkedInProfileUrl
            || detailData.linkedInProfileUrl
            || detailData.linkedinProfileUrl
            || detailData.linkedInUrl
            || detailData.author?.linkedInProfileUrl
            || detailData.author?.linkedinProfileUrl
            || detailData.author?.linkedInUrl
            || detailData.user?.linkedInProfileUrl
            || detailData.user?.linkedinProfileUrl
            || detailData.user?.linkedInUrl
            || detailData.user?.linkedinUrl
            || (profile?.fullName === (detailData.authorName || detailData.author?.fullName || detailData.user?.fullName)
              ? profile?.linkedInProfileUrl
              : ''),
          profilePictureUrl: detailData.profilePictureUrl
            || detailData.author?.profilePictureUrl
            || detailData.user?.profilePictureUrl
            || (profile?.fullName === detailData.authorName ? profile?.profilePictureUrl : ''),
        }
        try {
          const allInternshipsResponse = await internshipService.getAll()
          const allInternships = Array.isArray(allInternshipsResponse.data) ? allInternshipsResponse.data : allInternshipsResponse.data?.items || []
          const companyKey = normalizeCompanyName(detailData.companyName || '')
          const companyScores = allInternships
            .filter((internship: any) => normalizeCompanyName(internship.companyName || '') === companyKey)
            .map(getInternshipScore)
            .filter((score: number | null): score is number => score !== null)
          const companyAverage = companyScores.length
            ? companyScores.reduce((sum: number, score: number) => sum + score, 0) / companyScores.length
            : null
          detailData = { ...detailData, companyAverageScore: companyAverage }
        } catch (companyError) {
          console.warn('Aynı isimli firmaların puanı hesaplanamadı:', companyError)
        }
        setDetail(detailData)
        const [commentsResult] = await Promise.allSettled([
          internshipService.getComments(id || ''),
        ])
        if (commentsResult.status === 'fulfilled') {
          console.log('getComments response:', commentsResult.value)
          const commentItems = Array.isArray(commentsResult.value.data)
            ? commentsResult.value.data
            : Array.isArray(commentsResult.value.data?.data)
              ? commentsResult.value.data.data
              : commentsResult.value.data?.items || []
          console.log('commentItems:', commentItems)
          const mappedComments = commentItems.map((item: any) => {
            const name = item.userName || item.commenterName || item.authorName || item.user?.fullName || item.author?.fullName || 'Anonim Öğrenci'
            return {
              id: item.id,
              userId: item.userId || item.user?.id || item.author?.id,
              name,
              initials: name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'AÖ',
              text: item.content || item.commentText || '',
              date: item.createdAt ? formatDate(item.createdAt) : '-',
              linkedInProfileUrl: item.linkedInProfileUrl
                || item.linkedinProfileUrl
                || item.linkedInUrl
                || item.authorLinkedInProfileUrl
                || item.author?.linkedInProfileUrl
                || item.user?.linkedInProfileUrl
                || item.user?.linkedinUrl
                || (profile?.fullName === name ? profile?.linkedInProfileUrl : ''),
              profilePictureUrl: item.profilePictureUrl
                || item.authorProfilePictureUrl
                || item.author?.profilePictureUrl
                || item.user?.profilePictureUrl
                || (profile?.fullName === name ? profile?.profilePictureUrl : ''),
              universityName: item.universityName || item.user?.universityName || detailData.universityName,
              departmentName: item.departmentName || item.user?.departmentName || detailData.departmentName,
            }
          })
          setComments(mappedComments.reverse())
          const reactionResults = await Promise.allSettled(
            mappedComments.map((item) => internshipService.getCommentReactions(String(item.id)))
          )
          const reactionMap: Record<string, CommentReaction> = {}
          reactionResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              reactionMap[String(mappedComments[index].id)] = readCommentReactions(result.value.data)
            }
          })
          setCommentReactions(reactionMap)
        }
      } catch (error) {
        console.warn('Staj detay API isteği başarısız:', error)
        setDetail(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id])

  useEffect(() => {
    const profileLinks = document.querySelectorAll<HTMLAnchorElement>('article a[href*="linkedin.com"]')
    profileLinks.forEach((link) => {
      const container = link.parentElement
      const comment = comments.find((item) => item.name === link.textContent?.trim())
      if (!container || !comment || container.querySelector('[data-comment-meta]')) return

      const meta = document.createElement('p')
      meta.dataset.commentMeta = 'true'
      meta.textContent = `${comment.departmentName || 'Bölüm belirtilmemiş'} | ${comment.universityName || 'Üniversite belirtilmemiş'}`
      meta.className = 'text-[10px] text-[#8d96a8]'
      container.appendChild(meta)
    })
  }, [comments])

  const handleComment = async (event: FormEvent) => {
    event.preventDefault()
    const text = comment.trim()
    if (!text) return

    try {
      const response = await internshipService.addComment(id || '', text)
      console.log('Yorum response:', response)
      console.log('response.data:', response.data)
      console.log('typeof response.data:', typeof response.data)
      const item = response.data
      console.log('Comment item:', item)
      console.log('item?.id:', item?.id)
      const commentId = item?.id || Date.now()
      const name = user?.fullName || item?.userName || 'Anonim Öğrenci'
      setComments((current) => [{
        id: commentId,
        userId: user?.id,
        name,
        initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AÖ',
        text: item?.content || text,
        date: item?.createdAt ? formatDate(item.createdAt) : 'Az önce',
        linkedInProfileUrl: item?.linkedInProfileUrl || item?.linkedinProfileUrl || item?.authorLinkedInProfileUrl || item?.linkedInUrl || currentLinkedInProfileUrl,
        profilePictureUrl: item?.profilePictureUrl || item?.authorProfilePictureUrl || item?.author?.profilePictureUrl || currentProfilePicture,
        universityName: item?.universityName || detail?.universityName,
        departmentName: item?.departmentName || detail?.departmentName,
      }, ...current])
      setCommentReactions((current) => ({ ...current, [String(commentId)]: { positiveCount: 0, negativeCount: 0, userReaction: null } }))
      setComment('')
      setCommentError('')
    } catch (error) {
      console.warn('Yorum gönderilemedi:', error)
      setCommentError('Yorum gönderilemedi. Giriş yaptığınızdan ve hesabınızın doğrulandığından emin olun.')
    }
  }

  const handleCommentReaction = async (commentId: string, isPositive: boolean) => {
    setReactingCommentId(commentId)
    setReactionError('')
    try {
      await internshipService.reactToComment(commentId, isPositive)
      setCommentReactions((current) => {
        const previous = current[commentId] || { positiveCount: 0, negativeCount: 0, userReaction: null }
        const wasSameReaction = previous.userReaction === isPositive
        return {
          ...current,
          [commentId]: {
            positiveCount: Math.max(0, previous.positiveCount - (previous.userReaction === true ? 1 : 0) + (wasSameReaction ? 0 : isPositive ? 1 : 0)),
            negativeCount: Math.max(0, previous.negativeCount - (previous.userReaction === false ? 1 : 0) + (wasSameReaction ? 0 : isPositive ? 0 : 1)),
            userReaction: wasSameReaction ? null : isPositive,
          },
        }
      })
      const response = await internshipService.getCommentReactions(commentId)
      const serverReaction = readCommentReactions(response.data)
      setCommentReactions((current) => ({ ...current, [commentId]: serverReaction }))
    } catch (error) {
      console.warn('Yorum reaksiyonu gönderilemedi:', error)
      const apiError = error as any
      const message = apiError.response?.data?.message || apiError.response?.data?.title
      setReactionError(typeof message === 'string' ? message : 'Bu yoruma reaction verilemedi. Backend işlemi reddetmiş olabilir.')
    } finally {
      setReactingCommentId(null)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) return
    setDeletingCommentId(String(commentId))
    try {
      await apiClient.delete(`/internship/${id}/comments/${commentId}`)
      setComments((current) => current.filter((c) => c.id !== commentId))
    } catch (error) {
      console.warn('Yorum silinemedi:', error)
      setCommentError('Yorum silinemedi.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return
    setDeletingCommentId(String(commentId))
    try {
      await apiClient.put(`/internship/${id}/comments/${commentId}`, { content: editingCommentText })
      setComments((current) =>
        current.map((c) =>
          c.id === commentId ? { ...c, text: editingCommentText } : c
        )
      )
      setEditingCommentId(null)
      setEditingCommentText('')
    } catch (error) {
      console.warn('Yorum güncellenemedi:', error)
      setCommentError('Yorum güncellenemedi.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-[#101415] p-8 text-center text-[#c6c6cd]">Detay yükleniyor...</main>
  }

  if (!detail) {
    return <main className="min-h-screen bg-[#101415] p-8 text-center text-[#c6c6cd]">Bu staj değerlendirmesi bulunamadı.</main>
  }

  const scores = detail.scores || {}
  const scoreEntries = [
    ['Öğrenme Fırsatı', scores.learningScore],
    ['Mentorluk Kalitesi', scores.mentoringScore],
    ['Teknik Altyapı', scores.techInfraScore],
    ['Çalışma Ortamı', scores.workEnvironmentScore],
    ['Ücret / Yol Yardımı', scores.salaryScore],
  ]
  const scoreValues = scoreEntries.map(([, value]) => value).filter((value): value is number => typeof value === 'number')
  const internAverage = detail.averageScore ?? (scoreValues.length ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length : null)
  const companyAverage = detail.companyAverageScore ?? detail.companyRating ?? detail.company?.averageScore ?? detail.company?.rating ?? null
  const experienceText = getExperienceText(detail.description || detail.additionalNotes, scores.additionalTips)
  const adviceText = getAdviceText(scores.additionalTips)

  return (
    <main className="min-h-screen bg-[#101415] px-4 py-8 text-[#e0e3e5] font-['Inter']">
      <div className="mx-auto max-w-[1060px]">
        <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 font-['IBM_Plex_Mono'] text-xs text-[#a982b4] hover:text-white">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Staj Arşivine Dön
        </button>

        <section className="rounded-xl border border-[#252c38] bg-[#0d1118] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)] md:p-9">
          <div className="flex flex-col justify-between gap-6 border-b border-[#252c38] pb-7 md:flex-row md:items-start">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#303847] bg-[#202631]">
                {detail.companyLogo ? <img className="h-11 w-11 object-contain" src={detail.companyLogo} alt={detail.companyName} /> : <span className="material-symbols-outlined text-[30px] text-[#657084]">factory</span>}
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-['Newsreader'] text-3xl font-bold text-[#f2f3f6]">{detail.companyName}</h1>
                  <span className="rounded-full border border-[#72449b] bg-[#2a1740] px-2 py-1 font-['IBM_Plex_Mono'] text-[9px] font-bold text-[#c88cf1]">{formatTerm(detail.term)}</span>
                </div>
                <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-[#8d96a8]">{formatValue(detail.companyDepartment)}</p>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-[#c6c6cd]">
                  {detail.profilePictureUrl ? <img className="h-5 w-5 rounded-full object-cover" src={detail.profilePictureUrl} alt="" /> : <span className="material-symbols-outlined text-[16px] text-[#9955b2]">person</span>}
                  <span>Stajyer:</span>
                  {detail.authorName && detail.authorName !== 'Anonim Öğrenci' && normalizeLinkedInUrl(detail.authorLinkedInProfileUrl) ? (
                    <a
                      href={normalizeLinkedInUrl(detail.authorLinkedInProfileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#c88cf1] underline decoration-[#72449b] underline-offset-2 hover:text-white"
                    >
                      {detail.authorName}
                    </a>
                  ) : (
                    <span className="font-semibold text-white">{detail.authorName || 'Anonim Öğrenci'}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-left md:justify-end md:text-right">
              <div className="rounded-xl border border-[#624a08] bg-[#241d0b] px-4 py-3 font-['IBM_Plex_Mono'] text-[#f5b923]">
                <div className="text-[9px] uppercase text-[#c59d3a]">Firma Puanı</div>
                <strong>{companyAverage !== null ? companyAverage.toFixed(1) : '-'} / 5.0 ★</strong>
              </div>
              <div className="rounded-xl border border-[#624a08] bg-[#241d0b] px-4 py-3 font-['IBM_Plex_Mono'] text-[#f5b923]">
                <div className="text-[9px] uppercase text-[#c59d3a]">Stajyer Puanı</div>
                <strong>{internAverage !== null ? internAverage.toFixed(1) : '-'} / 5.0 ★</strong>
              </div>
              <p className="mt-2 font-['IBM_Plex_Mono'] text-[10px] text-[#657084]">{detail.isSgkVerified ? 'DOĞRULANMIŞ DENEYİM' : 'DENEYİM KAYDI'}</p>
            </div>
          </div>

          <div className="my-7 grid gap-3 rounded-xl border border-[#252c38] bg-[#151b25] p-4 text-xs text-[#c7cbd5] md:grid-cols-4">
            <div><span className="material-symbols-outlined mr-1 align-middle text-[15px] text-[#9955b2]">school</span>{formatValue(detail.universityName)}</div>
            <div><span className="material-symbols-outlined mr-1 align-middle text-[15px] text-[#9955b2]">category</span>{formatValue(detail.departmentName)}</div>
            <div><span className="material-symbols-outlined mr-1 align-middle text-[15px] text-[#9955b2]">location_on</span>{formatValue(detail.cityName)}</div>
            <div><span className="material-symbols-outlined mr-1 align-middle text-[15px] text-[#9955b2]">calendar_month</span>{formatDate(detail.startDate)} - {formatDate(detail.endDate)}</div>
          </div>

          <blockquote className="mb-8 border-l-2 border-[#8c3ba6] pl-5 text-base italic leading-7 text-[#c9cbd3]">
            {formatValue(experienceText)}
          </blockquote>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-[#252c38] bg-[#151b25] p-5">
              <h2 className="mb-4 font-['Newsreader'] text-xl font-bold text-white">Değerlendirme Detayları</h2>
              <div className="space-y-3">
                {scoreEntries.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 border-b border-[#252c38] pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-[#9ea8bb]">{label}</span>
                    <strong className="font-['IBM_Plex_Mono'] text-[#f5b923]">{typeof value === 'number' ? `${value} / 5` : '-'}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-[#252c38] bg-[#151b25] p-5">
              <h2 className="mb-4 font-['Newsreader'] text-xl font-bold text-white">Staj Süreci</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-[#9ea8bb]">Başvuru kanalı</dt><dd>{formatValue(detail.interview?.applicationMethod)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#9ea8bb]">İş teklifi</dt><dd>{detail.returnOfferReceived ? 'Aldım' : 'Almadım'}</dd></div>
              </dl>
              {detail.interview?.description && <p className="mt-4 border-t border-[#252c38] pt-4 text-sm leading-6 text-[#c6c6cd]">{detail.interview.description}</p>}
            </section>
          </div>

          {adviceText && <div className="mb-8 rounded-xl border border-[#252c38] bg-[#151b25] p-5"><h2 className="mb-2 font-['Newsreader'] text-xl font-bold text-white">Ek Tavsiye</h2><p className="whitespace-pre-line text-sm leading-6 text-[#c6c6cd]">{adviceText}</p></div>}

          <div className="border-t border-[#252c38] pt-7">
            <h2 className="mb-4 font-['Newsreader'] text-2xl font-bold text-white">Yorumlar</h2>
            <form onSubmit={handleComment} className="mb-6 flex flex-col gap-3 md:flex-row">
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder="Bu staj deneyimi hakkında yorum yapın..." className="min-h-14 flex-1 resize-y rounded-lg border border-[#303847] bg-[#151b25] p-3 text-sm text-white outline-none placeholder:text-[#657084] focus:border-[#9224dc]" />
              <button type="submit" className="inline-flex h-fit items-center justify-center gap-2 rounded-lg bg-[#9224dc] px-5 py-3 font-['IBM_Plex_Mono'] text-xs font-bold text-white hover:bg-[#a93ff0]">Yorum Gönder<span className="material-symbols-outlined text-[16px]">send</span></button>
            </form>
            {commentError && <p className="mb-4 text-sm text-[#f29aa8]">{commentError}</p>}
            {reactionError && <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-[#f29aa8]">{reactionError}</p>}
            {comments.length === 0 ? <p className="text-sm text-[#657084]">Henüz yorum yapılmamış. İlk yorumu siz yazın.</p> : <div className="space-y-3">{comments.map((item) => { const reaction = commentReactions[String(item.id)] || { positiveCount: 0, negativeCount: 0 }; const commentUrl = normalizeLinkedInUrl(item.linkedInProfileUrl); const profileHref = commentUrl || '#'; const isPreviewOpen = activeProfilePreview === String(item.id); return <article key={item.id} className="rounded-lg border border-[#252c38] bg-[#151b25] p-4"><div className="mb-2 flex items-center gap-2">{item.profilePictureUrl ? <img className="h-7 w-7 rounded-full object-cover" src={item.profilePictureUrl} alt="" /> : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a1740] font-['IBM_Plex_Mono'] text-[10px] text-[#c88cf1]">{item.initials}</span>}<div className="relative"><a href={profileHref} target={commentUrl ? '_blank' : undefined} rel={commentUrl ? 'noreferrer' : undefined} onClick={(event) => { if (!commentUrl) { event.preventDefault(); setActiveProfilePreview(isPreviewOpen ? null : String(item.id)) } }} className="text-sm font-semibold text-[#c88cf1] underline decoration-[#72449b] underline-offset-2 hover:text-white">{item.name}</a><div className={`absolute bottom-full left-0 z-30 mb-2 w-56 rounded-xl border border-[#3b2a4d] bg-[#111722] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-all duration-200 ${isPreviewOpen ? 'block opacity-100' : 'hidden opacity-0'}`}><div className="flex items-center gap-2">{item.profilePictureUrl ? <img className="h-9 w-9 rounded-full object-cover" src={item.profilePictureUrl} alt="" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a1740] text-xs text-[#c88cf1]">{item.initials}</span>}<div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{item.name}</p><p className="text-[10px] text-[#8d96a8]">Staj yorumu</p></div></div>{commentUrl && <a href={commentUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg bg-[#9224dc] px-3 py-2 text-center font-['IBM_Plex_Mono'] text-[10px] font-bold text-white hover:bg-[#a93ff0]">Profile Git</a>}</div></div><span className="text-xs text-[#657084]">{item.date}</span></div><p className="text-sm leading-6 text-[#c6c6cd]">{item.text}</p><div className="mt-3 flex items-center gap-2"><button type="button" disabled={reactingCommentId === String(item.id)} onClick={() => handleCommentReaction(String(item.id), true)} className="inline-flex items-center gap-1 rounded-lg border border-[#315b5b] px-2.5 py-1.5 text-xs text-[#65e0ba] hover:bg-[#1d3c3c] disabled:opacity-50"><span className="material-symbols-outlined text-[15px]">thumb_up</span>{reaction.positiveCount}</button><button type="button" disabled={reactingCommentId === String(item.id)} onClick={() => handleCommentReaction(String(item.id), false)} className="inline-flex items-center gap-1 rounded-lg border border-[#633b45] px-2.5 py-1.5 text-xs text-[#f29aa8] hover:bg-[#3c2029] disabled:opacity-50"><span className="material-symbols-outlined text-[15px]">thumb_down</span>{reaction.negativeCount}</button>{user?.id === item.userId && (editingCommentId === item.id ? <><input type="text" value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} className="flex-1 rounded-lg border border-[#303847] bg-[#151b25] px-2 py-1 text-xs text-white outline-none focus:border-[#9224dc]" /><button type="button" onClick={() => handleUpdateComment(String(item.id))} className="rounded-lg bg-[#65e0ba] px-2 py-1 font-['IBM_Plex_Mono'] text-xs font-bold text-[#151b25] hover:bg-[#4dc9a1]">Kaydet</button><button type="button" onClick={() => { setEditingCommentId(null); setEditingCommentText('') }} className="rounded-lg border border-[#657084] px-2 py-1 font-['IBM_Plex_Mono'] text-xs text-[#657084] hover:bg-[#252c38]">İptal</button></> : <><button type="button" onClick={() => { setEditingCommentId(String(item.id)); setEditingCommentText(item.text) }} className="rounded-lg border border-[#315b5b] px-2.5 py-1.5 text-xs text-[#65e0ba] hover:bg-[#1d3c3c]"><span className="material-symbols-outlined text-[15px]">edit</span></button><button type="button" disabled={deletingCommentId === String(item.id)} onClick={() => handleDeleteComment(String(item.id))} className="rounded-lg border border-[#633b45] px-2.5 py-1.5 text-xs text-[#f29aa8] hover:bg-[#3c2029] disabled:opacity-50"><span className="material-symbols-outlined text-[15px]">delete</span></button></>)}</div></article> })}</div>}
          </div>
        </section>
      </div>
    </main>
  )
}
