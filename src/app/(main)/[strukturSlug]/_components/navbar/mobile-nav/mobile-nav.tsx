'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '~/components/shadcn/ui/sheet'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { useLenisScroll } from '~/components/lenis-provider'

interface NavLink {
  label: string
  href: string
}

interface MobileNavProps {
  links: NavLink[]
  ctaBergabungHref: string
  ctaBergabungLabel: string
}

const TENTANG_CHILDREN = [
  { label: 'Tentang KAMMI', href: '/tentang' },
  { label: 'Pengurus Pusat', href: '/tentang/pengurus' }
]

export const MobileNav = ({
  links,
  ctaBergabungHref,
  ctaBergabungLabel
}: MobileNavProps) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { stop, start } = useLenisScroll()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (open) {
      stop()
    } else {
      start()
    }
  }, [open, stop, start])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
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
      </SheetTrigger>
      <SheetContent side='right'>
        <SheetHeader>
          <SheetTitle>Menu Navigasi</SheetTitle>
        </SheetHeader>
        <nav
          className='flex flex-col gap-1 px-6'
          aria-label='Navigasi utama mobile'
        >
          {links.map((link) =>
            link.label === 'Tentang' ? (
              <div key={link.href} className='flex flex-col'>
                <Link
                  href={link.href}
                  className='text-foreground rounded-md px-3 py-2 text-sm font-medium'
                >
                  {link.label}
                </Link>
                {TENTANG_CHILDREN.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className='text-muted-foreground hover:text-foreground rounded-md py-2 pr-3 pl-6 text-sm'
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className='text-foreground rounded-md px-3 py-2 text-sm font-medium'
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <SheetFooter>
          <Link
            href={ctaBergabungHref}
            className={cn(buttonVariants({ size: 'sm' }), 'w-full')}
          >
            {ctaBergabungLabel}
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
