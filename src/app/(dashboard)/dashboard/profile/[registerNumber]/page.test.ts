import { describe, it, expect, afterAll, mock } from 'bun:test'
import { inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization as organizationTable } from '~/db/schema/organization.sql'

/**
 * ADR 0027, Celah 2 — gerbang baca `/dashboard/profile/[registerNumber]`.
 * `notFound()`, bukan pesan penolakan: membedakan "tidak berhak" dari
 * "tidak ada" mengubah halaman ini menjadi alat pemeriksa keberadaan NIA.
 *
 * `notFound()` Next dimata-matai supaya melempar alih-alih menjalankan
 * router sungguhan — pola yang sama dengan
 * `(main)/[strukturSlug]/berita/jaringan/page.test.ts`.
 *
 * `_data/members` dan sesi dimock; jalur negatif (`notFound()`) berhenti
 * sebelum menyentuh pembacaan lain di berkas ini, jadi hanya
 * `getCachedMemberByRegisterNumber` yang perlu berperilaku nyata di sini.
 * `requireKaderisasiAccess` (Cakupan BPK) TIDAK dimock — ia berjalan nyata
 * atas basis data staging, dengan fixture bersufiks yang dibereskan sendiri
 * di `afterAll` (bukan TRUNCATE — basis data ini dipakai bersama proses tes
 * lain yang berjalan paralel).
 */
const notFound = mock(() => {
  throw new Error('NEXT_NOT_FOUND')
})
const actualNavigation = await import('next/navigation')
mock.module('next/navigation', () => ({ ...actualNavigation, notFound }))

let mockSession: unknown = undefined
mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

let mockMember: unknown = undefined
mock.module('../../_data/members', () => ({
  getCachedMemberByRegisterNumber: async () => mockMember,
  getCachedMemberTrainingHistory: async () => ({
    asAttendant: [],
    asInstructor: []
  }),
  getCachedMemberAcademic: async () => [],
  getCachedMemberCareer: async () => [],
  getCachedMemberOrganizationHistory: async () => []
}))

const { default: ProfilePage } = await import('./page')

const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const orgIds: string[] = []

afterAll(async () => {
  if (orgIds.length > 0)
    await db
      .delete(organizationTable)
      .where(inArray(organizationTable.id, orgIds))
})

let orgCounter = 0
const seedOrg = async (
  type: 'pw' | 'pk',
  parentId: string | null
): Promise<string> => {
  orgCounter += 1
  const unique = `${suffix}-${orgCounter}`
  const [row] = await db
    .insert(organizationTable)
    .values({
      name: `Org Page02 ${unique}`,
      slug: `org-page02-${unique}`,
      code: `PG2-${unique}`,
      type,
      parentId,
      isNonActive: false
    })
    .returning({ id: organizationTable.id })
  orgIds.unshift(row.id)
  return row.id
}

const renderPage = async (registerNumber = 'RN-0001') => {
  const Page = ProfilePage as unknown as (props: {
    params: Promise<{ registerNumber: string }>
  }) => Promise<unknown>
  return Page({ params: Promise.resolve({ registerNumber }) })
}

const expectNotFound = async (registerNumber?: string) => {
  await expect(renderPage(registerNumber)).rejects.toThrow('NEXT_NOT_FOUND')
}

describe('ProfilePage — gerbang baca (Celah 2)', () => {
  it('member membuka NIA milik orang lain: notFound()', async () => {
    mockSession = {
      user: { role: 'member', connectedMember: { id: 'diri-sendiri' } }
    }
    mockMember = {
      id: 'orang-lain',
      organizationId: '00000000-0000-0000-0000-000000000000',
      organization: null
    }

    await expectNotFound()
  })

  it('tidak ada Member yang cocok dengan NIA: notFound() (tidak jadi oracle NIA)', async () => {
    mockSession = {
      user: { role: 'member', connectedMember: { id: 'diri-sendiri' } }
    }
    mockMember = undefined

    await expectNotFound()
  })

  it('BPK PK membuka Kader di luar Cakupannya: notFound()', async () => {
    const pwA = await seedOrg('pw', null)
    const pwB = await seedOrg('pw', null)
    const pkMine = await seedOrg('pk', pwA)
    const pkOther = await seedOrg('pk', pwB)

    mockSession = {
      user: {
        role: 'bpk',
        connectedMember: null,
        connectedOrganization: { id: pkMine }
      }
    }
    mockMember = {
      id: 'kader-di-luar-cakupan',
      organizationId: pkOther,
      organization: { id: pkOther }
    }

    await expectNotFound()
  })

  it('BPW membuka profil Kader mana pun: notFound() (bukan Kewenangan Kaderisasi)', async () => {
    const pwA = await seedOrg('pw', null)
    const pkMine = await seedOrg('pk', pwA)

    mockSession = {
      user: {
        role: 'bpw',
        connectedMember: null,
        connectedOrganization: { id: pkMine }
      }
    }
    mockMember = {
      id: 'kader-manapun',
      organizationId: pkMine,
      organization: { id: pkMine }
    }

    await expectNotFound()
  })

  it('sesi kosong (tidak terautentikasi): notFound()', async () => {
    mockSession = undefined
    mockMember = {
      id: 'kader-manapun',
      organizationId: '00000000-0000-0000-0000-000000000000',
      organization: null
    }

    await expectNotFound()
  })
})
