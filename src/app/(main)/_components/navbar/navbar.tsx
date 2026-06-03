import Image from 'next/image'
import Link from 'next/link'
import Logo from '~/assets/logo-header.png'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { getNavSettings } from '~/app/(main)/_data/site-settings'
import { NavLinks } from './nav-links'

export const Navbar = async () => {
  const nav = await getNavSettings()

  return (
    <header className='border-border/60 bg-background/95 sticky top-0 z-50 w-full border-b backdrop-blur-sm'>
      <div className='mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8'>
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src={Logo}
            alt='Pengurus Pusat Kesatuan Aksi Mahasiswa Muslim Indonesia'
            className='h-13 w-auto object-contain'
            priority
            style={{ width: 'auto', height: '52px' }}
          />
        </Link>

        <NavLinks links={nav.navLinks} />

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
