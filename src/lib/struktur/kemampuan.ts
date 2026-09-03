import {
  canManageKestrukturan,
  type StrukturJenjang
} from '~/lib/auth/kestrukturan'
import { type OrganizationState } from '~/db/query/organization'

/**
 * What one Akun may do to one Struktur — **computed once on the server per row
 * and handed down as flags** (spec §8).
 *
 * The rule it replaces is the leak: `canManage` read `role === 'bpw' || role
 * === 'root'` and only hid the Tambah button, while the Edit pencil and the
 * table's action column were not gated at all. Cards, table columns and sheet
 * items now render affordances from these flags and **never derive them from
 * `role` themselves**, so a control that lights and a request that passes are
 * held to one source.
 *
 * Pure, because `canManageKestrukturan` is: twelve rows on a page cost twelve
 * table lookups and zero queries.
 */
export type StrukturKemampuan = {
  sunting: boolean
  nonaktifkan: boolean
  aktifkan: boolean
  hapus: boolean
  pindah: boolean
}

export const NO_KEMAMPUAN: StrukturKemampuan = {
  sunting: false,
  nonaktifkan: false,
  aktifkan: false,
  hapus: false,
  pindah: false
}

/** The caller, reduced to the three things every cell of the matrix asks for. */
export type StrukturActor = {
  role: string
  /** Jenjang of the Struktur the Akun is connected to, null when it has none. */
  jenjangAkun: StrukturJenjang | null
  connectedOrganizationId: string | null
}

export type StrukturTarget = {
  id: string
  type: StrukturJenjang
  state: OrganizationState
}

/**
 * The flags for one row.
 *
 * Cakupan is **not** an axis here and cannot be: it needs a recursive walk, and
 * this function is pure so it can be called per row. The caller is responsible
 * for only asking about Struktur it has already established are inside the
 * Cakupan — which on `/dashboard/branches` is free, since every row is a child
 * of a Struktur the page's read gate already admitted.
 *
 * Three rules live here rather than in each surface:
 *
 * 1. **Never your own Struktur** — the same line `requireKestrukturanManageAccess`
 *    draws, for the same reason: a BPW PP's Cakupan is the whole country and
 *    would otherwise include PP itself. Root is exempt; its row is not a Cakupan.
 * 2. **Keadaan decides which direction is offered**, not who may act. Only an
 *    Aktif Struktur can be deactivated and only a Non-Aktif one reactivated —
 *    the matrix answers both identically, so this is a surface question.
 * 3. **`pindah` is the conjunction `requireStrukturMoveAccess` computes**:
 *    `sunting` over the Struktur being moved, plus the right to place a
 *    Struktur of that Jenjang beneath a destination (`buat`). A BPD holds
 *    `sunting` over PD and PK and zero `buat`, so it gets no move button rather
 *    than one that is always refused.
 */
export const strukturKemampuan = (
  actor: StrukturActor,
  target: StrukturTarget
): StrukturKemampuan => {
  if (actor.role !== 'root' && actor.connectedOrganizationId === target.id) {
    return NO_KEMAMPUAN
  }

  const may = (action: Parameters<typeof canManageKestrukturan>[3]) =>
    canManageKestrukturan(actor.role, actor.jenjangAkun, target.type, action)

  const sunting = may('sunting')

  return {
    sunting,
    nonaktifkan: may('nonaktifkan') && target.state === 'aktif',
    aktifkan: may('aktifkan') && target.state === 'non_aktif',
    hapus: may('hapus'),
    pindah: sunting && may('buat')
  }
}
