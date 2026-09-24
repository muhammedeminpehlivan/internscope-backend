# StajIn - Staj Deneyim Platformu

StajIn, öğrencilerin staj deneyimlerini değerlendirebildiği, kurumsal arşiv tarzında bir web platformudur. Kullanıcılar gerçek staj deneyimlerini paylaşır, firmalar hakkında samimi görüşler okur ve geniş istatistikler inceleyebilirler.

## Özellikler

- **LinkedIn ile Giriş** — Güvenli ve hızlı kimlik doğrulama
- **Staj Değerlendirmesi** — 5 kategori (Öğrenme, Mentoring, Altyapı, Çalışma Ortamı, Maaş)
- **SGK Doğrulaması** — Staj gerçekliğini belgeleme
- **Anonim Paylaşım** — Gizlilik seçeneği
- **Yorum Sistemi** — Değerlendirmelere yorum yapma
- **Firma Profilleri** — Ortalama puanlar ve kategori kırılımı
- **İstatistikler** — Üniversite ve bölüm bazlı analiz
- **Admin Paneli** — Onay ve yönetim sistemi

---

<img width="1600" height="769" alt="Image" src="https://github.com/user-attachments/assets/a33f6068-1541-401b-98b9-bf0ce7d0ae13" />
<img width="1368" height="818" alt="Image" src="https://github.com/user-attachments/assets/4e271238-349d-41e7-b685-fa4d9befbe14" />
<img width="1322" height="832" alt="Image" src="https://github.com/user-attachments/assets/22288ffd-6df3-463c-a62e-da1df236da3b" />
<img width="1137" height="437" alt="Image" src="https://github.com/user-attachments/assets/2c250c14-3d34-4e41-95b1-11ffad8f4a5b" />
<img width="666" height="577" alt="Image" src="https://github.com/user-attachments/assets/c6318671-e67d-48bf-996d-ddfb564cfcbe" />
<img width="1252" height="801" alt="Image" src="https://github.com/user-attachments/assets/24b99097-839e-4999-90ed-562a8a8f235b" />
<img width="1030" height="706" alt="Image" src="https://github.com/user-attachments/assets/a74d94f9-4678-4448-bdef-f789efc927bb" />
<img width="1288" height="462" alt="Image" src="https://github.com/user-attachments/assets/a101d892-6ecf-4e24-ae94-7967902271a9" />
<img width="1505" height="717" alt="Image" src="https://github.com/user-attachments/assets/8d567fda-bba0-4ed5-a075-fe9c5646efa6" />


## Hızlı Başlangıç

### Gereksinimler

- Node.js 18 veya üstü
- npm veya yarn

### Kurulum

```bash
# Projeyi klonla
git clone ...
cd stajin-website

# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
echo "VITE_API_BASE_URL=https://internscope-backend.onrender.com/api" > .env

# Development sunucusunu başlat
npm run dev
```

Tarayıcını aç: http://localhost:5173

### Build ve Deploy

```bash
# Production için build et
npm run build

# Build dosyasını kontrol et (dist/ klasörü)
ls -la dist/
```

---

## Kullanım

### 1. Giriş Yapma

Anasayfaya git → "LinkedIn ile Giriş Yap" butonuna tıkla → LinkedIn hesabını bağla

### 2. E-posta Doğrulama

Üniversite e-postanı gir (.edu.tr) → Doğrulama linkini tıkla → Hazır!

### 3. Staj Değerlendirmesi Ekleme

"Yeni Değerlendirme" → Firma, Bölüm, Tarihler gir → 5 kategori puanla → Yayınla

### 4. Şirket Profili Görüntüleme

"Staj Arşivi" → Firma ara → Profili görmek için tıkla → Puanlar & Yorumlar

### 5. İstatistikler

"İstatistikler" → Üniversite/Bölüm/Firma filtrele → Grafikler & Veriler

---

## Teknolojiler

### Frontend

| Teknoloji | Açıklama |
|-----------|----------|
| React 19 | UI kütüphanesi |
| Vite | Hızlı build tool |
| TypeScript | Tür güvenliği |
| Tailwind CSS | Utility-first CSS |
| React Router v7 | Sayfa yönetimi |
| Axios | HTTP istekleri |
| Nivo Charts | Veri görselleştirme |

### Stil & Tasarım

| Bileşen | Değer |
|---------|-------|
| Tema | Dark Mode (Prestigious Archive) |
| Ana Renk | #050B1A (Deep Navy) |
| Vurgu | #700080 (Institutional Purple) |
| Fontlar | Newsreader, Inter, IBM Plex Mono |
| Responsive | Mobile-first, 12-column grid |

### Backend Bağlantısı

```
API Base URL: https://internscope-backend.onrender.com/api
Protokol: REST
Auth: Bearer Token (JWT)
```

---

## Proje Yapısı

```
src/
├── components/      # Tekrar kullanılabilir UI bileşenleri
├── pages/          # Tam sayfa bileşenleri
│   ├── LandingPage
│   ├── DiscoverPage
│   ├── InternshipFormPage
│   ├── InternshipDetailPage
│   ├── CompanyProfilePage
│   ├── ProfilePage
│   ├── StatsPage
│   └── AdminDashboard
├── services/       # API istemcileri
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── internshipService.ts
│   ├── companyService.ts
│   └── statsService.ts
├── domain/         # TypeScript türleri
├── hooks/          # Custom React hooks
│   └── useAuth.ts
├── styles/         # Global stiller ve token'lar
├── App.tsx         # Ana router
└── main.tsx        # Entry point
```

---

## Güvenlik & İş Kuralları

| Kural | Açıklama |
|-------|----------|
| Giriş Zorunlu | Herkese açık landing hariç tüm sayfalar korumalı |
| Mail Doğrulaması | .edu.tr e-postası gerekli, işlem yapabilmek için |
| SGK Doğrulaması | Staj gerçekliğini belgelemek için (opsiyonel) |
| Anonim Paylaşım | Kullanıcı seçer, admin gerçek kimliği görür |
| Admin Onayı | Yeni gönderiler yayına alınmadan önce onaylanır |
| Şirket Otomatik | Firma yazılınca sistem otomatik oluşturur |

---

## API Endpoints

### Authentication

```
GET    /auth/login              # LinkedIn giriş sayfasına yönlendir
GET    /auth/success            # Login callback (JWT token)
POST   /user/send-verification-email  # Doğrulama maili gönder
GET    /user/verify-email       # E-posta doğrulaması (token ile)
GET    /user/me                 # Mevcut kullanıcı bilgisi
```

### Internships

```
GET    /internship              # Staj listesi (filtreleme ile)
POST   /internship              # Yeni staj ekleme
GET    /internship/{id}         # Staj detayları
PUT    /internship/{id}         # Staj güncelleme
GET    /internship/mine         # Kullanıcının stajları
POST   /internship/{id}/sgk     # SGK belgesi yükleme
```

### Statistics

```
GET    /statistics/university   # Üniversite istatistikleri
GET    /statistics/department   # Bölüm istatistikleri
GET    /statistics/overall      # Genel istatistikler
```

### Admin

```
GET    /admin/pending           # Onay bekleyen gönderiler
PUT    /admin/{id}/approve      # Gönderileri onayla
PUT    /admin/{id}/reject       # Gönderileri reddet
```
