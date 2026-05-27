'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/shadcn/ui/dropdown-menu'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'

interface NavLink {
  label: string
  href: string
}

interface NavLinksProps {
  links: NavLink[]
}

export const NavLinks = ({ links }: NavLinksProps) => {
  return (
    <nav
      className='hidden items-center gap-1 md:flex'
      aria-label='Navigasi utama'
    >
      {links.map((link) => {
        if (link.label === 'Tentang') {
          return (
            <DropdownMenu key={link.href}>
              <DropdownMenuTrigger className='text-muted-foreground hover:text-foreground group flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none'>
                {link.label}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className='size-3.5 transition-transform duration-200 group-aria-expanded:rotate-180'
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='min-w-[200px]'>
                <DropdownMenuItem render={<Link href='/tentang' className='w-full' />}>
                  Tentang KAMMI
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href='/tentang/pengurus' className='w-full' />}>
                  Pengurus Pusat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className='text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors'
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
