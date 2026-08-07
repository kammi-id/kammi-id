import { describe, it, expect } from 'bun:test'
import { checkMoveCandidate, filterMoveCandidates } from './pindah-induk'
import type { StrukturRef } from './pindah-induk'

const node = (
  id: string,
  type: StrukturRef['type'],
  code: string,
  state: StrukturRef['state'] = 'aktif'
): StrukturRef => ({ id, type, code, state })

const pp = node('pp', 'pp', 'PP-00')
const pwJabar = node('pw-jabar', 'pw', 'PW1')
const pwJatim = node('pw-jatim', 'pw', 'PW2')
const pdBandung = node('pd-bandung', 'pd', '01.PD-1')
const pdBogor = node('pd-bogor', 'pd', '01.PD-2')
const pdSurabaya = node('pd-surabaya', 'pd', '02.PD-1')
const pdlnMesir = node('pdln-mesir', 'pdln', 'PD.LN-8')
const pdlnTurki = node('pdln-turki', 'pdln', 'PD.LN-9')
const pkItb = node('pk-itb', 'pk', '01.PD-1.ITB')
const pkUnpad = node('pk-unpad', 'pk', '01.PD-1.UNPAD')
const pkKairo = node('pk-kairo', 'pk', 'PK.LN-1')

const allows = (
  org: StrukturRef,
  parent: StrukturRef | null,
  to: StrukturRef
) => checkMoveCandidate(org, parent, to) === null

describe('checkMoveCandidate — PK di bawah PD', () => {
  it('menerima PD lain di PW yang sama', () => {
    expect(allows(pkItb, pdBandung, pdBogor)).toBe(true)
  })

  it('menerima PW-nya sendiri — penitipan, bukan penempatan', () => {
    expect(allows(pkItb, pdBandung, pwJabar)).toBe(true)
  })

  it('menolak PD di PW lain', () => {
    expect(allows(pkItb, pdBandung, pdSurabaya)).toBe(false)
  })

  it('menolak PW lain', () => {
    expect(allows(pkItb, pdBandung, pwJatim)).toBe(false)
  })

  it('menolak PP', () => {
    expect(allows(pkItb, pdBandung, pp)).toBe(false)
  })

  it('menolak PK lain — Komisariat tidak menampung Komisariat', () => {
    expect(allows(pkItb, pdBandung, pkUnpad)).toBe(false)
  })

  it('menolak induk yang sedang ditempati — tidak ada yang dipindahkan', () => {
    expect(allows(pkItb, pdBandung, pdBandung)).toBe(false)
  })

  it('menolak dirinya sendiri', () => {
    expect(allows(pkItb, pdBandung, pkItb)).toBe(false)
  })
})

describe('checkMoveCandidate — PK di bawah PDLN', () => {
  it('menerima PDLN lain', () => {
    expect(allows(pkKairo, pdlnMesir, pdlnTurki)).toBe(true)
  })

  it('menolak PW — pwCode berubah 99 menjadi 01', () => {
    expect(allows(pkKairo, pdlnMesir, pwJabar)).toBe(false)
  })

  it('menolak PD mana pun', () => {
    expect(allows(pkKairo, pdlnMesir, pdBandung)).toBe(false)
  })

  it('menolak PP walau PP menampung PDLN', () => {
    expect(allows(pkKairo, pdlnMesir, pp)).toBe(false)
  })
})

describe('checkMoveCandidate — Jenjang selain PK', () => {
  it('menolak PD ke PW lain', () => {
    expect(allows(pdBandung, pwJabar, pwJatim)).toBe(false)
  })

  it('menolak PD ke PD lain', () => {
    expect(allows(pdBandung, pwJabar, pdBogor)).toBe(false)
  })

  it('menolak PD ke PW-nya sendiri — sudah di sana', () => {
    expect(allows(pdBandung, pwJabar, pwJabar)).toBe(false)
  })

  it('menolak PDLN ke PW', () => {
    expect(allows(pdlnMesir, pp, pwJabar)).toBe(false)
  })

  it('menolak PW ke mana pun', () => {
    expect(allows(pwJabar, pp, pwJatim)).toBe(false)
    expect(allows(pwJabar, pp, pdBandung)).toBe(false)
  })

  it('menolak PP, yang tidak punya induk sama sekali', () => {
    expect(allows(pp, null, pwJabar)).toBe(false)
  })
})

describe('checkMoveCandidate — Keadaan induk tujuan', () => {
  const pdBogorNonAktif = node('pd-bogor', 'pd', '01.PD-2', 'non_aktif')
  const pdBogorTerhapus = node('pd-bogor', 'pd', '01.PD-2', 'terhapus')

  it('menolak induk Non-Aktif — memarkir di jalan buntu', () => {
    expect(allows(pkItb, pdBandung, pdBogorNonAktif)).toBe(false)
    expect(checkMoveCandidate(pkItb, pdBandung, pdBogorNonAktif)).toContain(
      'Non-Aktif'
    )
  })

  it('menjawab induk Terhapus persis seperti yang tidak pernah ada', () => {
    expect(checkMoveCandidate(pkItb, pdBandung, pdBogorTerhapus)).toBe(
      'Struktur induk tidak ditemukan.'
    )
  })

  it('tidak pernah menyebut bahwa Struktur Terhapus itu ada', () => {
    const pesan = checkMoveCandidate(pkItb, pdBandung, pdBogorTerhapus) ?? ''
    expect(pesan.toLowerCase()).not.toContain('hapus')
  })
})

describe('checkMoveCandidate — pesan penolakan', () => {
  it('membedakan "sudah di sana" dari "mengubah Nomor Induk"', () => {
    const sudahDiSana = checkMoveCandidate(pkItb, pdBandung, pdBandung)
    const ubahNia = checkMoveCandidate(pkItb, pdBandung, pdSurabaya)

    expect(sudahDiSana).toContain('sudah berada')
    expect(ubahNia).toContain('Nomor Induk')
    expect(sudahDiSana).not.toBe(ubahNia)
  })

  it('menyebut bentuk pohon saat bentuknyalah yang salah', () => {
    expect(checkMoveCandidate(pkItb, pdBandung, pp)).toBe(
      'Struktur PK tidak dapat berada langsung di bawah PP.'
    )
    expect(checkMoveCandidate(pdBandung, pwJabar, pdBogor)).toBe(
      'Struktur PD tidak dapat berada langsung di bawah PD.'
    )
  })

  it('menyebut Nomor Induk saat bentuknya sah tapi kodenya tidak terbaca', () => {
    // PP menampung PDLN, jadi bentuknya lolos untuk PK yang sedang di PDLN —
    // yang gugur benar-benar penurunan NIA-nya, sebab PP tidak menamai PW mana
    // pun.
    expect(checkMoveCandidate(pkKairo, pdlnMesir, pp)).toContain('Nomor Induk')
  })
})

describe('filterMoveCandidates', () => {
  const semua = [
    pp,
    pwJabar,
    pwJatim,
    pdBandung,
    pdBogor,
    pdSurabaya,
    pdlnMesir,
    pdlnTurki,
    pkItb,
    pkUnpad,
    pkKairo
  ]

  it('menyisakan PD lain di PW itu dan PW itu sendiri', () => {
    const ids = filterMoveCandidates(pkItb, pdBandung, semua).map((o) => o.id)
    expect(ids.sort()).toEqual(['pd-bogor', 'pw-jabar'])
  })

  it('menyisakan PDLN lain saja untuk PK di bawah PDLN', () => {
    const ids = filterMoveCandidates(pkKairo, pdlnMesir, semua).map((o) => o.id)
    expect(ids).toEqual(['pdln-turki'])
  })

  it('kosong untuk PD — nol calon, bukan daftar penuh', () => {
    expect(filterMoveCandidates(pdBandung, pwJabar, semua)).toEqual([])
  })

  it('kosong untuk PK di bawah PDLN tunggal — keadaan kosong yang nyata', () => {
    const tanpaTurki = semua.filter((o) => o.id !== 'pdln-turki')
    expect(filterMoveCandidates(pkKairo, pdlnMesir, tanpaTurki)).toEqual([])
  })
})
