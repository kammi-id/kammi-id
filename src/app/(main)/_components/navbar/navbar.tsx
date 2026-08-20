import Image from 'next/image'
import Link from 'next/link'
import Logo from '~/assets/logo-header.png'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { getNavSettings } from '~/app/(main)/_data/site-settings'
import { NavLinks } from './nav-links'
import { MobileNav } from './mobile-nav'

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
            sizes='168px'
            preload
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

        <MobileNav
          links={nav.navLinks}
          ctaBergabungHref={nav.ctaBergabungHref}
          ctaBergabungLabel={nav.ctaBergabungLabel}
        />
      </div>
    </header>
  )
}
