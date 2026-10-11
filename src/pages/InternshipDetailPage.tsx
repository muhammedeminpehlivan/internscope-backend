import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { internshipService } from '../services/internshipService'
import { userService } from '../services/userService'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../services/apiClient'
import CompanyLogo from '../components/CompanyLogo'

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
  isOwn?: boolean
  parentCommentId?: string | number | null
  hasReported?: boolean
  isHidden?: boolean
  replies?: DetailComment[]
}

interface MapCommentContext {
  userId?: string
  userFullName?: string
  fallbackLinkedIn?: string
  fallbackPicture?: string
  profileUniversity?: string
  profileDepartment?: string
  detailUniversity?: string
  detailDepartment?: string
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

const REPORT_REASONS = [
  { value: 'Profanity', label: 'Küfür / Hakaret' },
  { value: 'Spam', label: 'Spam' },
  { value: 'Harassment', label: 'Taciz' },
  { value: 'Misinformation', label: 'Yanlış bilgi' },
  { value: 'Other', label: 'Diğer' },
]

// Backend yorum nesnesini DetailComment'e çevirir; cevapları (replies) tek seviye nested map'ler
function mapComment(item: any, ctx: MapCommentContext): DetailComment {
  const name = item.userName || item.commenterName || item.authorName || item.user?.fullName || item.author?.fullName || 'Anonim Öğrenci'
  const isOwn = item.userId === ctx.userId || item.authorName === ctx.userFullName || item.user?.id === ctx.userId
  const replies = Array.isArray(item.replies) ? item.replies.map((reply: any) => mapComment(reply, ctx)) : []
  return {
    id: item.id,
    userId: item.userId || item.user?.id || item.author?.id,
    name,
    initials: name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toLocaleUpperCase('tr-TR') || 'AÖ',
    text: item.content || item.commentText || '',
    date: item.createdAt ? formatDate(item.createdAt) : '-',
    linkedInProfileUrl:
      item.linkedInProfileUrl ||
      item.linkedinProfileUrl ||
      item.linkedInUrl ||
      item.authorLinkedInProfileUrl ||
      item.author?.linkedInProfileUrl ||
      item.user?.linkedInProfileUrl ||
      item.user?.linkedinUrl ||
      ctx.fallbackLinkedIn,
    profilePictureUrl:
      item.profilePictureUrl ||
      item.authorProfilePictureUrl ||
      item.author?.profilePictureUrl ||
      item.user?.profilePictureUrl ||
      (isOwn && ctx.fallbackPicture) ||
      '',
    universityName: (isOwn && ctx.profileUniversity) || item.universityName || item.user?.universityName || ctx.detailUniversity,
    departmentName: (isOwn && ctx.profileDepartment) || item.departmentName || item.user?.departmentName || ctx.detailDepartment,
    isOwn,
    parentCommentId: item.parentCommentId ?? null,
    hasReported: !!item.hasReported,
    isHidden: !!item.isHidden,
    replies,
  }
}

// Yorum + tüm cevaplarının id'lerini düz liste olarak verir (reaksiyonları toplu çekmek için)
function flattenCommentIds(comments: DetailComment[]): string[] {
  const ids: string[] = []
  comments.forEach((comment) => {
    ids.push(String(comment.id))
    ;(comment.replies || []).forEach((reply) => ids.push(String(reply.id)))
  })
  return ids
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
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('Spam')
  const [reportNote, setReportNote] = useState('')
  const [commentError, setCommentError] = useState('')
  const [reactionError, setReactionError] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [currentProfilePicture, setCurrentProfilePicture] = useState('')
  const [currentLinkedInProfileUrl, setCurrentLinkedInProfileUrl] = useState('')
  const [activeProfilePreview, setActiveProfilePreview] = useState<string | null>(null)
  const [needsAuth, setNeedsAuth] = useState(false)

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
        let profile: any = null
        try {
          const profileResponse = await userService.getCurrentUser()
          profile = profileResponse.data
          if (profile) setCurrentProfile(profile)
          if (profile?.profilePictureUrl) setCurrentProfilePicture(profile.profilePictureUrl)
          if (profile?.linkedInProfileUrl) setCurrentLinkedInProfileUrl(profile.linkedInProfileUrl)
        } catch (err: any) {
          if (err?.response?.status === 401) {
            setNeedsAuth(true)
          }
        }
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
          const mapCtx: MapCommentContext = {
            userId: user?.id,
            userFullName: user?.fullName,
            fallbackLinkedIn: currentLinkedInProfileUrl,
            fallbackPicture: currentProfilePicture,
            profileUniversity: profile?.universityName,
            profileDepartment: profile?.departmentName,
            detailUniversity: detailData.universityName,
            detailDepartment: detailData.departmentName,
          }
          const mappedComments = commentItems.map((item: any) => mapComment(item, mapCtx))
          setComments(mappedComments.reverse())
          const reactionIds = flattenCommentIds(mappedComments)
          const reactionResults = await Promise.allSettled(
            reactionIds.map((commentId) => internshipService.getCommentReactions(commentId))
          )
          const reactionMap: Record<string, CommentReaction> = {}
          reactionResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              reactionMap[reactionIds[index]] = readCommentReactions(result.value.data)
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
  }, [id, user])

  useEffect(() => {
    const profileLinks = document.querySelectorAll<HTMLAnchorElement>('article a[href*="linkedin.com"]')
    profileLinks.forEach((link) => {
      const container = link.parentElement
      const comment = comments.find((item) => item.name === link.textContent?.trim())
      if (!container || !comment || container.querySelector('[data-comment-meta]')) return

      const meta = document.createElement('p')
      meta.dataset.commentMeta = 'true'
      meta.textContent = `${comment.departmentName || 'Bölüm belirtilmemiş'} | ${comment.universityName || 'Üniversite belirtilmemiş'}`
      meta.className = 'text-[10px] text-on-surface-variant'
      container.appendChild(meta)
    })
  }, [comments])

  const refreshComments = async () => {
    const commentsResponse = await internshipService.getComments(id || '').catch(() => ({ data: null }))
    const commentItems = Array.isArray(commentsResponse.data)
      ? commentsResponse.data
      : Array.isArray(commentsResponse.data?.data)
        ? commentsResponse.data.data
        : commentsResponse.data?.items || []
    const mapCtx: MapCommentContext = {
      userId: user?.id,
      userFullName: user?.fullName,
      fallbackLinkedIn: currentLinkedInProfileUrl,
      fallbackPicture: currentProfilePicture,
      profileUniversity: currentProfile?.universityName,
      profileDepartment: currentProfile?.departmentName,
      detailUniversity: detail?.universityName,
      detailDepartment: detail?.departmentName,
    }
    const mappedComments = commentItems.map((item: any) => mapComment(item, mapCtx))
    setComments(mappedComments.reverse())
    const reactionIds = flattenCommentIds(mappedComments)
    const reactionResults = await Promise.allSettled(
      reactionIds.map((commentId) => internshipService.getCommentReactions(commentId))
    )
    const reactionMap: Record<string, CommentReaction> = {}
    reactionResults.forEach((result, index) => {
      if (result.status === 'fulfilled') reactionMap[reactionIds[index]] = readCommentReactions(result.value.data)
    })
    setCommentReactions(reactionMap)
  }

  const handleAddReply = async (parentCommentId: string) => {
    const text = replyText.trim()
    if (!text) return
    try {
      await internshipService.addReply(id || '', parentCommentId, text)
      setReplyText('')
      setReplyingToId(null)
      setCommentError('')
      await refreshComments()
    } catch (error: any) {
      console.warn('Cevap gönderilemedi:', error)
      const status = error?.response?.status
      if (status === 429 || status === 409) setCommentError('')
      else setCommentError('Cevap gönderilemedi. Giriş yaptığınızdan ve hesabınızın doğrulandığından emin olun.')
    }
  }

  const handleReport = async (commentId: string) => {
    try {
      await internshipService.reportComment(id || '', commentId, reportReason, reportNote.trim())
      setReportingCommentId(null)
      setReportReason('Spam')
      setReportNote('')
      setCommentError('')
      await refreshComments()
    } catch (error) {
      console.warn('Şikayet gönderilemedi:', error)
      const apiError = error as any
      const message = apiError.response?.data?.message || apiError.response?.data?.title
      setCommentError(typeof message === 'string' ? message : 'Şikayet gönderilemedi.')
    }
  }

  const handleComment = async (event: FormEvent) => {
    event.preventDefault()
    const text = comment.trim()
    if (!text) return

    const profileResponse = await userService.getCurrentUser().catch(() => ({ data: null }))
    const currentProfile = profileResponse.data

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
        profilePictureUrl: item?.profilePictureUrl || item?.authorProfilePictureUrl || item?.author?.profilePictureUrl || currentProfile?.profilePictureUrl || currentProfilePicture,
        universityName: currentProfile?.universityName || detail?.universityName,
        departmentName: currentProfile?.departmentName || detail?.departmentName,
        isOwn: true,
      }, ...current])
      setCommentReactions((current) => ({ ...current, [String(commentId)]: { positiveCount: 0, negativeCount: 0, userReaction: null } }))
      setComment('')
      setCommentError('')
      const fetchDetail = async () => {
        try {
          const response = await internshipService.getById(id || '')
          if (response.data) setDetail(response.data)
        } catch {
          console.warn('Detail yüklenemedi')
        }
      }
      await fetchDetail()
      await refreshComments()
    } catch (error: any) {
      console.warn('Yorum gönderilemedi:', error)
      const status = error?.response?.status
      if (status === 429 || status === 409) setCommentError('')
      else setCommentError('Yorum gönderilemedi. Giriş yaptığınızdan ve hesabınızın doğrulandığından emin olun.')
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
      await refreshComments()
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
      setEditingCommentId(null)
      setEditingCommentText('')
      await refreshComments()
    } catch (error) {
      console.warn('Yorum güncellenemedi:', error)
      setCommentError('Yorum güncellenemedi.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-background p-8 text-center text-on-surface-variant">Detay yükleniyor...</main>
  }

  if (!detail) {
    return <main className="min-h-screen bg-background p-8 text-center text-on-surface-variant">Bu staj değerlendirmesi bulunamadı.</main>
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

  const renderComment = (item: DetailComment, isReply = false) => {
    const reaction = commentReactions[String(item.id)] || { positiveCount: 0, negativeCount: 0 }
    const commentUrl = normalizeLinkedInUrl(item.linkedInProfileUrl)
    const profileHref = commentUrl || '#'
    const isPreviewOpen = activeProfilePreview === String(item.id)
    const canManage = user?.id === item.userId || item.isOwn
    return (
      <article className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="shrink-0">
              {item.profilePictureUrl ? (
                <img className="h-8 w-8 rounded-full object-cover border border-outline-variant/50" src={item.profilePictureUrl} alt={item.name} />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 font-label text-[11px] font-semibold text-secondary border border-outline-variant/40">{item.initials}</span>
              )}
            </div>
            <div className="relative flex-1 min-w-0">
              <a href={profileHref} target={commentUrl ? '_blank' : undefined} rel={commentUrl ? 'noreferrer' : undefined} onClick={(event) => { if (!commentUrl) { event.preventDefault(); setActiveProfilePreview(isPreviewOpen ? null : String(item.id)) } }} className="text-sm font-semibold text-secondary underline decoration-secondary/40 underline-offset-2 hover:text-primary">{item.name}</a>
              <div className={`absolute bottom-full left-0 z-30 mb-2 w-56 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-all duration-200 ${isPreviewOpen ? 'block opacity-100' : 'hidden opacity-0'}`}>
                <div className="flex items-center gap-2">
                  {item.profilePictureUrl ? <img className="h-9 w-9 rounded-full object-cover" src={item.profilePictureUrl} alt="" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/15 text-xs text-secondary">{item.initials}</span>}
                  <div className="min-w-0"><p className="truncate text-xs font-semibold text-primary">{item.name}</p><p className="text-[10px] text-on-surface-variant">Staj yorumu</p></div>
                </div>
                {commentUrl && <a href={commentUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-lg bg-secondary px-3 py-2 text-center font-label text-[10px] font-bold text-white hover:bg-primary-container">Profile Git</a>}
              </div>
              <span className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
                {item.date}
                {item.isHidden && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    <span className="material-symbols-outlined text-[12px]">visibility_off</span>İncelemede
                  </span>
                )}
              </span>
            </div>
          </div>
          {canManage && editingCommentId !== item.id && (
            <div className="flex gap-1">
              <button type="button" onClick={() => { setEditingCommentId(String(item.id)); setEditingCommentText(item.text) }} className="rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 transition" title="Düzenle"><span className="material-symbols-outlined text-[15px]">edit</span></button>
              <button type="button" disabled={deletingCommentId === String(item.id)} onClick={() => handleDeleteComment(String(item.id))} className="rounded-lg border border-rose-500/40 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition disabled:opacity-50" title="Sil"><span className="material-symbols-outlined text-[15px]">delete</span></button>
            </div>
          )}
        </div>
        {editingCommentId === String(item.id) && canManage ? (
          <div className="mt-3 flex gap-2">
            <input type="text" value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} placeholder="Yorumunuzu düzenleyin..." className="flex-1 rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
            <button type="button" onClick={() => handleUpdateComment(String(item.id))} className="rounded-lg bg-emerald-600 px-3 py-2 font-label text-xs font-bold text-white hover:bg-emerald-700 transition">Kaydet</button>
            <button type="button" onClick={() => { setEditingCommentId(null); setEditingCommentText('') }} className="rounded-lg border border-outline-variant/50 px-3 py-2 font-label text-xs text-on-surface-variant hover:bg-surface-container-high transition">İptal</button>
          </div>
        ) : (
          <p className="text-sm leading-6 text-on-surface-variant">{item.text}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" disabled={reactingCommentId === String(item.id)} onClick={() => handleCommentReaction(String(item.id), true)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"><span className="material-symbols-outlined text-[15px]">thumb_up</span>{reaction.positiveCount}</button>
          <button type="button" disabled={reactingCommentId === String(item.id)} onClick={() => handleCommentReaction(String(item.id), false)} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"><span className="material-symbols-outlined text-[15px]">thumb_down</span>{reaction.negativeCount}</button>
          {!isReply && (
            <button type="button" onClick={() => { setReplyingToId(replyingToId === String(item.id) ? null : String(item.id)); setReplyText('') }} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/50 px-2.5 py-1.5 text-xs text-on-surface-variant hover:border-secondary hover:text-secondary"><span className="material-symbols-outlined text-[15px]">reply</span>Yanıtla</button>
          )}
          {!canManage && (item.hasReported ? (
            <span className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-xs text-on-surface-variant opacity-60"><span className="material-symbols-outlined text-[15px]">flag</span>Şikayet edildi</span>
          ) : (
            <button type="button" onClick={() => { setReportingCommentId(reportingCommentId === String(item.id) ? null : String(item.id)); setReportReason('Spam'); setReportNote('') }} className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/50 px-2.5 py-1.5 text-xs text-on-surface-variant hover:border-rose-400 hover:text-rose-600"><span className="material-symbols-outlined text-[15px]">flag</span>Şikayet et</button>
          ))}
        </div>
        {!isReply && replyingToId === String(item.id) && (
          <div className="mt-3 flex gap-2">
            <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Yanıtınızı yazın..." className="flex-1 rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
            <button type="button" onClick={() => handleAddReply(String(item.id))} className="rounded-lg bg-secondary px-3 py-2 font-label text-xs font-bold text-white hover:bg-primary-container transition">Gönder</button>
            <button type="button" onClick={() => { setReplyingToId(null); setReplyText('') }} className="rounded-lg border border-outline-variant/50 px-3 py-2 font-label text-xs text-on-surface-variant hover:bg-surface-container-high transition">İptal</button>
          </div>
        )}
        {!canManage && reportingCommentId === String(item.id) && (
          <div className="mt-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {REPORT_REASONS.map((r) => (
                <button key={r.value} type="button" onClick={() => setReportReason(r.value)} className={`rounded-full border px-3 py-1 text-xs transition ${reportReason === r.value ? 'border-secondary bg-secondary text-white' : 'border-outline-variant/50 text-on-surface-variant hover:border-secondary'}`}>{r.label}</button>
              ))}
            </div>
            <textarea value={reportNote} onChange={(e) => setReportNote(e.target.value)} maxLength={300} rows={2} placeholder="Not (opsiyonel, en fazla 300 karakter)" className="w-full resize-y rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-secondary" />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button type="button" onClick={() => { setReportingCommentId(null); setReportNote('') }} className="rounded-lg border border-outline-variant/50 px-3 py-1.5 font-label text-xs text-on-surface-variant hover:bg-surface-container-high">İptal</button>
              <button type="button" onClick={() => handleReport(String(item.id))} className="rounded-lg bg-rose-600 px-3 py-1.5 font-label text-xs font-bold text-white hover:bg-rose-700">Şikayet et</button>
            </div>
          </div>
        )}
      </article>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-on-surface font-body">
      {needsAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest border-l-4 border-secondary rounded-lg p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">Giriş Yapmanız Gerekiyor</h2>
            <p className="text-on-surface-variant mb-6">Tüm detayları görmek için lütfen giriş yapınız.</p>
            <Link
              to="/"
              className="inline-block px-8 py-3 bg-secondary hover:bg-primary-container text-white rounded-lg transition-colors font-bold"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-[1060px]">
        <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 font-label text-xs text-secondary hover:text-primary">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Staj Arşivine Dön
        </button>

        <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)] md:p-9">
          <div className="flex flex-col justify-between gap-6 border-b border-outline-variant/40 pb-7 md:flex-row md:items-start">
            <div className="flex items-center gap-4">
              <CompanyLogo name={detail.companyName} logoUrl={detail.companyLogo} className="h-16 w-16 shrink-0 rounded-xl border border-outline-variant/50" textClassName="text-xl" />
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-3xl font-bold text-primary">{detail.companyName}</h1>
                  <span className="rounded-full border border-secondary/40 bg-secondary/15 px-2 py-1 font-label text-[9px] font-bold text-secondary">{formatTerm(detail.term)}</span>
                </div>
                <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant">{formatValue(detail.companyDepartment)}</p>
                <div className="mt-2 flex items-center gap-1.5 text-sm text-on-surface-variant">
                  {detail.profilePictureUrl ? <img className="h-5 w-5 rounded-full object-cover" src={detail.profilePictureUrl} alt="" /> : <span className="material-symbols-outlined text-[16px] text-secondary">person</span>}
                  <span>Stajyer:</span>
                  {detail.authorName && detail.authorName !== 'Anonim Öğrenci' && normalizeLinkedInUrl(detail.authorLinkedInProfileUrl) ? (
                    <a
                      href={normalizeLinkedInUrl(detail.authorLinkedInProfileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-secondary underline decoration-secondary/40 underline-offset-2 hover:text-primary"
                    >
                      {detail.authorName}
                    </a>
                  ) : (
                    <span className="font-semibold text-primary">{detail.authorName || 'Anonim Öğrenci'}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-left md:justify-end md:text-right">
              <div className="rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 font-label">
                <div className="text-[9px] uppercase text-on-surface-variant">Firma Puanı</div>
                <strong className="text-on-surface">{companyAverage !== null ? companyAverage.toFixed(1) : '-'} / 5.0 <span className="text-amber-400">★</span></strong>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 font-label">
                <div className="text-[9px] uppercase text-on-surface-variant">Stajyer Puanı</div>
                <strong className="text-on-surface">{internAverage !== null ? internAverage.toFixed(1) : '-'} / 5.0 <span className="text-amber-400">★</span></strong>
              </div>
              <p className="mt-2 font-label text-[10px] text-on-surface-variant">DENEYİM KAYDI</p>
            </div>
          </div>

          <div className="my-7 grid gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 text-xs text-on-surface-variant md:grid-cols-4">
            <div><span className="material-symbols-outlined mr-1 align-middle text-[15px] text-secondary">school</span>{formatValue(detail.universityName)}</div>
            <div><span className="material-symbols-outlined mr-1 align-middle text-[15px] text-secondary">category</span>{formatValue(detail.departmentName)}</div>
            <div><span className="material-symbols-outlined mr-1 align-middle text-[15px] text-secondary">location_on</span>{formatValue(detail.cityName)}</div>
            <div><span className="material-symbols-outlined mr-1 align-middle text-[15px] text-secondary">calendar_month</span>{formatDate(detail.startDate)} - {formatDate(detail.endDate)}</div>
          </div>

          <blockquote className="mb-8 border-l-2 border-secondary pl-5 text-base italic leading-7 text-on-surface">
            {formatValue(experienceText)}
          </blockquote>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-5">
              <h2 className="mb-4 font-display text-xl font-bold text-primary">Değerlendirme Detayları</h2>
              <div className="space-y-3">
                {scoreEntries.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 border-b border-outline-variant/40 pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-on-surface-variant">{label}</span>
                    {typeof value === 'number' ? (
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={`material-symbols-outlined text-[18px] ${n <= value ? 'text-amber-400' : 'text-outline-variant'}`}
                            style={n <= value ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            star
                          </span>
                        ))}
                      </span>
                    ) : (
                      <strong className="font-label text-on-surface-variant">-</strong>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-5">
              <h2 className="mb-4 font-display text-xl font-bold text-primary">Staj Süreci</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-on-surface-variant">Başvuru kanalı</dt><dd>{formatValue(detail.interview?.applicationMethod)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-on-surface-variant">İş teklifi</dt><dd>{detail.returnOfferReceived ? 'Aldım' : 'Almadım'}</dd></div>
              </dl>
              {detail.interview?.description && <p className="mt-4 border-t border-outline-variant/40 pt-4 text-sm leading-6 text-on-surface-variant">{detail.interview.description}</p>}
            </section>
          </div>

          {adviceText && <div className="mb-8 rounded-xl border border-outline-variant/40 bg-surface-container-low p-5"><h2 className="mb-2 font-display text-xl font-bold text-primary">Ek Tavsiye</h2><p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">{adviceText}</p></div>}

          <div className="border-t border-outline-variant/40 pt-7">
            <h2 className="mb-4 font-display text-2xl font-bold text-primary">Yorumlar</h2>
            <form onSubmit={handleComment} className="mb-6 flex flex-col gap-3 md:flex-row">
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder="Bu staj deneyimi hakkında yorum yapın..." className="min-h-14 flex-1 resize-y rounded-lg border border-outline-variant/50 bg-surface-container-low p-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-secondary" />
              <button type="submit" className="inline-flex h-fit items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 font-label text-xs font-bold text-white hover:bg-primary-container">Yorum Gönder<span className="material-symbols-outlined text-[16px]">send</span></button>
            </form>
            {commentError && <p className="mb-4 text-sm text-rose-600">{commentError}</p>}
            {reactionError && <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{reactionError}</p>}
            {comments.filter((c) => !c.isHidden || c.isOwn).length === 0 ? (
              <p className="text-sm text-on-surface-variant">Henüz yorum yapılmamış. İlk yorumu siz yazın.</p>
            ) : (
              <div className="space-y-3">
                {comments.filter((c) => !c.isHidden || c.isOwn).map((item) => {
                  const visibleReplies = (item.replies || []).filter((reply) => !reply.isHidden || reply.isOwn)
                  return (
                    <div key={item.id}>
                      {renderComment(item)}
                      {visibleReplies.length > 0 && (
                        <div className="mt-2 ml-6 space-y-2 border-l-2 border-outline-variant/40 pl-4">
                          {visibleReplies.map((reply) => renderComment(reply, true))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
