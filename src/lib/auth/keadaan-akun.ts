import { type UserRole } from '~/lib/access-control'
import { type OrganizationState } from '~/db/query/organization'

/**
 * Whether a Kewenangan dies with the Struktur its Akun is connected to.
 *
 * A `Record` over the whole `UserRole` union rather than a list of the four
 * that die, and that shape is the point: adding a Kewenangan to the enum is a
 * `tsc` error here until someone states which side of the line it falls on.
 * A list would have let a new Kewenangan default to surviving, silently.
 *
 * - **Akun Kader survives** (spec §5.4). Non-Aktif is defined as "keadaan
 *   kepengurusan, bukan keadaan Kader di dalamnya" — deactivating a PD that
 *   locked hundreds of Kader out of their own accounts would make that
 *   sentence false. They are not its officers; they are people registered there.
 * - **Root survives** because the protection it needs lives elsewhere and is
 *   stronger: PP can be deactivated by nobody, Root included
 *   (`canManageKestrukturan`, spec §2.3), and the deletion prerequisite refuses
 *   it in practice. Listing Root here would buy nothing, and would make a PP
 *   that somehow died lock out the one Akun able to undo it.
 */
const DIES_WITH_STRUKTUR: Record<UserRole, boolean> = {
  root: false,
  bph: true,
  bpk: true,
  bpw: true,
  humas: true,
  member: false
}

/**
 * Grants the privilege of holding a session at all — **pure, zero database.**
 *
 * Keadaan Akun is derived, never stored (spec §5.1): an Akun inherits the
 * Keadaan of its Struktur as it is read. Nol kolom baru di `user`, so the bug
 * worth fearing ("someone is logged in to a Struktur that is gone") is
 * impossible by construction rather than guarded by discipline — there is no
 * second number that can drift from the first.
 *
 * The session already carries that Struktur on every request (`withUserCTE`
 * joins it and selects `state`), so asking this at the seam costs no query.
 *
 * `null` means the Struktur could not be read at all: no
 * `connected_organization_id`, or a row that is gone. For a Kewenangan whose
 * entire authority is scoped to a Struktur, that is not a milder case than
 * Terhapus — it is the same one, and it is answered the same way. An
 * unrecognised Kewenangan is answered the same way too: at this seam, silence
 * means no.
 */
export const mayHoldSession = (
  role: UserRole,
  strukturState: OrganizationState | null
): boolean => {
  if (!(DIES_WITH_STRUKTUR[role] ?? true)) return true
  return strukturState === 'aktif'
}
