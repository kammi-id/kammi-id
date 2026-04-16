'use client'

import * as React from 'react'

import { NavMain } from './nav-main'
import { NavUser } from './nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '~/components/shadcn/ui/sidebar'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  Menu01Icon,
  UserGroupIcon,
  Database01Icon,
  CommandIcon,
  Add01Icon,
  Note01Icon
} from '@hugeicons/core-free-icons'
import Image from 'next/image'
import logo from '~/assets/logo.png'
import Link from 'next/link'

export const AppSidebar = ({
  user,
  ...props
}: {
  user: {
    displayName: string | null
    connectedOrganization: {
      name: string
      type: string
    } | null
    connectedMember: { photo: string | null } | null
  }
} & React.ComponentProps<typeof Sidebar>) => {
  const orgType = user.connectedOrganization?.type ?? 'pd'
  const mapping = {
    pp: 'Daftar Wilayah',
    pw: 'Daftar Daerah',
    pd: 'Daftar Komisariat',
    pdln: 'Daftar Komisariat',
    pk: 'Daftar Komisariat'
  } as const
  const orgLabel =
    mapping[orgType as keyof typeof mapping] ?? 'Daftar Komisariat'

  const menuUtama = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
    }
  ]

  const menuPembinaan = [
    {
      title: 'Data Kader',
      url: '#',
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
    },
    {
      title: 'Dauroh',
      url: '#',
      icon: <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
    },
    {
      title: 'Data Pemandu',
      url: '#',
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
    },
    {
      title: 'Data Instruktur',
      url: '#',
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
    }
  ]

  const menuOrganisasi = [
    {
      title: orgLabel,
      url: '/dashboard/regions',
      icon: <HugeiconsIcon icon={Database01Icon} strokeWidth={2} />
    }
  ]

  const menuBerita = [
    {
      title: 'Tambah Artikel Baru',
      url: '#',
      icon: <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
    },
    {
      title: 'Daftar Artikel',
      url: '#',
      icon: <HugeiconsIcon icon={Note01Icon} strokeWidth={2} />
    }
  ]

  const userData = {
    name: user.displayName ?? 'User',
    email: user.connectedOrganization?.name ?? 'No Organization',
    avatar: user.connectedMember?.photo ?? ''
  }

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className='data-[slot=sidebar-menu-button]:p-1.5!'
              render={<Link href='/dashboard' />}
            >
              <Image
                src={logo}
                alt='KAMMI.id'
                width={20}
                height={20}
                className='size-5 object-contain'
              />
              <span className='text-base font-bold'>KAMMI.id</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuUtama} />
        <NavMain title='Pembinaan Kader' items={menuPembinaan} />
        <NavMain title='Pengelolaan Organisasi' items={menuOrganisasi} />
        <NavMain title='Berita & Publikasi' items={menuBerita} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
