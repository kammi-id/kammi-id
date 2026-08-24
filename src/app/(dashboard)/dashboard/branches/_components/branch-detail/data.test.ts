import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { sql } from 'drizzle-orm'
import { db } from '~/db/db'
import {
  createOrganization,
  softDeleteOrganization
} from '~/db/query/organization'

let mockSession: unknown

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

const { readAuthorizedBranchDetail } = await import('./reader')

const sessionWith = (role: string, organizationId: string | null) => ({
  user: {
    id: 'u1',
    role,
    connectedOrganization: organizationId ? { id: organizationId } : null
  }
})

describe('readAuthorizedBranchDetail', () => {
  let ppId: string
  let pwJabarId: string
  let pdBandungId: string

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
    await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      code: '01.PK-1',
      type: 'pk',
      parentId: pdBandungId,
      isNonActive: false
    })
    const [pdTerhapus] = await createOrganization({
      name: 'PD Terhapus',
      slug: 'pd-terhapus',
      code: '01.PD-2',
      type: 'pd',
      parentId: pwJabarId,
      isNonActive: false
    })
    await softDeleteOrganization(pdTerhapus.id, 'u1')
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
