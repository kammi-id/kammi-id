import { describe, it, expect } from 'bun:test'
import { strukturKemampuan, NO_KEMAMPUAN } from './kemampuan'
import type { StrukturJenjang } from '~/lib/auth/kestrukturan'
import type { OrganizationState } from '~/db/query/organization'

/**
 * Layer 1 of the test shape in spec §9.3, applied to the flags the surfaces
 * render from: **a table of arguments to results, zero fixtures.** If a case
 * here ever needs a database, the purity `canManageKestrukturan` was written
 * for has been lost somewhere upstream.
 */
const actor = (
  role: string,
  jenjangAkun: StrukturJenjang | null,
  connectedOrganizationId: string | null = 'akun-org'
) => ({ role, jenjangAkun, connectedOrganizationId })

const target = (
  type: StrukturJenjang,
  state: OrganizationState = 'aktif',
  id = 'target-org'
) => ({ id, type, state })

describe('strukturKemampuan', () => {
  it('memberi BPW PP seluruh kemampuan atas Struktur di bawah PP', () => {
    expect(strukturKemampuan(actor('bpw', 'pp'), target('pw'))).toEqual({
      sunting: true,
      nonaktifkan: true,
      aktifkan: false,
      hapus: true,
      pindah: true
    })
  })

  it('menolak seluruhnya atas PP — sasarannya di luar jangkauan BPW PP', () => {
    expect(strukturKemampuan(actor('bpw', 'pp'), target('pp'))).toEqual(
      NO_KEMAMPUAN
    )
  })

  it('tidak pernah menawarkan nonaktifkan atas PP, bahkan untuk Root', () => {
    const kemampuan = strukturKemampuan(
      actor('root', 'pp', 'pp-org'),
      target('pp')
    )
    expect(kemampuan.nonaktifkan).toBe(false)
    expect(kemampuan.aktifkan).toBe(false)
    // Larangannya ada di sasaran, bukan pada Root: sunting dan hapus tetap ada.
    expect(kemampuan.sunting).toBe(true)
  })

  it('mengosongkan seluruh bendera untuk Struktur milik pelakunya sendiri', () => {
    expect(
      strukturKemampuan(
        actor('bpw', 'pp', 'org-1'),
        target('pw', 'aktif', 'org-1')
      )
    ).toEqual(NO_KEMAMPUAN)
  })

  it('mengecualikan Root dari aturan "bukan Strukturnya sendiri"', () => {
    const kemampuan = strukturKemampuan(
      actor('root', 'pp', 'org-1'),
      target('pw', 'aktif', 'org-1')
    )
    expect(kemampuan.sunting).toBe(true)
  })

  it('menawarkan nonaktifkan hanya untuk Struktur Aktif, aktifkan hanya untuk Non-Aktif', () => {
    const aktif = strukturKemampuan(actor('bpw', 'pp'), target('pd', 'aktif'))
    const nonAktif = strukturKemampuan(
      actor('bpw', 'pp'),
      target('pd', 'non_aktif')
    )
    expect([aktif.nonaktifkan, aktif.aktifkan]).toEqual([true, false])
    expect([nonAktif.nonaktifkan, nonAktif.aktifkan]).toEqual([false, true])
  })

  it('memberi BPD sunting atas PD dan PK, tanpa satu pun aksi lainnya', () => {
    expect(strukturKemampuan(actor('bpw', 'pw'), target('pd'))).toEqual({
      sunting: true,
      nonaktifkan: false,
      aktifkan: false,
      hapus: false,
      pindah: false
    })
  })

  it('tidak memberi BPD tombol pindah — ia nol `buat`, jadi tombolnya akan selalu ditolak', () => {
    expect(strukturKemampuan(actor('bpw', 'pw'), target('pk')).pindah).toBe(
      false
    )
  })

  it('memberi BPKOM seluruh kemampuan atas PK dan nol atas PD', () => {
    const atasPk = strukturKemampuan(actor('bpw', 'pd'), target('pk'))
    expect(atasPk.sunting).toBe(true)
    expect(atasPk.hapus).toBe(true)
    expect(atasPk.pindah).toBe(true)
    expect(strukturKemampuan(actor('bpw', 'pd'), target('pd'))).toEqual(
      NO_KEMAMPUAN
    )
  })

  it('mengosongkan seluruh bendera untuk BPH, BPK, Humas, dan Akun Kader', () => {
    for (const role of ['bph', 'bpk', 'humas', 'kader']) {
      expect(strukturKemampuan(actor(role, 'pw'), target('pd'))).toEqual(
        NO_KEMAMPUAN
      )
    }
  })

  it('mengosongkan seluruh bendera untuk BPW tanpa Struktur terhubung', () => {
    expect(strukturKemampuan(actor('bpw', null, null), target('pd'))).toEqual(
      NO_KEMAMPUAN
    )
  })
})
