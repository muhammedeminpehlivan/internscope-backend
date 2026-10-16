import { useEffect, useState } from 'react'

// logo.dev publishable key (pk_...). Tanımlı değilse sadece harf rozeti gösterilir.
const LOGO_DEV_TOKEN = import.meta.env.VITE_LOGO_DEV_TOKEN as string | undefined

// Şirket türü ekleri isimle aramayı bozuyor ("Dünya Katılım Bankası A.Ş" → "Dünya Katılım Bankası")
const LEGAL_SUFFIX = /[\s,]+(a\.?\s?ş\.?|ltd\.?(\s*şti\.?)?|şti\.?|san\.?|tic\.?|ve|inc\.?|llc|gmbh|corp\.?|co\.?)\s*$/i

function cleanCompanyName(name: string) {
  let result = name.trim()
  let prev
  do {
    prev = result
    result = result.replace(LEGAL_SUFFIX, '').replace(/[\s.,-]+$/, '').trim()
  } while (result !== prev && result)
  return result
}

function getAutoLogoUrl(name: string) {
  if (!LOGO_DEV_TOKEN) return undefined
  const cleaned = cleanCompanyName(name)
  if (cleaned.length < 2) return undefined
  const params = new URLSearchParams({ token: LOGO_DEV_TOKEN, size: '128', format: 'png', retina: 'true', fallback: '404' })
  return `https://img.logo.dev/name/${encodeURIComponent(cleaned)}?${params}`
}

// Tema paletiyle uyumlu, açık zeminde okunur harf-rozeti renkleri
const PALETTE = [
  { bg: 'bg-[#e1e8f9]', text: 'text-[#0058bd]' }, // mavi
  { bg: 'bg-[#dce7de]', text: 'text-[#456552]' }, // sage
  { bg: 'bg-[#efe2c0]', text: 'text-[#8a6d1f]' }, // gold
  { bg: 'bg-[#dbe3f3]', text: 'text-[#15346b]' }, // navy-gri
  { bg: 'bg-[#e6eeff]', text: 'text-[#001e4e]' }, // primary
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '–'
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr-TR')
  return (parts[0][0] + parts[1][0]).toLocaleUpperCase('tr-TR')
}

function pickColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

interface CompanyLogoProps {
  name?: string
  /** Dış kutu: boyut + köşe + border sınıfları */
  className?: string
  /** Harf rozetinin yazı boyutu */
  textClassName?: string
}

export default function CompanyLogo({ name = '', className = '', textClassName = 'text-sm' }: CompanyLogoProps) {
  const safeName = name || ''
  // logo.dev'den isimle otomatik logo; bulunamazsa harf rozeti
  const logoSrc = getAutoLogoUrl(safeName)
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [logoSrc])

  const showImage = !!logoSrc && !failed
  const color = pickColor(safeName)

  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${showImage ? 'bg-surface-container-high' : color.bg} ${className}`}
    >
      {showImage ? (
        <img
          src={logoSrc}
          alt={safeName}
          loading="lazy"
          className="w-full h-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`font-display font-bold tracking-tight ${color.text} ${textClassName}`}>
          {getInitials(safeName)}
        </span>
      )}
    </div>
  )
}
