import { useState } from 'react'

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
  logoUrl?: string
  /** Dış kutu: boyut + köşe + border sınıfları */
  className?: string
  /** Harf rozetinin yazı boyutu */
  textClassName?: string
}

export default function CompanyLogo({ name = '', logoUrl, className = '', textClassName = 'text-sm' }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false)
  const safeName = name || ''
  const showImage = !!logoUrl && !failed
  const color = pickColor(safeName)

  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${showImage ? 'bg-surface-container-high' : color.bg} ${className}`}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt={safeName}
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
