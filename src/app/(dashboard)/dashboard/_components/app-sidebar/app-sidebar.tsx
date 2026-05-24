'use client'

import * as React from 'react'
import Link from 'next/link'
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
  WhiteboardIcon,
  User02Icon,
  TeacherIcon,
  Mortarboard01Icon,
  Globe02Icon,
  Database01Icon,
  Add01Icon,
  Note01Icon,
  Home01Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons'
import Image from 'next/image'
import logo from '~/assets/logo.png'
import { NavMain } from '../nav-main'
import { NavUser } from '../nav-user'

/**
 * AppSidebar component provides the main navigation shell for the dashboard.
 * It manages the sidebar structure, including the header (logo),
 * content (dynamic navigation menus based on user roles), and footer (user profile).
 *
 * @param props - The properties for the AppSidebar component.
 * @param props.user - User authentication and organization data used for role-based menu visibility.
 * @param props.user.displayName - The display name of the authenticated user.
 * @param props.user.role - The role of the user (e.g., 'root', 'bph', 'humas') used to determine access levels.
 * @param props.user.connectedOrganization - Data about the organization the user is currently connected to.
 * @param props.user.connectedOrganization.name - The name of the connected organization.
 * @param props.user.connectedOrganization.type - The type of organization, used to determine the label for the branches menu.
 * @param props.user.connectedMember - Member-specific data for the current user.
 * @param props.user.connectedMember.photo - URL to the user's profile photo.
 * @param props - Other properties passed to the underlying shadcn Sidebar component.
 *
 * @returns The rendered sidebar component.
 */
export const AppSidebar = ({
  user,
  ...props
}: {
  user: {
    displayName: string | null
    role: string
    connectedOrganization: {
      name: string
      type: string
    } | null
    connectedMember: { photo: string | null } | null
  }
} & React.ComponentProps<typeof Sidebar>) => {
  const orgType = user.connectedOrganization?.type ?? 'pd'
  const allowedRolesOrg = ['root', 'bph', 'bpw']
  const canAccessOrg = allowedRolesOrg.includes(user.role)

  const allowedRolesPembinaan = ['root', 'bph', 'bpk']
  const canAccessPembinaan = allowedRolesPembinaan.includes(user.role)

  const allowedRolesPublikasi = ['root', 'humas']
  const canAccessPublikasi = allowedRolesPublikasi.includes(user.role)

  const canAccessHalamanPublik =
    user.role === 'root' ||
    (user.role === 'humas' && user.connectedOrganization?.type === 'pp')

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
      url: '/dashboard/kader',
      icon: <HugeiconsIcon icon={User02Icon} strokeWidth={2} />,
      roles: ['bph', 'bpk', 'root']
    },
    {
      title: 'Dauroh',
      url: '/dashboard/trainings',
      icon: <HugeiconsIcon icon={WhiteboardIcon} strokeWidth={2} />,
      roles: ['bph', 'bpk', 'root']
    },
    {
      title: 'Perangkat Kaderisasi',
      url: '/dashboard/perangkat',
      icon: <HugeiconsIcon icon={TeacherIcon} strokeWidth={2} />,
      roles: ['bpk', 'root']
    },
    {
      title: 'Data Alumni',
      url: '/dashboard/alumni',
      icon: <HugeiconsIcon icon={Mortarboard01Icon} strokeWidth={2} />,
      roles: ['bph', 'bpk', 'root']
    }
  ].filter((item) => item.roles.includes(user.role))

  const menuOrganisasi = [
    {
      title: orgLabel,
      url: '/dashboard/branches',
      icon: <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} />
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
    name: user?.displayName ?? 'User',
    email: user?.connectedOrganization?.name ?? 'No Organization',
    avatar: user?.connectedMember?.photo ?? ''
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
        {canAccessPembinaan && (
          <NavMain title='Pembinaan Kader' items={menuPembinaan} />
        )}
        {canAccessOrg && (
          <NavMain title='Pengelolaan Organisasi' items={menuOrganisasi} />
        )}
        {canAccessPublikasi && (
          <NavMain title='Berita & Publikasi' items={menuBerita} />
        )}
        {canAccessHalamanPublik && (
          <NavMain
            title='Halaman Publik'
            items={[
              {
                title: 'Halaman Utama',
                url: '/dashboard/pages/home',
                icon: <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
              },
              {
                title: 'Pengurus Pusat',
                url: '/dashboard/pages/managers',
                icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
              }
            ]}
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
