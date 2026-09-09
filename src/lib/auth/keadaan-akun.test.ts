import { describe, it, expect } from 'bun:test'
import { mayHoldSession } from './keadaan-akun'
import { type UserRole } from '~/lib/access-control'
import { type OrganizationState } from '~/db/query/organization'

/**
 * Tiket 19 / spec §5. Tabel argumen-ke-hasil, **nol fixture** — derivasinya
 * murni, dan yang perlu dijaga adalah bentuk tabelnya, bukan sebuah sesi.
 *
 * Enam Kewenangan kali tiga Keadaan Struktur, plus baris tanpa Struktur sama
 * sekali. Ditulis penuh alih-alih dihasilkan dari daftar yang sama yang dipakai
 * implementasinya — sebuah tabel yang meminjam daftar dari yang diujinya tidak
 * menguji daftarnya.
 */
describe('mayHoldSession', () => {
  const cases: Array<{
    role: UserRole
    strukturState: OrganizationState | null
    expected: boolean
    why: string
  }> = [
    { role: 'bph', strukturState: 'aktif', expected: true, why: 'BPH, Aktif' },
    {
      role: 'bph',
      strukturState: 'non_aktif',
      expected: false,
      why: 'BPH, Non-Aktif'
    },
    {
      role: 'bph',
      strukturState: 'terhapus',
      expected: false,
      why: 'BPH, Terhapus'
    },

    { role: 'bpk', strukturState: 'aktif', expected: true, why: 'BPK, Aktif' },
    {
      role: 'bpk',
      strukturState: 'non_aktif',
      expected: false,
      why: 'BPK, Non-Aktif'
    },
    {
      role: 'bpk',
      strukturState: 'terhapus',
      expected: false,
      why: 'BPK, Terhapus'
    },

    { role: 'bpw', strukturState: 'aktif', expected: true, why: 'BPW, Aktif' },
    {
      role: 'bpw',
      strukturState: 'non_aktif',
      expected: false,
      why: 'BPW, Non-Aktif'
    },
    {
      role: 'bpw',
      strukturState: 'terhapus',
      expected: false,
      why: 'BPW, Terhapus'
    },

    {
      role: 'humas',
      strukturState: 'aktif',
      expected: true,
      why: 'Humas, Aktif'
    },
    {
      role: 'humas',
      strukturState: 'non_aktif',
      expected: false,
      why: 'Humas, Non-Aktif'
    },
    {
      role: 'humas',
      strukturState: 'terhapus',
      expected: false,
      why: 'Humas, Terhapus'
    },

    // Akun Kader tidak ikut mati (spec §5.4) — kalau menonaktifkan sebuah PD
    // ikut mengunci ratusan Kader, definisi Non-Aktif jadi bohong.
    {
      role: 'member',
      strukturState: 'aktif',
      expected: true,
      why: 'Akun Kader, Aktif'
    },
    {
      role: 'member',
      strukturState: 'non_aktif',
      expected: true,
      why: 'Akun Kader, Non-Aktif'
    },
    {
      role: 'member',
      strukturState: 'terhapus',
      expected: true,
      why: 'Akun Kader, Terhapus — hampa oleh prasyarat, tetap dijawab'
    },

    // Root absen dari daftar §5.4, dan itu disengaja.
    {
      role: 'root',
      strukturState: 'aktif',
      expected: true,
      why: 'Root, Aktif'
    },
    {
      role: 'root',
      strukturState: 'non_aktif',
      expected: true,
      why: 'Root — PP-nya tidak bisa dinonaktifkan oleh siapa pun'
    },
    {
      role: 'root',
      strukturState: 'terhapus',
      expected: true,
      why: 'Root tetap masuk — ia jalan terakhir kalau PP sampai hilang'
    },

    // Struktur yang tidak terbaca sama sekali.
    {
      role: 'bpw',
      strukturState: null,
      expected: false,
      why: 'Akun kepengurusan tanpa Struktur terhubung'
    },
    {
      role: 'member',
      strukturState: null,
      expected: true,
      why: 'Akun Kader tidak bersandar pada Struktur terhubung'
    },
    {
      role: 'root',
      strukturState: null,
      expected: true,
      why: 'Root tanpa Struktur terhubung'
    }
  ]

  for (const { role, strukturState, expected, why } of cases) {
    it(`${why} → ${expected ? 'boleh' : 'tidak boleh'} bersesi`, () => {
      expect(mayHoldSession(role, strukturState)).toBe(expected)
    })
  }

  it('menjawab tiap Kewenangan yang ada, tanpa satu pun jatuh ke asali', () => {
    const roles: UserRole[] = ['root', 'bph', 'bpk', 'bpw', 'humas', 'member']
    const covered = new Set(cases.map((c) => c.role))

    expect([...covered].sort()).toEqual([...roles].sort())
  })
})
