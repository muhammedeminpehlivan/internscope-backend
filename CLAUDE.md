# CLAUDE.md — StajIn Website

## Proje Özeti

**StajIn** — Öğrenciler tarafından staj deneyimlerinin değerlendirildiği, kurumsal arşiv tarzı Web platformu. Kullanıcılar staj deneyimlerini paylaşır, firmalar hakkında gerçek görüşler okur ve istatistikleri inceleyebilirler.

## Tech Stack

- **React 19 + Vite + TypeScript**
- **Tailwind CSS** (custom design system)
- **React Router v7**
- **Axios** (API client)
- **Material Symbols Icons**

## Design System (Prestigious Archive)

### Renkler
- **Deep Navy Ink:** #050B1A (primary background)
- **Institutional Purple:** #700080 (accents, active states)
- **Archive Amber:** #F59E0B (critical metadata, CTAs)
- **Ledger Paper:** #F8FAFC (high-contrast text)
- **Slate Border:** #1E293B (borders)

### Tipografi
- **Headlines:** Newsreader (serif, authoritative)
- **Body:** Inter (sans-serif, readable)
- **Metadata:** IBM Plex Mono (monospace, technical)

### Layout
- **Desktop:** 12-column grid, max 1200px
- **Spacing:** 4px unit, 24px gutter, 40px page margins
- **Border Radius:** 4px (soft, precision)

## Backend API

**Base URL:** `https://internscope-backend.onrender.com/api`

### Endpoints
- `GET /auth/login` — LinkedIn login
- `GET /auth/success` — Login callback
- `POST /user/send-verification-email` — Email verification
- `GET /user/verify-email?token={token}` — Verify email
- `GET /user/me` — Current user
- `GET /company` — List companies (with filters)
- `GET /company/{slug}` — Company profile
- `POST /internship` — Create internship review
- `GET /internship` — List internships (with filters)
- `GET /internship/mine` — User's internships
- `PUT /internship/{id}` — Update internship
- `POST /internship/{id}/sgk` — Upload SGK document
- `GET /statistics/university` — University stats
- `GET /statistics/department` — Department stats
- `GET /statistics/overall` — Overall stats
- `GET /admin/pending` — Pending approvals (admin only)
- `PUT /admin/{id}/approve` — Approve internship (admin)
- `PUT /admin/{id}/reject` — Reject internship (admin)

## Sayfa Yapısı

| Sayfa | Bileşen | Açıklama |
|---|---|---|
| Landing (/) | LandingPage | Giriş, LinkedIn login |
| Email Verify | EmailVerificationPage | .edu.tr mail doğrulama |
| Staj Arşivi | DiscoverPage | Filter'li staj listesi (bölüm, il, firma) |
| Şirket Profili | CompanyProfilePage | Firma puan'ları, yorumlar |
| Staj Detay | InternshipDetailPage | Yoruma yorum yapma, tüm bilgiler |
| Yeni Değerlendirme | InternshipFormPage | Staj ekleme formu |
| Profilim | ProfilePage | Kendi stajlar, onay durumları |
| İstatistikler | StatsPage | Üniversite, bölüm, firma bazlı grafikler |
| Admin Panel | AdminDashboard | Onay bekleyenler, soru yönetimi |

## Kod Kuralları

- **Dil:** Tüm kod İngilizce (değişken, fonksiyon, commit)
- **UI Text:** Türkçe
- **Klasör Yapısı:**
  ```
  src/
    components/    # Reusable UI components
    pages/        # Full page components
    services/     # API clients
    domain/       # TypeScript types/interfaces
    hooks/        # Custom React hooks
    styles/       # Global styles, tokens
  ```

- **Component Naming:** PascalCase (React), kebab-case (files)
- **Props:** TypeScript interfaces, required unless optional
- **State:** Use hooks, prefer useContext for app-wide state
- **Styling:** Tailwind utility classes, custom when needed
- **API Calls:** Centralize in services/, use Axios

## Veri Modeli

```typescript
interface User {
  id: string
  linkedInId: string
  fullName: string
  email: string
  isEmailVerified: boolean
  profilePictureUrl?: string
  role: 'Student' | 'Admin'
}

interface Internship {
  id: string
  userId: string
  companyId: string
  universityId: string
  departmentId: string
  companyDepartment: string
  startDate: string
  endDate: string
  isAnonymous: boolean
  isSgkVerified: boolean
  status: 'Pending' | 'Approved' | 'Rejected'
  rejectionReason?: string
}

interface InternshipScore {
  learningScore: 1-5
  mentoringScore: 1-5
  techInfraScore: 1-5
  workEnvironmentScore: 1-5
  salaryScore: 1-5
  wouldRecommend: boolean
  additionalTips?: string
}

interface InterviewProcess {
  applicationMethod: 'LinkedIn' | 'CareerSite' | 'Reference' | 'InternshipFair' | 'Other'
  stageCount: number
  durationDays?: number
  difficultyLevel: 'Easy' | 'Medium' | 'Hard'
  description?: string
}
```

## İş Kuralları

1. **Giriş zorunlu** → herkese açık landing hariç
2. **Mail doğrulaması** → işlem yapabilmek için
3. **SGK doğrulaması** → firmaya yorum yazabilmek için
4. **Anonimlik seçeneği** → kullanıcı seçer
5. **Admin onayı** → yorum yayına alınmadan önce
6. **Şirket otomatik** → firma yazılınca sistem oluşturur
7. **Yorum Sistemi** → değerlendirmeye reply yapılabilir

## Başlangıç Adımları

1. ✅ React + Vite + TypeScript kurulumu
2. ✅ Tailwind CSS + design system config
3. ✅ Klasör yapısı oluştur
4. Sayfa bileşenleri React'e çevir (Stitch HTML'den)
5. API services oluştur (axios interceptors dahil)
6. Authentication flow'u kur
7. Sayfaları backend'e bağla
8. Responsive design test et
9. Error handling + loading states
10. GitHub'a push et

## Git & Deploy

- **Repository:** GitHub (yeni repo)
- **Branch:** main
- **Deploy:** TBD (Vercel/Netlify)
- **Commits:** Semantik, Türkçe başlıklar opsiyonal
