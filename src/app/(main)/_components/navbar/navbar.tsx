import Image from 'next/image'
import Link from 'next/link'
import Logo from '~/assets/logo-header.png'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { getNavSettings } from '~/app/(main)/_data/site-settings'

export const Navbar = async () => {
  const nav = await getNavSettings()

  return (
    <header className='border-border/60 bg-background/95 sticky top-0 z-50 w-full border-b backdrop-blur-sm'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8'>
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src={Logo}
            alt='Pengurus Pusat Kesatuan Aksi Mahasiswa Muslim Indonesia'
            className='h-10 w-auto object-contain'
            priority
            style={{ width: 'auto', height: '40px' }}
          />
        </Link>

        <nav
          className='hidden items-center gap-1 md:flex'
          aria-label='Navigasi utama'
        >
          {nav.navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors'
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href={nav.ctaBergabungHref}
          className={cn(
            buttonVariants({ size: 'sm' }),
            'hidden md:inline-flex'
          )}
        >
          {nav.ctaBergabungLabel}
        </Link>

        <button
          className='text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-md md:hidden'
          aria-label='Buka menu navigasi'
        >
          <svg
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            aria-hidden='true'
          >
            <path
              d='M3 5h14M3 10h14M3 15h14'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
