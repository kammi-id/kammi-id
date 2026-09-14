import { describe, it, expect, beforeAll, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import type { StrukturJenjang, KestrukturanAction } from './kestrukturan'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

const {
  isLegalChildType,
  canManageKestrukturan,
  requireKestrukturanReadAccess,
  requireKestrukturanCreateAccess,
  requireKestrukturanManageAccess,
  requireOwnStrukturEditAccess,
  requireStrukturRestoreAccess
} = await import('./kestrukturan')

// Imported rather than re-declared: a union that grows in the gate has to grow
// here too, and a local copy would keep passing while the table went stale.
type Jenjang = StrukturJenjang
type Aksi = KestrukturanAction

const JENJANG: Jenjang[] = ['pp', 'pw', 'pdln', 'pd', 'pk']
const AKSI: Aksi[] = [
  'baca',
  'buat',
  'sunting',
  'nonaktifkan',
  'aktifkan',
  'hapus',
  'pulihkan'
]

const SEMUA = JENJANG
const KECUALI_PP: Jenjang[] = ['pw', 'pdln', 'pd', 'pk']
const HANYA_PK: Jenjang[] = ['pk']
const NOL: Jenjang[] = []

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

/**
 * Lapis matriks: tabel argumen-ke-hasil, nol fixture, nol basis data. Tiap baris
 * di bawah adalah satu baris spec §2.2 — nilainya Jenjang sasaran yang boleh,
 * dan setiap Jenjang di luar daftar itu wajib ditolak.
 */
describe('canManageKestrukturan', () => {
  const baris: Array<{
    nama: string
    role: string
    jenjangAkun: Jenjang | null
    sel: Record<Aksi, Jenjang[]>
  }> = [
    {
      nama: 'Root',
      role: 'root',
      jenjangAkun: 'pp',
      sel: {
        baca: SEMUA,
        buat: SEMUA,
        sunting: SEMUA,
        // Larangan ada pada sasaran, bukan pengecualian pada pelaku.
        nonaktifkan: KECUALI_PP,
        aktifkan: KECUALI_PP,
        hapus: SEMUA,
        pulihkan: SEMUA
      }
    },
    {
      // Root tanpa Struktur terhubung tetap Root — Jenjang Akun tidak dipakai.
      nama: 'Root tanpa Struktur terhubung',
      role: 'root',
      jenjangAkun: null,
      sel: {
        baca: SEMUA,
        buat: SEMUA,
        sunting: SEMUA,
        nonaktifkan: KECUALI_PP,
        aktifkan: KECUALI_PP,
        hapus: SEMUA,
        pulihkan: SEMUA
      }
    },
    {
      // BPH punya satu sel kelola — `sunting` atas Strukturnya SENDIRI — dan sel
      // itu bersumbu identitas, bukan Jenjang, jadi rumahnya
      // `requireOwnStrukturEditAccess`. Di sumbu Jenjang, BPH nol kelola.
      nama: 'BPH PW',
      role: 'bph',
      jenjangAkun: 'pw',
      sel: {
        baca: SEMUA,
        buat: NOL,
        sunting: NOL,
        nonaktifkan: NOL,
        aktifkan: NOL,
        hapus: NOL,
        pulihkan: NOL
      }
    },
    {
      // Termasuk menghapus sebuah PW utuh: yang melindungi PW bukan Kewenangan
      // tapi prasyarat penghapusan (spec §3), yang bukan urusan gate ini.
      nama: 'BPW PP',
      role: 'bpw',
      jenjangAkun: 'pp',
      sel: {
        baca: SEMUA,
        buat: KECUALI_PP,
        sunting: KECUALI_PP,
        nonaktifkan: KECUALI_PP,
        aktifkan: KECUALI_PP,
        hapus: KECUALI_PP,
        pulihkan: KECUALI_PP
      }
    },
    {
      // Baca dan sunting saja. Nol buat dan nol hapus bukan kelalaian:
      // pembuatan PD tersentralisasi di BPW PP, dan aksi merusak tinggal di
      // sana juga. PW absen dari `sunting` karena satu-satunya PW dalam
      // Cakupannya adalah miliknya sendiri, dan itu ditutup aturan §2.1 no. 6.
      nama: 'BPW PW',
      role: 'bpw',
      jenjangAkun: 'pw',
      sel: {
        baca: SEMUA,
        buat: NOL,
        sunting: ['pd', 'pk'],
        nonaktifkan: NOL,
        aktifkan: NOL,
        hapus: NOL,
        pulihkan: NOL
      }
    },
    {
      nama: 'BPW PD',
      role: 'bpw',
      jenjangAkun: 'pd',
      sel: {
        baca: SEMUA,
        buat: HANYA_PK,
        sunting: HANYA_PK,
        nonaktifkan: HANYA_PK,
        aktifkan: HANYA_PK,
        hapus: HANYA_PK,
        pulihkan: NOL
      }
    },
    {
      nama: 'BPW PDLN',
      role: 'bpw',
      jenjangAkun: 'pdln',
      sel: {
        baca: SEMUA,
        buat: HANYA_PK,
        sunting: HANYA_PK,
        nonaktifkan: HANYA_PK,
        aktifkan: HANYA_PK,
        hapus: HANYA_PK,
        pulihkan: NOL
      }
    },
    {
      // "BPW PK tidak ada barisnya" — Kewenangan itu tidak pernah diterbitkan di
      // Jenjang PK, jadi barisnya nol seluruhnya, `baca` termasuk.
      nama: 'BPW PK (tidak pernah diterbitkan)',
      role: 'bpw',
      jenjangAkun: 'pk',
      sel: {
        baca: NOL,
        buat: NOL,
        sunting: NOL,
        nonaktifkan: NOL,
        aktifkan: NOL,
        hapus: NOL,
        pulihkan: NOL
      }
    },
    {
      nama: 'BPW tanpa Struktur terhubung',
      role: 'bpw',
      jenjangAkun: null,
      sel: {
        baca: NOL,
        buat: NOL,
        sunting: NOL,
        nonaktifkan: NOL,
        aktifkan: NOL,
        hapus: NOL,
        pulihkan: NOL
      }
    },
    {
      nama: 'BPK',
      role: 'bpk',
      jenjangAkun: 'pk',
      sel: {
        baca: NOL,
        buat: NOL,
        sunting: NOL,
        nonaktifkan: NOL,
        aktifkan: NOL,
        hapus: NOL,
        pulihkan: NOL
      }
    },
    {
      // Memberi Humas hak baca rekursif membatalkan ADR 0002 lewat pintu
      // belakang, jadi barisnya nol juga di kolom `baca`.
      nama: 'Humas',
      role: 'humas',
      jenjangAkun: 'pw',
      sel: {
        baca: NOL,
        buat: NOL,
        sunting: NOL,
        nonaktifkan: NOL,
        aktifkan: NOL,
        hapus: NOL,
        pulihkan: NOL
      }
    },
    {
      nama: 'Akun Kader',
      role: 'member',
      jenjangAkun: 'pk',
      sel: {
        baca: NOL,
        buat: NOL,
        sunting: NOL,
        nonaktifkan: NOL,
        aktifkan: NOL,
        hapus: NOL,
        pulihkan: NOL
      }
    }
  ]

  for (const { nama, role, jenjangAkun, sel } of baris) {
    describe(nama, () => {
      for (const aksi of AKSI) {
        it(`${aksi}: ${sel[aksi].length ? sel[aksi].join(', ') : 'nol'}`, () => {
          const hasil = JENJANG.filter((sasaran) =>
            canManageKestrukturan(role, jenjangAkun, sasaran, aksi)
          )
          expect(hasil).toEqual(sel[aksi])
        })
      }
    })
  }

  // Sel yang wajib dinyatakan, bukan disimpulkan (spec §2.3).
  it('menolak menonaktifkan PP untuk siapa pun, Root termasuk', () => {
    expect(canManageKestrukturan('root', 'pp', 'pp', 'nonaktifkan')).toBe(false)
    expect(canManageKestrukturan('root', 'pp', 'pp', 'aktifkan')).toBe(false)
    expect(canManageKestrukturan('bpw', 'pp', 'pp', 'nonaktifkan')).toBe(false)
  })

  it('membiarkan Root menyunting dan menghapus PP', () => {
    expect(canManageKestrukturan('root', 'pp', 'pp', 'sunting')).toBe(true)
    expect(canManageKestrukturan('root', 'pp', 'pp', 'hapus')).toBe(true)
  })

  it('membiarkan BPW PP menghapus sebuah PW utuh', () => {
    expect(canManageKestrukturan('bpw', 'pp', 'pw', 'hapus')).toBe(true)
  })

  it('menolak BPW PP menyentuh PP', () => {
    for (const aksi of AKSI) {
      expect(canManageKestrukturan('bpw', 'pp', 'pp', aksi)).toBe(
        aksi === 'baca'
      )
    }
  })

  it('menolak pulihkan untuk BPW PD dan BPW PDLN', () => {
    expect(canManageKestrukturan('bpw', 'pd', 'pk', 'pulihkan')).toBe(false)
    expect(canManageKestrukturan('bpw', 'pdln', 'pk', 'pulihkan')).toBe(false)
  })

  it('menolak Kewenangan yang tidak dikenal sama sekali', () => {
    for (const aksi of AKSI) {
      expect(canManageKestrukturan('entah', 'pp', 'pk', aksi)).toBe(false)
    }
  })
})

describe('gate kestrukturan', () => {
  let ppId: string
  let pwJabarId: string
  let pwJatimId: string
  let pdBandungId: string
  let pdlnKairoId: string
  let pkItbId: string

  beforeEach(() => {
    mockSession = undefined
  })

  // Pohon Struktur ini hanya dibaca, tidak pernah diubah, jadi cukup disemai
  // sekali — sama seperti `kekaderan.test.ts`.
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

    // PDLN ada di pohon ini justru karena barisnya identik dengan BPW PD di
    // matriks: satu-satunya cara membuktikan gate `pulihkan` menolak keduanya
    // adalah punya keduanya.
    const [pdlnKairo] = await createOrganization({
      name: 'PDLN Kairo',
      slug: 'pdln-kairo',
      code: 'PD.LN-1',
      type: 'pdln',
      parentId: pp.id,
      isNonActive: false
    })
    pdlnKairoId = pdlnKairo.id

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      code: '01.PK-1',
      type: 'pk',
      parentId: pdBandung.id,
      isNonActive: false
    })
    pkItbId = pkItb.id
  })

  describe('requireKestrukturanReadAccess', () => {
    it('menolak tanpa sesi', async () => {
      expect(await requireKestrukturanReadAccess(pwJabarId)).toBeNull()
    })

    it('mengizinkan Root membuka Struktur mana pun', async () => {
      mockSession = sessionWith('root', ppId)
      expect(await requireKestrukturanReadAccess(pwJatimId)).toEqual({
        role: 'root',
        connectedOrganizationId: ppId
      })
    })

    it('mengizinkan BPH membuka Struktur di dalam Cakupannya, Strukturnya sendiri termasuk', async () => {
      mockSession = sessionWith('bph', pwJabarId)
      expect(await requireKestrukturanReadAccess(pwJabarId)).not.toBeNull()
      expect(await requireKestrukturanReadAccess(pdBandungId)).not.toBeNull()
    })

    it('menolak BPH di luar Cakupannya', async () => {
      mockSession = sessionWith('bph', pwJabarId)
      expect(await requireKestrukturanReadAccess(pwJatimId)).toBeNull()
    })

    it('mengizinkan BPW membuka Struktur di dalam Cakupannya', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(await requireKestrukturanReadAccess(pdBandungId)).not.toBeNull()
    })

    it('menolak BPW di luar Cakupannya', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(await requireKestrukturanReadAccess(pwJatimId)).toBeNull()
    })

    it('menolak BPK, Humas, dan Akun Kader meski Strukturnya sendiri', async () => {
      for (const role of ['bpk', 'humas', 'member']) {
        mockSession = sessionWith(role, pwJabarId)
        expect(await requireKestrukturanReadAccess(pwJabarId)).toBeNull()
      }
    })

    it('menolak Struktur yang tidak ada', async () => {
      mockSession = sessionWith('root', ppId)
      expect(
        await requireKestrukturanReadAccess(
          '00000000-0000-0000-0000-000000000000'
        )
      ).toBeNull()
    })
  })

  describe('requireKestrukturanCreateAccess', () => {
    it('menolak tanpa sesi', async () => {
      expect(
        await requireKestrukturanCreateAccess(pwJabarId, 'pd')
      ).not.toBeNull()
    })

    it('menolak Kewenangan yang nol di seluruh baris', async () => {
      for (const role of ['bph', 'bpk', 'humas', 'member']) {
        mockSession = sessionWith(role, ppId)
        expect(
          await requireKestrukturanCreateAccess(pwJabarId, 'pd')
        ).not.toBeNull()
      }
    })

    it('mengizinkan BPW PP membuat PD di bawah PW mana pun', async () => {
      mockSession = sessionWith('bpw', ppId)
      expect(await requireKestrukturanCreateAccess(pwJatimId, 'pd')).toBeNull()
    })

    it('mengizinkan BPW PP membuat PW langsung di bawah Strukturnya sendiri', async () => {
      // Aturan "sasaran bukan Strukturnya sendiri" tidak berlaku di jalur buat:
      // sasarannya anak yang belum ada, sementara induk cuma jangkar Cakupan.
      mockSession = sessionWith('bpw', ppId)
      expect(await requireKestrukturanCreateAccess(ppId, 'pw')).toBeNull()
    })

    it('mengizinkan BPW PD membuat PK di bawah Strukturnya sendiri', async () => {
      mockSession = sessionWith('bpw', pdBandungId)
      expect(
        await requireKestrukturanCreateAccess(pdBandungId, 'pk')
      ).toBeNull()
    })

    it('menolak BPW PW membuat apa pun — barisnya nol', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(
        await requireKestrukturanCreateAccess(pwJabarId, 'pd')
      ).not.toBeNull()
    })

    it('menolak BPW membuat di luar Cakupannya', async () => {
      mockSession = sessionWith('bpw', pdBandungId)
      expect(
        await requireKestrukturanCreateAccess(pwJatimId, 'pk')
      ).not.toBeNull()
    })

    it('menolak Jenjang anak yang melompat meski Cakupannya benar', async () => {
      mockSession = sessionWith('root', ppId)
      expect(
        await requireKestrukturanCreateAccess(pwJabarId, 'pk')
      ).not.toBeNull()
    })

    it('menolak pembuatan PP oleh siapa pun, Root termasuk', async () => {
      mockSession = sessionWith('root', ppId)
      expect(await requireKestrukturanCreateAccess(ppId, 'pp')).not.toBeNull()
    })

    it('menolak induk yang tidak ada', async () => {
      mockSession = sessionWith('root', ppId)
      expect(
        await requireKestrukturanCreateAccess(
          '00000000-0000-0000-0000-000000000000',
          'pw'
        )
      ).not.toBeNull()
    })
  })

  describe('requireKestrukturanManageAccess', () => {
    it('menolak tanpa sesi', async () => {
      expect(
        await requireKestrukturanManageAccess(pdBandungId, 'sunting')
      ).not.toBeNull()
    })

    it('mengizinkan Root menyunting apa pun, PP termasuk', async () => {
      mockSession = sessionWith('root', ppId)
      expect(await requireKestrukturanManageAccess(ppId, 'sunting')).toBeNull()
      expect(
        await requireKestrukturanManageAccess(pwJatimId, 'sunting')
      ).toBeNull()
    })

    it('menolak siapa pun menonaktifkan PP, Root termasuk', async () => {
      mockSession = sessionWith('root', ppId)
      expect(
        await requireKestrukturanManageAccess(ppId, 'nonaktifkan')
      ).not.toBeNull()
      expect(
        await requireKestrukturanManageAccess(ppId, 'aktifkan')
      ).not.toBeNull()
    })

    it('mengizinkan BPW PP mengelola Struktur di bawah PP', async () => {
      mockSession = sessionWith('bpw', ppId)
      for (const aksi of [
        'sunting',
        'nonaktifkan',
        'aktifkan',
        'hapus'
      ] as const) {
        expect(
          await requireKestrukturanManageAccess(pwJatimId, aksi)
        ).toBeNull()
      }
    })

    // Konsekuensi paling penting dari aturan "bukan Strukturnya sendiri":
    // Cakupan seorang BPW PP adalah seluruh negeri, jadi tanpa itu PP tetap
    // tersunting oleh Kewenangan yang tidak boleh menjangkaunya.
    it('menolak BPW PP mengelola PP', async () => {
      mockSession = sessionWith('bpw', ppId)
      expect(
        await requireKestrukturanManageAccess(ppId, 'sunting')
      ).not.toBeNull()
    })

    it('menolak BPW mengelola Strukturnya sendiri', async () => {
      mockSession = sessionWith('bpw', pdBandungId)
      expect(
        await requireKestrukturanManageAccess(pdBandungId, 'sunting')
      ).not.toBeNull()
    })

    it('mengizinkan BPW PD mengelola PK di bawahnya', async () => {
      mockSession = sessionWith('bpw', pdBandungId)
      expect(await requireKestrukturanManageAccess(pkItbId, 'hapus')).toBeNull()
    })

    it('menolak BPW PD mengelola Jenjang di luar PK', async () => {
      mockSession = sessionWith('bpw', pdBandungId)
      expect(
        await requireKestrukturanManageAccess(pwJabarId, 'sunting')
      ).not.toBeNull()
    })

    it('mengizinkan BPW PW menyunting PD di bawahnya', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(
        await requireKestrukturanManageAccess(pdBandungId, 'sunting')
      ).toBeNull()
    })

    it('menolak BPW PW merusak apa pun — sunting saja yang dipegangnya', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      for (const aksi of ['nonaktifkan', 'aktifkan', 'hapus'] as const) {
        expect(
          await requireKestrukturanManageAccess(pdBandungId, aksi)
        ).not.toBeNull()
      }
    })

    it('menolak BPW PW menyunting PW-nya sendiri', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      expect(
        await requireKestrukturanManageAccess(pwJabarId, 'sunting')
      ).not.toBeNull()
    })

    it('menolak BPW mengelola Struktur di luar Cakupannya', async () => {
      mockSession = sessionWith('bpw', pdBandungId)
      expect(
        await requireKestrukturanManageAccess(pwJatimId, 'sunting')
      ).not.toBeNull()
    })

    it('menolak BPH, BPK, Humas, dan Akun Kader', async () => {
      for (const role of ['bph', 'bpk', 'humas', 'member']) {
        mockSession = sessionWith(role, pwJabarId)
        expect(
          await requireKestrukturanManageAccess(pdBandungId, 'sunting')
        ).not.toBeNull()
      }
    })

    it('menolak Struktur sasaran yang tidak ada', async () => {
      mockSession = sessionWith('root', ppId)
      expect(
        await requireKestrukturanManageAccess(
          '00000000-0000-0000-0000-000000000000',
          'sunting'
        )
      ).not.toBeNull()
    })
  })

  describe('requireOwnStrukturEditAccess', () => {
    it('menolak tanpa sesi', async () => {
      expect(await requireOwnStrukturEditAccess()).toBeNull()
    })

    it('mengembalikan Struktur si Akun untuk BPH — otorisasi dan data sekali jalan', async () => {
      mockSession = sessionWith('bph', pwJabarId)
      const struktur = await requireOwnStrukturEditAccess()
      expect(struktur?.id).toBe(pwJabarId)
      expect(struktur?.name).toBe('PW Jabar')
    })

    it('menolak Root — ia sudah menyunting Struktur mana pun lewat branches', async () => {
      mockSession = sessionWith('root', ppId)
      expect(await requireOwnStrukturEditAccess()).toBeNull()
    })

    it('menolak BPW, BPK, Humas, dan Akun Kader', async () => {
      for (const role of ['bpw', 'bpk', 'humas', 'member']) {
        mockSession = sessionWith(role, pwJabarId)
        expect(await requireOwnStrukturEditAccess()).toBeNull()
      }
    })

    it('menolak BPH tanpa Struktur terhubung', async () => {
      mockSession = sessionWith('bph', null)
      expect(await requireOwnStrukturEditAccess()).toBeNull()
    })
  })

  describe('requireStrukturRestoreAccess', () => {
    it('menolak tanpa sesi', async () => {
      expect(await requireStrukturRestoreAccess()).not.toBeNull()
    })

    it('mengizinkan Root', async () => {
      mockSession = sessionWith('root', ppId)
      expect(await requireStrukturRestoreAccess()).toBeNull()
    })

    it('mengizinkan BPW yang Struktur terhubungnya PP', async () => {
      mockSession = sessionWith('bpw', ppId)
      expect(await requireStrukturRestoreAccess()).toBeNull()
    })

    // Menyalin pola `role === 'bpw'` dari tempat lain membuka pemulihan untuk
    // seluruh BPW se-Indonesia.
    it('menolak BPW PW, BPW PD, dan BPW PDLN', async () => {
      for (const orgId of [pwJabarId, pdBandungId, pdlnKairoId]) {
        mockSession = sessionWith('bpw', orgId)
        expect(await requireStrukturRestoreAccess()).not.toBeNull()
      }
    })

    it('menolak BPW tanpa Struktur terhubung', async () => {
      mockSession = sessionWith('bpw', null)
      expect(await requireStrukturRestoreAccess()).not.toBeNull()
    })

    it('menolak BPH, BPK, Humas, dan Akun Kader', async () => {
      for (const role of ['bph', 'bpk', 'humas', 'member']) {
        mockSession = sessionWith(role, ppId)
        expect(await requireStrukturRestoreAccess()).not.toBeNull()
      }
    })
  })
})
