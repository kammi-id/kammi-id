'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Separator } from '~/components/shadcn/ui/separator'
import { SidebarTrigger } from '~/components/shadcn/ui/sidebar'

const routeLabels: Record<string, string> = {
  '/dashboard': 'Ringkasan',
  '/dashboard/kader': 'Data Kader',
  '/dashboard/trainings': 'Dauroh',
  '/dashboard/branches': 'Daftar Wilayah',
  '/dashboard/alumni': 'Data Alumni',
  '/dashboard/perangkat': 'Perangkat Kaderisasi',
  '/dashboard/user/account': 'Akun Saya',
  '/dashboard/user/notifications': 'Notifikasi',
  '/dashboard/pages/home': 'Pengaturan Halaman Utama'
}

const getLabel = (pathname: string) => {
  if (routeLabels[pathname]) return routeLabels[pathname]
  for (const [key, label] of Object.entries(routeLabels)) {
    if (pathname.startsWith(key + '/')) return label
  }
  return 'Dashboard'
}

type SiteHeaderProps = {
  rightSlot?: ReactNode
}

export const SiteHeader = ({ rightSlot }: SiteHeaderProps) => {
  const pathname = usePathname()

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 h-4 data-vertical:self-auto'
        />
        <span className='flex-1 text-base font-medium'>
          {getLabel(pathname)}
        </span>
        {rightSlot}
      </div>
    </header>
  )
}
