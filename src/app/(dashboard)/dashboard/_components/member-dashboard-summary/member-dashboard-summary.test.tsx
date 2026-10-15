import '@testing-library/jest-dom'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

mock.module('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  )
}))

const { MemberDashboardSummary } = await import('./member-dashboard-summary')

afterEach(cleanup)

const baseProps = {
  registerNumber: '01.01.001.0001',
  orgChain: [
    { id: '1', name: 'PW Jawa Barat', type: 'pw' },
    { id: '2', name: 'PD Bandung', type: 'pd' },
    { id: '3', name: 'PK Telkom', type: 'pk' }
  ],
  status: 'ab2',
  yearOfEntry: 2022,
  keadaan: 'aktif' as const,
  trainingHistory: [
    {
      id: 't1',
      name: 'DM 1 Angkatan 5',
      type: 'dm1' as const,
      year: 2021,
      isPassing: true,
      organizationName: 'PK Telkom'
    }
  ],
  isCertifiedMentor: false,
  isCertifiedInstructor: false
}

describe('MemberDashboardSummary', () => {
  test('renders the Struktur chain, Jenjang, tahun masuk, and Keadaan', () => {
    render(<MemberDashboardSummary {...baseProps} />)

    expect(
      screen.getByText('PW Jawa Barat / PD Bandung / PK Telkom')
    ).toBeInTheDocument()
    expect(screen.getByText('AB2')).toBeInTheDocument()
    expect(screen.getByText('2022')).toBeInTheDocument()
    expect(screen.getByText('Aktif')).toBeInTheDocument()
  })

  test('renders riwayat Daurah entries', () => {
    render(<MemberDashboardSummary {...baseProps} />)

    expect(screen.getByText('DM 1 Angkatan 5')).toBeInTheDocument()
  })

  test('shows a message when there is no riwayat Daurah', () => {
    render(<MemberDashboardSummary {...baseProps} trainingHistory={[]} />)

    expect(screen.getByText(/belum ada riwayat daurah/i)).toBeInTheDocument()
  })

  test('hides the Perangkat section when the member holds no certification', () => {
    render(<MemberDashboardSummary {...baseProps} />)

    expect(screen.queryByText(/perangkat/i)).not.toBeInTheDocument()
  })

  test('shows the Perangkat section when the member is a certified Pemandu', () => {
    render(<MemberDashboardSummary {...baseProps} isCertifiedMentor={true} />)

    expect(screen.getByText(/perangkat/i)).toBeInTheDocument()
  })

  test('links to the member’s own full profile', () => {
    render(<MemberDashboardSummary {...baseProps} />)

    const link = screen.getByRole('link', { name: /profil lengkap/i })
    expect(link).toHaveAttribute('href', '/dashboard/profile/01.01.001.0001')
  })
})
