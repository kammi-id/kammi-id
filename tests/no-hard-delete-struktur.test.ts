import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'

/**
 * Tiket 22 / ADR 0004: **penghapusan Struktur selalu soft, selamanya.**
 *
 * Sejak tiket 13 basis data sendiri yang menjaminnya — ketujuh FK ke
 * `organization` NO ACTION, jadi `DELETE` sungguhan gagal dengan `23503`. Tes
 * ini menjaga lapisan di atasnya: jangan sampai ada yang menulis jalur hard
 * delete yang **gagal saat dijalankan** alih-alih tidak pernah ada. Kegagalan
 * runtime di jalur yang jarang ditempuh adalah kegagalan yang ketahuan
 * belakangan.
 *
 * Bentuknya meniru penjaga `resolveOrgCodes` di `src/lib/utils/member.test.ts`:
 * memindai sumber, bukan menjalankannya, sebab yang dijaga adalah **ketiadaan**
 * sebuah jalur.
 */
describe('nol hard delete atas organization', () => {
  const read = (path: string) => readFileSync(path, 'utf8')

  const sources = [...new Bun.Glob('src/**/*.{ts,tsx}').scanSync(process.cwd())]
    .map((file) => file.split('\\').join('/'))
    .filter((file) => !file.includes('.test.'))

  it('benar-benar memindai sesuatu', () => {
    // Penjaga yang lolos karena daftarnya kosong bukan penjaga. Angkanya
    // sengaja longgar: yang dijaga adalah "glob-nya masih menemukan sumber",
    // bukan jumlah berkas repo.
    expect(sources.length).toBeGreaterThan(100)
  })

  it('menangkap pola yang dicarinya, bukan cuma tidak menemukan apa-apa', () => {
    const pattern = /\.delete\(\s*organization\s*[),]/
    expect(pattern.test('await db.delete(organization).where(eq(id, x))')).toBe(
      true
    )
    expect(pattern.test('await tx.delete(userTable)')).toBe(false)
  })

  it('tidak ada berkas yang memanggil delete() atas tabel organization', () => {
    // `db.delete(organization)` dan `tx.delete(organization)` — dua ejaan, satu
    // maksud. Skema lain yang kebetulan bernama mirip tidak tertangkap, dan itu
    // memang bukan urusan penjaga ini.
    const offenders = sources.filter((file) =>
      /\.delete\(\s*organization\s*[),]/.test(read(file))
    )

    expect(offenders).toEqual([])
  })

  it('tidak ada DELETE FROM organization di SQL mentah', () => {
    const offenders = sources.filter((file) =>
      /delete\s+from\s+"?organization"?/i.test(read(file))
    )

    expect(offenders).toEqual([])
  })

  it('menyediakan jalur soft delete-nya, supaya penjaga ini bukan sekadar larangan', () => {
    expect(read('src/db/query/organization.ts')).toContain(
      'export const softDeleteOrganization'
    )
  })
})
