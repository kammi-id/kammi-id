import Link from 'next/link'
import Image from 'next/image'
import Logo from '~/assets/logo-header.png'
import { getFooterSettings } from '~/app/(main)/_data/site-settings'

export const Footer = async () => {
  'use cache'
  const footer = await getFooterSettings()

  const FOOTER_LINKS = {
    KAMMI: footer.footerKAMMI,
    'Berita & Data': footer.footerBeritaData,
    'Ikuti Kami': footer.footerIkutiKami
  }

  const socialLinks = [
    { id: 'ig', href: footer.socialIG, label: 'Instagram' },
    { id: 'tw', href: footer.socialTwitter, label: 'Twitter / X' },
    { id: 'yt', href: footer.socialYoutube, label: 'YouTube' },
    { id: 'tg', href: footer.socialTelegram, label: 'Telegram' }
  ].filter((s) => s.href && s.href !== '#')

  return (
    <footer className='border-border bg-muted border-t'>
      <div className='mx-auto max-w-7xl px-6 py-16 lg:px-8'>
        <div className='grid grid-cols-2 gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]'>
          {/* Brand column */}
          <div className='col-span-2 lg:col-span-1'>
            <Image
              src={Logo}
              alt='KAMMI.id'
              className='h-10 w-auto object-contain'
              style={{ height: '40px', width: 'auto' }}
            />
            <p className='text-muted-foreground mt-4 max-w-xs font-sans text-sm leading-relaxed'>
              Kesatuan Aksi Mahasiswa Muslim Indonesia. Organisasi mahasiswa
              yang berkomitmen membangun bangsa lewat intelektualitas dan
              integritas.
            </p>
            {socialLinks.length > 0 && (
              <div className='mt-6 flex gap-3'>
                {socialLinks.map((s) => (
                  <Link
                    key={s.id}
                    href={s.href}
                    className='border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground flex size-9 items-center justify-center rounded-full border transition-colors'
                    aria-label={`Ikuti di ${s.label}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <svg
                      className='size-4'
                      viewBox='0 0 16 16'
                      fill='currentColor'
                      aria-hidden='true'
                    >
                      <rect width='16' height='16' rx='3' fillOpacity='0.2' />
                      <path d='M8 5a3 3 0 1 0 0 6A3 3 0 0 0 8 5zm0 5a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.5-5.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z' />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className='text-foreground/40 font-sans text-xs font-semibold tracking-widest uppercase'>
                {title}
              </h3>
              <ul className='mt-4 space-y-2.5' role='list'>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className='text-muted-foreground hover:text-foreground font-sans text-sm transition-colors'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='border-border mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row'>
          <p className='text-foreground/40 font-sans text-xs'>
            &copy; {new Date().getFullYear()} KAMMI.id. Hak Cipta Dilindungi.
          </p>
          <Link
            href='#'
            className='border-border text-muted-foreground hover:text-foreground rounded-full border px-4 py-1.5 font-sans text-xs font-semibold transition-colors'
          >
            Hubungi Kami
          </Link>
        </div>
      </div>
    </footer>
  )
}
