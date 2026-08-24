import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { member } from '~/db/schema/member.sql'
import { user } from '~/db/schema/user.sql'
import { readMemberAggregates } from '~/db/query/member'
import {
  createOrganization,
  softDeleteOrganization
} from '~/db/query/organization'

let mockSession: unknown
const userId = '00000000-0000-0000-0000-000000000001'

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  cacheLife: () => undefined,
  cacheTag: () => undefined
}))

const { readAuthorizedBranchDetail } = await import('./reader')

const sessionWith = (role: string, organizationId: string | null) => ({
  user: {
    id: userId,
    role,
    connectedOrganization: organizationId ? { id: organizationId } : null
  }
})

describe('readAuthorizedBranchDetail', () => {
  let ppId: string
  let pwJabarId: string
  let pdBandungId: string
  let pkItbId: string

  beforeAll(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

    const [pp] = await createOrganization({
      name: 'PP',
      slug: 'pp',
      code: '00',
      type: 'pp',
      isNonActive: false
    })
    ppId = pp.id
    await db.insert(user).values({
      id: userId,
      name: 'detail-test-user',
      displayName: 'Detail Test User',
      passwordHash: 'test',
      role: 'root',
      connectedOrganizationId: ppId
    })
    const [pwJabar] = await createOrganization({
      name: 'PW Jawa Barat',
      slug: 'pw-jabar',
      code: '01',
      type: 'pw',
      parentId: ppId,
      isNonActive: false
    })
    pwJabarId = pwJabar.id
    await createOrganization({
      name: 'PW Jawa Timur',
      slug: 'pw-jatim',
      code: '02',
      type: 'pw',
      parentId: ppId,
      isNonActive: false
    })
    const [pdBandung] = await createOrganization({
      name: 'PD Bandung',
      slug: 'pd-bandung',
      code: '01.PD-1',
      type: 'pd',
      parentId: pwJabarId,
      isNonActive: false
    })
    pdBandungId = pdBandung.id
    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      code: '01.PK-1',
      type: 'pk',
      parentId: pdBandungId,
      isNonActive: false
    })
    pkItbId = pkItb.id
    const [pdTerhapus] = await createOrganization({
      name: 'PD Terhapus',
      slug: 'pd-terhapus',
      code: '01.PD-2',
      type: 'pd',
      parentId: pwJabarId,
      isNonActive: false
    })
    await softDeleteOrganization(pdTerhapus.id, userId)
  })

  beforeEach(() => {
    mockSession = undefined
  })

  test('membaca detail PK dan remah roti pada jalur yang sah', async () => {
    mockSession = sessionWith('root', ppId)

    await expect(
      readAuthorizedBranchDetail(['pw-jabar', 'pd-bandung', 'pk-itb'])
    ).resolves.toMatchObject({
      organization: { name: 'PK ITB', type: 'pk' },
      parent: { name: 'PD Bandung', slug: 'pd-bandung' },
      breadcrumbs: [
        { name: 'PW Jawa Barat', slug: 'pw-jabar' },
        { name: 'PD Bandung', slug: 'pd-bandung' },
        { name: 'PK ITB', slug: 'pk-itb' }
      ]
    })
  })

  test('mengizinkan BPH dan BPW pada Struktur turunan di dalam Cakupan', async () => {
    mockSession = sessionWith('bph', pwJabarId)
    await expect(
      readAuthorizedBranchDetail(['pd-bandung'])
    ).resolves.not.toBeNull()

    mockSession = sessionWith('bpw', pdBandungId)
    await expect(readAuthorizedBranchDetail(['pk-itb'])).resolves.not.toBeNull()
  })

  test('memberikan ringkasan Kader Aktif kumulatif kepada pembaca detail yang berwenang tanpa membuka pembaca Kader umum bagi BPW', async () => {
    await db.insert(member).values([
      {
        name: 'Kader AB1',
        registerNumber: '01.001.0001',
        organizationId: pdBandungId,
        status: 'ab1',
        gender: 'ikhwan',
        isCertifiedMentor: true,
        yearOfEntry: 2020
      },
      {
        name: 'Kader AB2',
        registerNumber: '01.001.0002',
        organizationId: pdBandungId,
        status: 'ab2',
        gender: 'akhwat',
        isCertifiedInstructor: true,
        yearOfEntry: 2021
      },
      {
        name: 'Kader AB3',
        registerNumber: '01.001.0003',
        organizationId: pdBandungId,
        status: 'ab3',
        gender: 'ikhwan',
        isCertifiedMentor: true,
        isCertifiedInstructor: true,
        yearOfEntry: 2022
      },
      {
        name: 'Alumni',
        registerNumber: '01.001.0004',
        organizationId: pdBandungId,
        status: 'ab1',
        gender: 'ikhwan',
        isAlumn: true,
        yearOfEntry: 2023
      },
      {
        name: 'Non Aktif',
        registerNumber: '01.001.0005',
        organizationId: pdBandungId,
        status: 'ab1',
        gender: 'ikhwan',
        isNonActive: true,
        yearOfEntry: 2024
      },
      {
        name: 'Sanksi',
        registerNumber: '01.001.0006',
        organizationId: pdBandungId,
        status: 'ab1',
        gender: 'ikhwan',
        isSuspended: true,
        yearOfEntry: 2025
      },
      {
        name: 'Kader PK',
        registerNumber: '01.001.0007',
        organizationId: pkItbId,
        status: 'ab1',
        gender: 'akhwat',
        isCertifiedInstructor: true,
        yearOfEntry: 2026
      },
      {
        name: 'Terhapus',
        registerNumber: '01.001.0008',
        organizationId: pdBandungId,
        status: 'ab1',
        gender: 'ikhwan',
        isCertifiedMentor: true,
        isCertifiedInstructor: true,
        deletedAt: new Date(),
        yearOfEntry: 2026
      }
    ])

    const authorizedReaders: Array<[string, string, string[]]> = [
      ['root', ppId, ['pw-jabar', 'pd-bandung']],
      ['bph', pwJabarId, ['pd-bandung']],
      ['bpw', pwJabarId, ['pd-bandung']]
    ]

    for (const [role, organizationId, slugs] of authorizedReaders) {
      mockSession = sessionWith(role, organizationId)
      await expect(readAuthorizedBranchDetail(slugs)).resolves.toMatchObject({
        memberMetrics: {
          total: 4,
          ab1: 2,
          ab2: 1,
          ab3: 1,
          ikhwan: 2,
          akhwat: 2,
          pemandu: 2,
          instruktur: 3
        }
      })
    }

    await expect(
      readMemberAggregates({
        organizationId: pdBandungId,
        isAlumn: false,
        user: { role: 'bpw', connectedOrganizationId: pwJabarId }
      })
    ).resolves.toEqual([])
  })

  test('menolak jalur induk palsu, Terhapus, dan di luar Cakupan dengan jawaban sama', async () => {
    mockSession = sessionWith('bph', pwJabarId)

    await expect(readAuthorizedBranchDetail(['pw-jatim'])).resolves.toBeNull()

    mockSession = sessionWith('root', ppId)
    await expect(
      readAuthorizedBranchDetail(['pw-jatim', 'pd-bandung'])
    ).resolves.toBeNull()
    await expect(
      readAuthorizedBranchDetail(['pd-terhapus'])
    ).resolves.toBeNull()
  })

  test('mengizinkan BPW dalam Cakupan dan menolak peran lain', async () => {
    mockSession = sessionWith('bpw', ppId)
    await expect(
      readAuthorizedBranchDetail(['pw-jatim'])
    ).resolves.not.toBeNull()

    mockSession = sessionWith('bpk', ppId)
    await expect(readAuthorizedBranchDetail(['pw-jatim'])).resolves.toBeNull()
  })
})
