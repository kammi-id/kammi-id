import { describe, it, expect, beforeAll, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

const { requireKekaderanAccess, requireMemberMutationAccess } =
  await import('./kekaderan')

// Bentuknya mengikuti `withSessionCTE` (`db/query/cte/session.ts`): Struktur
// terhubung datang sebagai objek, dan `readAccessScope` yang memerasnya jadi
// `connectedOrganizationId`.
const sessionWith = (role: string, organizationId: string | null) => ({
  user: {
    id: 'u1',
    role,
    connectedOrganization: organizationId ? { id: organizationId } : null,
    connectedMember: null
  }
})

describe('requireKekaderanAccess', () => {
  let ppId: string
  let pwJabarId: string
  let pkItbId: string
  let pkOtherId: string

  beforeEach(() => {
    mockSession = undefined
  })

  // Pohon Struktur ini hanya dibaca, tidak pernah diubah, jadi cukup disemai
  // sekali. Menyemainya per tes membuat berkas ini ikut antre TRUNCATE dan
  // kena hook timeout yang sama seperti `tests/access-control.test.ts`.
  beforeAll(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

    const [pp] = await createOrganization({
      name: 'PP KAMMI',
      slug: 'pp-kammi',
      code: 'PP-00',
      type: 'pp',
      parentId: null,
      isNonActive: false
    })
    ppId = pp.id

    const [pwJabar] = await createOrganization({
      name: 'PW Jabar',
      slug: 'pw-jabar',
      code: 'PW-01',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })
    pwJabarId = pwJabar.id

    const [pwJatim] = await createOrganization({
      name: 'PW Jatim',
      slug: 'pw-jatim',
      code: 'PW-02',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      code: 'PK-01',
      type: 'pk',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pkItbId = pkItb.id

    const [pkOther] = await createOrganization({
      name: 'PK Other',
      slug: 'pk-other',
      code: 'PK-02',
      type: 'pk',
      parentId: pwJatim.id,
      isNonActive: false
    })
    pkOtherId = pkOther.id
  })

  it('refuses when there is no active session', async () => {
    mockSession = undefined

    expect(await requireKekaderanAccess(pkItbId)).toBeNull()
  })

  it('lets root reach any struktur', async () => {
    mockSession = sessionWith('root', ppId)

    expect(await requireKekaderanAccess(pkOtherId)).toEqual({
      role: 'root',
      connectedOrganizationId: ppId
    })
  })

  it('lets root reach any struktur even with no connected struktur', async () => {
    mockSession = sessionWith('root', null)

    expect(await requireKekaderanAccess(pkOtherId)).not.toBeNull()
  })

  it('lets bpk reach its own struktur', async () => {
    mockSession = sessionWith('bpk', pkItbId)

    expect(await requireKekaderanAccess(pkItbId)).toEqual({
      role: 'bpk',
      connectedOrganizationId: pkItbId
    })
  })

  it('lets bpk reach a struktur below its own', async () => {
    mockSession = sessionWith('bpk', pwJabarId)

    expect(await requireKekaderanAccess(pkItbId)).not.toBeNull()
  })

  it('refuses bpk a struktur outside its cakupan', async () => {
    mockSession = sessionWith('bpk', pkItbId)

    expect(await requireKekaderanAccess(pkOtherId)).toBeNull()
  })

  it('refuses bpk a struktur above its own', async () => {
    mockSession = sessionWith('bpk', pkItbId)

    expect(await requireKekaderanAccess(pwJabarId)).toBeNull()
  })

  // BPH memantau: `CONTEXT.md` memberinya hak melihat data kekaderan tanpa
  // boleh mengubahnya, dan `readMemberAggregates` sudah mengizinkannya. Jadi
  // gate baca ini mengikuti Cakupannya, bukan `isOrgInScope` yang mensyaratkan
  // BPK karena ia menjaga jalur tulis.
  it('lets bph reach a struktur inside its cakupan', async () => {
    mockSession = sessionWith('bph', pwJabarId)

    expect(await requireKekaderanAccess(pkItbId)).not.toBeNull()
  })

  it('refuses bph a struktur outside its cakupan', async () => {
    mockSession = sessionWith('bph', pwJabarId)

    expect(await requireKekaderanAccess(pkOtherId)).toBeNull()
  })

  it('refuses a role that has no kekaderan privilege at all', async () => {
    mockSession = sessionWith('bpw', ppId)

    expect(await requireKekaderanAccess(pkItbId)).toBeNull()
  })

  it('refuses humas even inside its own struktur', async () => {
    mockSession = sessionWith('humas', pkItbId)

    expect(await requireKekaderanAccess(pkItbId)).toBeNull()
  })

  it('refuses a privileged role with no connected struktur', async () => {
    mockSession = sessionWith('bpk', null)

    expect(await requireKekaderanAccess(pkItbId)).toBeNull()
  })
})

describe('requireMemberMutationAccess', () => {
  let ppId: string
  let pwJabarId: string
  let pkItbId: string

  beforeEach(() => {
    mockSession = undefined
  })

  beforeAll(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

    const [pp] = await createOrganization({
      name: 'PP KAMMI',
      slug: 'pp-kammi-mutasi',
      code: 'PP-00',
      type: 'pp',
      parentId: null,
      isNonActive: false
    })
    ppId = pp.id

    const [pwJabar] = await createOrganization({
      name: 'PW Jabar',
      slug: 'pw-jabar-mutasi',
      code: 'PW-01',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })
    pwJabarId = pwJabar.id

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb-mutasi',
      code: 'PK-01',
      type: 'pk',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pkItbId = pkItb.id
  })

  it('refuses when there is no active session', async () => {
    mockSession = undefined

    expect(await requireMemberMutationAccess()).not.toBeNull()
  })

  it('lets root mutate, regardless of its connected struktur', async () => {
    mockSession = sessionWith('root', pkItbId)

    expect(await requireMemberMutationAccess()).toBeNull()
  })

  it('lets root mutate with no connected struktur at all', async () => {
    mockSession = sessionWith('root', null)

    expect(await requireMemberMutationAccess()).toBeNull()
  })

  it('lets bpk pp mutate', async () => {
    mockSession = sessionWith('bpk', ppId)

    expect(await requireMemberMutationAccess()).toBeNull()
  })

  // The one this gate exists to get right — copying `role === 'bpk'` from
  // elsewhere would open mutasi to every BPK PD in the country.
  it('refuses bpk below pp, even directly under it', async () => {
    mockSession = sessionWith('bpk', pwJabarId)

    expect(await requireMemberMutationAccess()).not.toBeNull()
  })

  it('refuses bpk deep below pp', async () => {
    mockSession = sessionWith('bpk', pkItbId)

    expect(await requireMemberMutationAccess()).not.toBeNull()
  })

  it('refuses bpk with no connected struktur', async () => {
    mockSession = sessionWith('bpk', null)

    expect(await requireMemberMutationAccess()).not.toBeNull()
  })

  it('refuses every other role, pp included', async () => {
    mockSession = sessionWith('bpw', ppId)

    expect(await requireMemberMutationAccess()).not.toBeNull()
  })
})
