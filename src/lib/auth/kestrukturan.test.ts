import { describe, it, expect, beforeAll, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

const {
  isLegalChildType,
  requireCreateStrukturAccess,
  requireEditStrukturAccess
} = await import('./kestrukturan')

// Bentuknya mengikuti `kekaderan.test.ts`: Struktur terhubung datang sebagai
// objek, dan `readAccessScope` yang memerasnya jadi `connectedOrganizationId`.
const sessionWith = (role: string, organizationId: string | null) => ({
  user: {
    id: 'u1',
    role,
    connectedOrganization: organizationId ? { id: organizationId } : null,
    connectedMember: null
  }
})

describe('isLegalChildType', () => {
  it('menerima anak yang sah di tiap Jenjang', () => {
    expect(isLegalChildType('pp', 'pw')).toBe(true)
    expect(isLegalChildType('pp', 'pdln')).toBe(true)
    expect(isLegalChildType('pw', 'pd')).toBe(true)
    expect(isLegalChildType('pd', 'pk')).toBe(true)
    expect(isLegalChildType('pdln', 'pk')).toBe(true)
  })

  it('menolak lompatan Jenjang', () => {
    expect(isLegalChildType('pp', 'pd')).toBe(false)
    expect(isLegalChildType('pp', 'pk')).toBe(false)
    expect(isLegalChildType('pw', 'pk')).toBe(false)
    expect(isLegalChildType('pw', 'pw')).toBe(false)
  })

  // Inti celahnya: `type` datang dari form, dan sebelum ini nol yang memeriksa.
  it('tidak pernah mengizinkan PP dibuat di bawah apa pun', () => {
    for (const parent of ['pp', 'pw', 'pd', 'pdln', 'pk']) {
      expect(isLegalChildType(parent, 'pp')).toBe(false)
    }
  })

  it('menolak PK sebagai induk, dan Jenjang yang tidak dikenal', () => {
    expect(isLegalChildType('pk', 'pk')).toBe(false)
    expect(isLegalChildType('entah', 'pk')).toBe(false)
  })
})

describe('gerbang kestrukturan', () => {
  let ppId: string
  let pwJabarId: string
  let pwJatimId: string
  let pdBandungId: string

  beforeEach(() => {
    mockSession = undefined
  })

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
      code: 'PW1',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })
    pwJabarId = pwJabar.id

    const [pwJatim] = await createOrganization({
      name: 'PW Jatim',
      slug: 'pw-jatim',
      code: 'PW2',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })
    pwJatimId = pwJatim.id

    const [pdBandung] = await createOrganization({
      name: 'PD Bandung',
      slug: 'pd-bandung',
      code: '01.PD-1',
      type: 'pd',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pdBandungId = pdBandung.id
  })

  describe('requireCreateStrukturAccess', () => {
    it('menolak tanpa sesi', async () => {
      expect(await requireCreateStrukturAccess(pwJabarId, 'pd')).not.toBeNull()
    })

    it('menolak Kewenangan selain BPW dan Root', async () => {
      for (const role of ['bph', 'bpk', 'humas', 'member']) {
        mockSession = sessionWith(role, ppId)
        expect(await requireCreateStrukturAccess(pwJabarId, 'pd')).not.toBeNull()
      }
    })

    it('mengizinkan BPW membuat di dalam Cakupannya', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(await requireCreateStrukturAccess(pwJabarId, 'pd')).toBeNull()
    })

    // Inti celahnya: sebelum ini BPW PW mana pun bisa membuat Struktur di
    // seluruh Indonesia, karena nol yang memeriksa Cakupan.
    it('menolak BPW membuat di luar Cakupannya', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(await requireCreateStrukturAccess(pwJatimId, 'pd')).not.toBeNull()
    })

    it('menolak Jenjang yang tidak sah meski Cakupannya benar', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(await requireCreateStrukturAccess(pwJabarId, 'pk')).not.toBeNull()
    })

    it('menolak pembuatan PP oleh siapa pun, Root termasuk', async () => {
      mockSession = sessionWith('root', ppId)
      expect(await requireCreateStrukturAccess(ppId, 'pp')).not.toBeNull()
    })

    it('menolak induk yang tidak ada', async () => {
      mockSession = sessionWith('root', ppId)
      expect(
        await requireCreateStrukturAccess(
          '00000000-0000-0000-0000-000000000000',
          'pw'
        )
      ).not.toBeNull()
    })
  })

  describe('requireEditStrukturAccess', () => {
    it('mengizinkan BPW menyunting Struktur di bawahnya', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(await requireEditStrukturAccess(pdBandungId)).toBeNull()
    })

    it('menolak BPW menyunting Struktur di luar Cakupannya', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(await requireEditStrukturAccess(pwJatimId)).not.toBeNull()
    })

    // BPW mengelola Struktur DI BAWAH Strukturnya, tidak pernah Strukturnya
    // sendiri (`CONTEXT.md`, Kewenangan).
    it('menolak BPW menyunting Strukturnya sendiri', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(await requireEditStrukturAccess(pwJabarId)).not.toBeNull()
    })

    // Konsekuensi paling penting dari aturan di atas: Cakupan seorang BPW PP
    // adalah seluruh negeri, jadi tanpa pengecualian ini PP tetap tersunting.
    it('menolak BPW PP menyunting PP', async () => {
      mockSession = sessionWith('bpw', ppId)
      expect(await requireEditStrukturAccess(ppId)).not.toBeNull()
    })

    it('mengizinkan BPW PP menyunting Struktur di bawah PP', async () => {
      mockSession = sessionWith('bpw', ppId)
      expect(await requireEditStrukturAccess(pwJatimId)).toBeNull()
    })

    it('mengizinkan Root menyunting apa pun', async () => {
      mockSession = sessionWith('root', ppId)
      expect(await requireEditStrukturAccess(ppId)).toBeNull()
      expect(await requireEditStrukturAccess(pwJatimId)).toBeNull()
    })
  })
})
