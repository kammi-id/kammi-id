import { describe, it, expect } from 'bun:test'
import { readFileSync } from 'fs'

/**
 * Tiket 22 / ADR 0004: **penghapusan Struktur selalu soft, kecuali satu jalur
 * bernama.**
 *
 * Sejak tiket 13 basis data sendiri yang menjaminnya — ketujuh FK ke
 * `organization` NO ACTION, jadi `DELETE` sungguhan gagal dengan `23503`. Tes
 * ini menjaga lapisan di atasnya: jangan sampai ada yang menulis jalur hard
 * delete yang **gagal saat dijalankan** alih-alih tidak pernah ada. Kegagalan
 * runtime di jalur yang jarang ditempuh adalah kegagalan yang ketahuan
 * belakangan.
 *
 * **ADR 0019 membuka satu pengecualian, disengaja dan diaudit**:
 * `hardDeleteOrganization` di `src/db/query/organization.ts`, di belakang
 * `checkHardDeletion` — gerbang yang justru lebih ketat dari prasyarat Hapus
 * biasa (nol Kader SELAMANYA, nol anak dalam Keadaan apa pun). Ditandai
 * `SANCTIONED_MARKER` di baris pemanggilannya sendiri, bukan dikecualikan
 * satu berkas penuh: penjaga ini tetap menangkap pemanggilan LAIN yang tidak
 * bertanda, di berkas yang sama maupun di berkas lain mana pun.
 *
 * Bentuknya meniru penjaga `resolveOrgCodes` di `src/lib/utils/member.test.ts`:
 * memindai sumber, bukan menjalankannya, sebab yang dijaga adalah **ketiadaan**
 * sebuah jalur (di luar satu pengecualian bertanda itu).
 */
describe('nol hard delete atas organization, kecuali satu jalur bertanda', () => {
  const read = (path: string) => readFileSync(path, 'utf8')

  const sources = [...new Bun.Glob('src/**/*.{ts,tsx}').scanSync(process.cwd())]
    .map((file) => file.split('\\').join('/'))
    .filter((file) => !file.includes('.test.'))

  /**
   * Satu-satunya jalan lolos: baris pemanggilannya sendiri ditandai persis
   * ini, sebagai komentar di baris yang sama. Menghapus baris bertanda
   * sebelum mencocokkan pola, sehingga yang tersisa untuk dicocokkan adalah
   * persis "segala sesuatu yang TIDAK secara eksplisit mengaku sebagai
   * pengecualian ADR 0019".
   */
  const SANCTIONED_MARKER = 'ADR_0019_SANCTIONED_HARD_DELETE'

  const withoutSanctionedLines = (content: string): string =>
    content
      .split('\n')
      .filter((line) => !line.includes(SANCTIONED_MARKER))
      .join('\n')

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

  it('tidak ada berkas yang memanggil delete() atas tabel organization, di luar jalur bertanda', () => {
    // `db.delete(organization)` dan `tx.delete(organization)` — dua ejaan, satu
    // maksud. Skema lain yang kebetulan bernama mirip tidak tertangkap, dan itu
    // memang bukan urusan penjaga ini.
    const offenders = sources.filter((file) =>
      /\.delete\(\s*organization\s*[),]/.test(
        withoutSanctionedLines(read(file))
      )
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

  it('jalur bertanda muncul tepat sekali di seluruh repo — bukan tempat disalin ke pemanggilan lain', () => {
    // Kalau ini lebih dari satu, tandanya sudah dipakai ulang untuk
    // menyelundupkan pemanggilan hard delete lain lewat penjaga ini — bukan
    // lagi "satu pengecualian bernama", tapi lubang yang bisa dilebarkan.
    const occurrences = sources.reduce((total, file) => {
      const matches = read(file).match(new RegExp(SANCTIONED_MARKER, 'g'))
      return total + (matches?.length ?? 0)
    }, 0)

    expect(occurrences).toBe(1)
  })

  it('jalur bertanda hanya menghapus baris organization, bukan tabel lain', () => {
    const [markedLine] = sources
      .map((file) => read(file))
      .flatMap((content) => content.split('\n'))
      .filter((line) => line.includes(SANCTIONED_MARKER))

    expect(markedLine).toMatch(/\.delete\(\s*organization\s*\)/)
  })
})
