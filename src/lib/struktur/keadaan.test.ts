import { describe, it, expect } from 'bun:test'
import {
  checkDeactivation,
  checkReactivation,
  checkRestore,
  checkDeletion,
  describeChildJenjang
} from './keadaan'

/**
 * Tiket 21 dan 22, spec §1.5, §2.3, §3, §6.4. Tabel argumen-ke-hasil, nol
 * fixture — ketiga aturannya murni, dan aksinya cuma yang membacakan baris ke
 * mereka.
 */

const child = (id: string) => ({ id, name: `Struktur ${id}` })

describe('checkDeactivation', () => {
  it('menolak PP, dan alasannya bukan melindungi Akun root', () => {
    const refusal = checkDeactivation({ type: 'pp' }, [])

    expect(refusal?.reason).toBe('pp')
  })

  it('menolak PP meski nol anak Aktif — larangannya ada di sasaran', () => {
    expect(checkDeactivation({ type: 'pp' }, [])).not.toBeNull()
  })

  it('menolak induk yang masih punya anak Aktif', () => {
    const refusal = checkDeactivation({ type: 'pd' }, [
      child('a'),
      child('b'),
      child('c')
    ])

    expect(refusal?.reason).toBe('anak-aktif')
    expect(
      refusal?.reason === 'anak-aktif' && refusal.activeChildren
    ).toHaveLength(3)
  })

  it('menyebut hitungan dan Jenjang anaknya di pesannya', () => {
    const refusal = checkDeactivation({ type: 'pd' }, [child('a'), child('b')])

    expect(refusal?.message).toContain('2')
    expect(refusal?.message).toContain('Komisariat')
  })

  it('menawarkan jalan keluarnya, bukan cuma menyatakan penolakan', () => {
    const refusal = checkDeactivation({ type: 'pw' }, [child('a')])

    expect(refusal?.message).toMatch(/[Pp]indahkan/)
    expect(refusal?.message).toMatch(/nonaktifkan/i)
  })

  it('meloloskan induk yang anaknya sudah Non-Aktif semua — mereka boleh ditinggal', () => {
    expect(checkDeactivation({ type: 'pd' }, [])).toBeNull()
  })

  it('meloloskan Jenjang selain PP tanpa anak', () => {
    for (const type of ['pw', 'pdln', 'pd', 'pk'] as const) {
      expect(checkDeactivation({ type }, [])).toBeNull()
    }
  })
})

describe('checkReactivation', () => {
  it('meloloskan Struktur yang induknya Aktif', () => {
    expect(
      checkReactivation({ parentId: 'p' }, { id: 'p', state: 'aktif' })
    ).toBeNull()
  })

  it('menolak Struktur yang induknya Non-Aktif', () => {
    const refusal = checkReactivation(
      { parentId: 'p' },
      { id: 'p', state: 'non_aktif' }
    )

    expect(refusal).not.toBeNull()
    expect(refusal?.message).toMatch(/[Aa]ktifkan induk/)
  })

  it('menolak Struktur yang induknya sudah Terhapus, tanpa menyebut bahwa ia terhapus', () => {
    const refusal = checkReactivation(
      { parentId: 'p' },
      { id: 'p', state: 'terhapus' }
    )

    expect(refusal).not.toBeNull()
    expect(refusal?.message).not.toMatch(/hapus/i)
  })

  it('menolak saat induknya tidak terbaca sama sekali — Terhapus datang begitu', () => {
    // Lapisan baca menyaring Terhapus (tiket 20), jadi induk yang Terhapus
    // sampai ke sini sebagai `null`, bukan sebagai baris ber-state.
    expect(checkReactivation({ parentId: 'p' }, null)).not.toBeNull()
  })

  it('meloloskan Struktur yang memang tidak punya induk', () => {
    expect(checkReactivation({ parentId: null }, null)).toBeNull()
  })
})

describe('checkDeletion', () => {
  it('meloloskan Struktur yang kosong bertiga', () => {
    expect(
      checkDeletion({ type: 'pd' }, { children: 0, members: 0, trainings: 0 })
    ).toBeNull()
  })

  it('menolak selama masih ada Kader hidup', () => {
    const refusal = checkDeletion(
      { type: 'pk' },
      { children: 0, members: 847, trainings: 0 }
    )

    expect(refusal?.counts.members).toBe(847)
    expect(refusal?.message).toContain('847 Kader')
  })

  it('merangkai kalimat utuh saat lebih dari satu prasyarat gagal', () => {
    const refusal = checkDeletion(
      { type: 'pd' },
      { children: 3, members: 847, trainings: 0 }
    )

    expect(refusal?.message).toBe(
      'Tidak bisa dihapus: masih ada 847 Kader dan 3 Komisariat.'
    )
  })

  it('merangkai ketiganya dengan koma dan satu "dan"', () => {
    const refusal = checkDeletion(
      { type: 'pw' },
      { children: 2, members: 5, trainings: 1 }
    )

    expect(refusal?.message).toBe(
      'Tidak bisa dihapus: masih ada 5 Kader, 1 Daurah dan 2 Daerah.'
    )
  })

  it('menolak selama masih ada Daurah, meski nol Kader dan nol anak', () => {
    const refusal = checkDeletion(
      { type: 'pk' },
      { children: 0, members: 0, trainings: 4 }
    )

    expect(refusal?.counts.trainings).toBe(4)
  })

  it('membawa ketiga hitungan meski cuma satu yang gagal', () => {
    const refusal = checkDeletion(
      { type: 'pd' },
      { children: 1, members: 0, trainings: 0 }
    )

    expect(refusal?.counts).toEqual({ children: 1, members: 0, trainings: 0 })
  })
})

describe('describeChildJenjang', () => {
  it('menamai anak tiap Jenjang dengan kata domainnya', () => {
    expect(describeChildJenjang('pp')).toBe('Wilayah')
    expect(describeChildJenjang('pw')).toBe('Daerah')
    expect(describeChildJenjang('pd')).toBe('Komisariat')
    expect(describeChildJenjang('pdln')).toBe('Komisariat')
  })

  it('jatuh ke kata umum untuk Jenjang yang tidak punya anak', () => {
    expect(describeChildJenjang('pk')).toBe('Struktur')
  })
})

describe('checkRestore', () => {
  it('meloloskan Struktur yang induknya Aktif', () => {
    expect(
      checkRestore({ parentId: 'induk' }, { state: 'aktif' }, null)
    ).toBeNull()
  })

  it('meloloskan Struktur yang memang tidak punya induk', () => {
    expect(checkRestore({ parentId: null }, null, null)).toBeNull()
  })

  it('menolak induk Non-Aktif, dan menyebut dua jalan keluarnya', () => {
    const refusal = checkRestore(
      { parentId: 'induk' },
      { state: 'non_aktif' },
      null
    )

    expect(refusal?.reason).toBe('induk-non-aktif')
    expect(refusal?.message).toMatch(/aktifkan induknya/i)
    expect(refusal?.message).toMatch(/pindahkan/i)
  })

  it('menyebut nama induk yang juga Terhapus dan menyerahkan barisnya', () => {
    const refusal = checkRestore({ parentId: 'induk' }, null, {
      id: 'induk',
      name: 'PD Jakarta'
    })

    expect(refusal?.reason).toBe('induk-terhapus')
    expect(refusal?.message).toContain('PD Jakarta')
    expect(
      refusal?.reason === 'induk-terhapus' ? refusal.parent.id : null
    ).toBe('induk')
  })

  it('menyebut urutannya, bukan sekadar menolak — pemulihan dari atas ke bawah', () => {
    const refusal = checkRestore({ parentId: 'induk' }, null, {
      id: 'induk',
      name: 'PD Jakarta'
    })

    expect(refusal?.message).toMatch(/atas ke bawah/i)
  })

  it('mendahulukan induk Terhapus atas induk Non-Aktif saat dua-duanya terbaca', () => {
    // Tidak mungkin terjadi lewat data, tapi urutan cabangnya tetap dinyatakan:
    // yang Terhapus punya jalan keluar di halaman yang sama, yang Non-Aktif
    // tidak, dan pesan yang salah mengirim orangnya ke tempat yang salah.
    const refusal = checkRestore(
      { parentId: 'induk' },
      { state: 'non_aktif' },
      { id: 'induk', name: 'PD Jakarta' }
    )

    expect(refusal?.reason).toBe('induk-terhapus')
  })
})
