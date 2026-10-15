import '@testing-library/jest-dom'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

mock.module('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  )
}))
mock.module('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />
}))

const { AppSidebar } = await import('./app-sidebar')
const { SidebarProvider } = await import('~/components/shadcn/ui/sidebar')

afterEach(cleanup)

const memberUser = {
  displayName: 'Budi Santoso',
  role: 'member',
  connectedOrganization: null,
  connectedMember: { photo: null, registerNumber: '01.01.001.0001' }
}

describe('AppSidebar for role=member', () => {
  test('renders exactly three menu entries: Dashboard, Profil Saya, Pengaturan Akun', () => {
    render(
      <SidebarProvider>
        <AppSidebar user={memberUser} />
      </SidebarProvider>
    )

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    )
    expect(screen.getByRole('link', { name: /profil saya/i })).toHaveAttribute(
      'href',
      '/dashboard/profile/01.01.001.0001'
    )
    expect(
      screen.getByRole('link', { name: /pengaturan akun/i })
    ).toHaveAttribute('href', '/dashboard/user/account')
  })

  test('hides every Pembinaan and Organisasi menu entry', () => {
    render(
      <SidebarProvider>
        <AppSidebar user={memberUser} />
      </SidebarProvider>
    )

    expect(screen.queryByText('Data Kader')).not.toBeInTheDocument()
    expect(screen.queryByText('Daurah')).not.toBeInTheDocument()
    expect(screen.queryByText('Perangkat')).not.toBeInTheDocument()
    expect(screen.queryByText('Data Alumni')).not.toBeInTheDocument()
    expect(screen.queryByText(/daftar wilayah/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/daftar komisariat/i)).not.toBeInTheDocument()
  })
})
