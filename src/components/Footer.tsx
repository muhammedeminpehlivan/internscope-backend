import { Link, useLocation } from 'react-router-dom'

const LINKEDIN_URL = 'https://www.linkedin.com/company/staj-in/'

// Footer'ın gösterilmeyeceği sayfalar (tam ekran ara ekranlar)
const HIDDEN_PATHS = ['/auth/callback']

const EXPLORE_LINKS = [
  { label: 'Staj Arşivi', to: '/discover' },
  { label: 'İstatistikler', to: '/stats' },
  { label: 'Staj Değerlendir', to: '/internship/new' },
]

const CORPORATE_LINKS = [
  { label: 'Hakkımızda', href: `${LINKEDIN_URL}about/` },
  { label: 'İletişim', href: LINKEDIN_URL },
]

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  )
}

const linkClass =
  'group inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-secondary transition-colors'

export default function Footer() {
  const { pathname } = useLocation()
  if (HIDDEN_PATHS.includes(pathname)) return null

  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/40 font-body text-on-surface">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-y-10 gap-x-8">
          {/* Marka */}
          <div className="col-span-2 md:col-span-6 lg:col-span-7">
            <Link to="/" className="inline-flex" aria-label="Staj'ın ana sayfa">
              <img src="/logo.png" alt="Staj'ın Logo" className="h-10 w-auto object-contain" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-surface-variant">
              Ekip, iş yükü, öğrenme fırsatları... Stajyerlerin gözünden şirketleri keşfet.
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004182] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A66C2]"
            >
              <LinkedInIcon />
              LinkedIn'de Takip Et
            </a>
          </div>

          {/* Keşfet */}
          <nav className="md:col-span-3 lg:col-span-2" aria-label="Keşfet">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Keşfet</h3>
            <ul className="flex flex-col gap-3">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Kurumsal */}
          <nav className="md:col-span-3" aria-label="Kurumsal">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Kurumsal</h3>
            <ul className="flex flex-col gap-3">
              {CORPORATE_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {link.label}
                    <span className="material-symbols-outlined text-[14px] opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0">
                      arrow_outward
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-6 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-on-surface-variant text-center sm:text-left">
            © {new Date().getFullYear()} Staj'ın • Staj Değerlendirme Platformu • Tüm Hakları Saklıdır
          </span>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Staj'ın LinkedIn sayfası"
            className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-[#0A66C2] hover:text-white"
          >
            <LinkedInIcon />
          </a>
        </div>
      </div>
    </footer>
  )
}
