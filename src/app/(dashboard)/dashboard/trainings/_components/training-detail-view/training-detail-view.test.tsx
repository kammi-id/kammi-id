import '@testing-library/jest-dom'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { Member } from '~/db/query/member'
import type { Organization } from '~/db/query/organization'
import type { TrainingWithDetails } from './types'

// Rendered outside a Next.js app router in this test — `next/link` and
// `DeleteTrainingButton`'s `useRouter()` would otherwise throw "invariant
// expected app router to be mounted".
mock.module('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  )
}))
mock.module('next/navigation', () => ({
  useRouter: () => ({ refresh: () => undefined })
}))

const { TrainingDetailView } = await import('./training-detail-view')

afterEach(cleanup)

const organization = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'PK Telkom',
  slug: 'pk-telkom',
  code: '01.PK-1',
  codeSlug: '01-pk-1',
  type: 'pk',
  level: 4,
  logo: null,
  isSiteActive: false,
  parentId: null,
  isNonActive: false,
  nonActiveAt: null,
  nonActiveBy: null,
  deletedAt: null,
  deletedBy: null,
  state: 'aktif'
} satisfies Organization

const buildMember = (overrides: Partial<Member> = {}): Member => ({
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Fulan',
  organization,
  phone: null,
  addressProvince: null,
  addressCity: null,
  addressDistrict: null,
  addressSubdistrict: null,
  addressProvinceCode: null,
  addressCityCode: null,
  addressDistrictCode: null,
  addressSubdistrictCode: null,
  addressLine: null,
  photo: null,
  birthPlace: null,
  birthDate: null,
  registerNumber: '01.PK-1.001',
  organizationId: '00000000-0000-0000-0000-000000000001',
  isAlumn: false,
  isSuspended: false,
  isNonActive: false,
  status: 'ab3',
  gender: 'ikhwan',
  isCertifiedMentor: false,
  isCertifiedInstructor: true,
  yearOfEntry: 2018,
  deletedAt: null,
  ...overrides
})

const buildTraining = (
  overrides: Partial<TrainingWithDetails> = {}
): TrainingWithDetails => ({
  id: '00000000-0000-0000-0000-000000000010',
  organizationId: '00000000-0000-0000-0000-000000000001',
  name: 'DM 2 Angkatan 1',
  startDate: '2026-01-10',
  endDate: '2026-01-12',
  registrationDeadline: null,
  registrationStartDate: null,
  type: 'dm2',
  year: 2026,
  identifier: 1,
  attendants: [],
  instructors: [],
  ...overrides
})

const buildMasterInstructor = (phone: Member['phone']) => ({
  trainingId: '00000000-0000-0000-0000-000000000010',
  memberId: '00000000-0000-0000-0000-000000000002',
  role: 'master' as const,
  member: buildMember({ name: 'Kak Fulan', phone })
})

describe('TrainingDetailView — tombol WhatsApp MoT', () => {
  test('canManage dengan nomor MoT sah menampilkan tautan wa.me, pesan kosong', () => {
    render(
      <TrainingDetailView
        training={buildTraining({
          instructors: [buildMasterInstructor('+628123456789')]
        })}
        canManage
      />
    )

    const link = screen.getByRole('link', {
      name: 'Hubungi Kak Fulan via WhatsApp'
    })
    expect(link).toHaveAttribute('href', 'https://wa.me/628123456789')
  })

  test('MoT tanpa nomor: tombol tampil mati dengan keterangan yang jelas', () => {
    render(
      <TrainingDetailView
        training={buildTraining({
          instructors: [buildMasterInstructor(null)]
        })}
        canManage
      />
    )

    const button = screen.getByRole('button', {
      name: 'Hubungi Kak Fulan via WhatsApp — nomor MoT belum tersedia'
    })
    expect(button).toBeDisabled()
    expect(
      screen.queryByRole('link', { name: /WhatsApp/ })
    ).not.toBeInTheDocument()
  })

  test('nomor MoT cacat (prefiks dobel, tidak ikut dikonversi backfill) tidak menghasilkan tautan ngawur', () => {
    render(
      <TrainingDetailView
        training={buildTraining({
          instructors: [buildMasterInstructor('0628123456789')]
        })}
        canManage
      />
    )

    expect(
      screen.getByRole('button', { name: /nomor MoT belum tersedia/ })
    ).toBeDisabled()
    expect(
      screen.queryByRole('link', { name: /WhatsApp/ })
    ).not.toBeInTheDocument()
  })

  test('bukan canManage: tombol WhatsApp tidak ditampilkan sama sekali', () => {
    render(
      <TrainingDetailView
        training={buildTraining({
          instructors: [buildMasterInstructor('+628123456789')]
        })}
        canManage={false}
      />
    )

    expect(
      screen.queryByRole('link', { name: /WhatsApp/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /WhatsApp/ })
    ).not.toBeInTheDocument()
  })

  test('Daurah tanpa MoT: tidak ada tombol WhatsApp untuk instruktur mana pun', () => {
    render(
      <TrainingDetailView
        training={buildTraining({
          instructors: [
            {
              trainingId: '00000000-0000-0000-0000-000000000010',
              memberId: '00000000-0000-0000-0000-000000000003',
              role: 'lecturer',
              member: buildMember({
                id: '00000000-0000-0000-0000-000000000003',
                name: 'Kak Lecturer',
                phone: '+628123456789'
              })
            }
          ]
        })}
        canManage
      />
    )

    expect(
      screen.queryByRole('link', { name: /WhatsApp/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /WhatsApp/ })
    ).not.toBeInTheDocument()
  })
})
