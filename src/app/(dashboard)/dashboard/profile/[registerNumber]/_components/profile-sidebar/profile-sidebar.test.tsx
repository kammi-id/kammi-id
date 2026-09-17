import '@testing-library/jest-dom'
import { afterEach, describe, expect, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Member } from '~/db/query/member'
import type { Organization } from '~/db/query/organization'
import type { MemberTrainingHistory } from '~/db/query/training'
import { ProfileSidebar } from './profile-sidebar'
import { ProfileEditProvider } from '../profile-edit-context'

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

const emptyTrainingHistory: MemberTrainingHistory = {
  asAttendant: [],
  asInstructor: []
}

const buildMember = (overrides: Partial<Member> = {}): Member => ({
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Fulan',
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
  organizationId: organization.id,
  isAlumn: false,
  isSuspended: false,
  isNonActive: false,
  status: 'ab2',
  gender: 'ikhwan',
  isCertifiedMentor: true,
  isCertifiedInstructor: true,
  yearOfEntry: 2020,
  deletedAt: null,
  organization,
  ...overrides
})

const renderSidebar = (member: Member, canEditManaged = true) =>
  render(
    <ProfileEditProvider
      value={{
        member,
        trainingHistory: emptyTrainingHistory,
        academicHistory: [],
        careerHistory: [],
        organizationHistory: [],
        canEdit: true,
        canEditManaged,
        isEditing: true,
        isPending: false
      }}
    >
      <ProfileSidebar />
    </ProfileEditProvider>
  )

describe('ProfileSidebar — AB1 tidak pernah Pemandu maupun Instruktur', () => {
  test('AB2 dengan sertifikasi menampilkan blok Perangkat', () => {
    renderSidebar(buildMember({ status: 'ab2' }))
    expect(screen.getByText('Perangkat')).toBeInTheDocument()
  })

  test('member berstatus AB1 sejak awal: blok tidak pernah dirender', () => {
    const { container } = renderSidebar(
      buildMember({
        status: 'ab1',
        isCertifiedMentor: false,
        isCertifiedInstructor: false
      })
    )
    expect(screen.queryByText('Perangkat')).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isCertifiedMentor"]')
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isCertifiedInstructor"]')
    ).not.toBeInTheDocument()
  })

  test('memilih AB1 di form yang sedang diedit langsung menghilangkan blok', async () => {
    const user = userEvent.setup()
    const { container } = renderSidebar(buildMember({ status: 'ab2' }))

    expect(screen.getByText('Perangkat')).toBeInTheDocument()

    const ab1Radio = screen.getByRole('radio', { name: /AB1/ })
    await user.click(ab1Radio)

    expect(screen.queryByText('Perangkat')).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isCertifiedMentor"]')
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isCertifiedInstructor"]')
    ).not.toBeInTheDocument()
  })

  test('kembali dari AB1 ke AB2 memunculkan blok lagi', async () => {
    const user = userEvent.setup()
    renderSidebar(buildMember({ status: 'ab1' }))

    expect(screen.queryByText('Perangkat')).not.toBeInTheDocument()

    const ab2Radio = screen.getByRole('radio', { name: /AB2/ })
    await user.click(ab2Radio)

    expect(screen.getByText('Perangkat')).toBeInTheDocument()
  })
})

/**
 * ADR 0027, Celah 1 — akibat di UI. Penegakan sesungguhnya berada di skema
 * Server Action (`memberSelfEditSchema` vs `memberManagedSchema`); ini
 * hanya memeriksa bahwa `profile-sidebar` tidak lagi menyodorkan kontrol
 * yang memang tidak pernah lolos parse baginya.
 */
describe('ProfileSidebar — canEditManaged salah menyembunyikan kontrol terkelola', () => {
  test('isEditing benar tapi canEditManaged salah: tidak ada radio status, tidak ada toggle', () => {
    const { container } = renderSidebar(buildMember({ status: 'ab2' }), false)

    expect(screen.queryByRole('radio', { name: /AB1/ })).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="status"]')
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isSuspended"]')
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isAlumn"]')
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isNonActive"]')
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isCertifiedMentor"]')
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('input[name="isCertifiedInstructor"]')
    ).not.toBeInTheDocument()
  })

  test('isEditing benar tapi canEditManaged salah: tetap jatuh ke tampilan baca (kartu Perangkat, bukan kontrol)', () => {
    renderSidebar(
      buildMember({
        status: 'ab2',
        isCertifiedMentor: true,
        isCertifiedInstructor: false
      }),
      false
    )

    expect(screen.getByText('Pemandu')).toBeInTheDocument()
  })
})
