import { readAccessScope, type AccessScope } from './access-scope'
import { isOrgInAccessScope, readOrganization } from '~/db/query/organization'
import { type UserRole } from '~/lib/access-control'

const kekaderanRoles: string[] = ['root', 'bph', 'bpk'] satisfies UserRole[]

/**
 * Resolves the Cakupan of an Akun allowed to *read* Kekaderan data for one
 * Struktur, or null when that Struktur lies outside its reach. Reading is
 * held by Root, by BPH (memantau) and by BPK (mengelola).
 *
 * This answers reach, and only reach. Which of those Kewenangan a given page
 * admits at all remains that page's own `AccessGuard` to state — `perangkat`
 * admits fewer than `kader` does today.
 *
 * Pages that take a Struktur slug from the URL must run this before they say
 * anything about that Struktur, its name included.
 *
 * Deliberately not `isOrgInScope`: that one demands BPK because it guards a
 * write path, and would lock out BPH, whose whole Kewenangan is to watch.
 */
export const requireKekaderanAccess = async (
  organizationId: string
): Promise<AccessScope | null> => {
  const scope = await readAccessScope()
  if (!scope) return null
  if (!kekaderanRoles.includes(scope.role)) return null

  const inScope = await isOrgInAccessScope(scope, organizationId)
  return inScope ? scope : null
}

const NO_SESSION = 'Sesi tidak ditemukan.'

/**
 * The privilege one rung above every Cakupan: Root, or a BPK whose Struktur
 * is PP. Shared by `requireMemberMutationAccess` and
 * `requireMemberHardDeleteAccess` — both are actions ADR 0020/0021 place
 * above every Cakupan rather than inside one, for their own separate
 * reasons, and the role+Jenjang test that answers "does the caller sit
 * there" is one test, not two.
 */
const requireNationalBpkAccess = async (
  denialMessage: string
): Promise<string | null> => {
  const scope = await readAccessScope()
  if (!scope) return NO_SESSION

  if (scope.role === 'root') return null
  if (scope.role !== 'bpk') return denialMessage

  if (!scope.connectedOrganizationId) return denialMessage
  const [org] = await readOrganization({ id: [scope.connectedOrganizationId] })

  return org?.type === 'pp' ? null : denialMessage
}

const MUTATION_DENIAL = 'Antum tidak memiliki hak akses untuk mutasi kader.'

/**
 * Grants the privilege of mutating a Kader — moving `member.organization_id`
 * across a Cakupan boundary (ADR 0020). Returns a denial message, or null
 * when the caller holds it.
 *
 * **Root and BPK PP only** — not `role === 'bpk'` alone, and not composed
 * from `requireKekaderanAccess`'s Cakupan walk: mutasi crosses a Cakupan
 * boundary by definition, so no BPK standing inside one Cakupan can ever be
 * the right answer here, PP included in the general case. The reason is
 * spelled out in ADR 0020 §4: mutasi moves a Kader out from under the very
 * BPK who requested it, on the destination side as much as the origin, so
 * the privilege has to sit above every Cakupan rather than inside one.
 *
 * There is deliberately no target-organization argument, matching
 * `requireStrukturRestoreAccess` (`src/lib/auth/kestrukturan.ts`): the
 * question is only ever who may open the Mutasi surface at all, not whether
 * one particular org is in reach — the surface itself picks both ends.
 */
export const requireMemberMutationAccess = async (): Promise<
  string | null
> => requireNationalBpkAccess(MUTATION_DENIAL)

const HARD_DELETE_DENIAL =
  'Antum tidak memiliki hak akses untuk menghapus Kader selamanya.'

/**
 * Grants the privilege of Hapus Selamanya atas satu Kader Terhapus (ADR
 * 0021). Returns a denial message, or null when the caller holds it.
 *
 * **Root and BPK PP only**, same shape as `requireMemberMutationAccess` but
 * for an unrelated reason: mutasi is barred from every Cakupan because it
 * crosses one, while Hapus Selamanya is barred from every Cakupan because a
 * BPK PD's Kewenangan already ends at soft delete (Lapis 1) and restore
 * (Lapis 2) — the two are decentralised on purpose (ADR 0021), and stop
 * there. Erasing a row for good is a narrower privilege than either, held
 * by fewer hands than the tong sampah itself is visible to.
 *
 * No target-organization argument, for the same reason
 * `requireMemberMutationAccess` has none: the question is only ever who may
 * press this button at all.
 */
export const requireMemberHardDeleteAccess = async (): Promise<
  string | null
> => requireNationalBpkAccess(HARD_DELETE_DENIAL)

/**
 * Grants the privilege of opening `/dashboard/kader/terhapus` and restoring
 * what is there — Root and BPK, **inside their own Cakupan** (ADR 0021).
 *
 * Unlike Struktur Terhapus (`requireStrukturRestoreAccess`, centralised
 * because Struktur creation/deletion always was), Kader deletion is
 * decentralised — a BPK PD deletes its own Kader today, so it recovers its
 * own mistakes too, without an escalation to PP. `readDeletedMembers`
 * intersects with the caller's Cakupan on its own; this gate only decides
 * who may reach the surface at all. BPH is deliberately excluded even
 * though it reads ordinary Kekaderan data — this surface restores, and BPH
 * holds no write privilege anywhere in Kekaderan.
 */
export const requireMemberTrashAccess = async (): Promise<AccessScope | null> => {
  const scope = await readAccessScope()
  if (!scope) return null
  if (!['root', 'bpk'].includes(scope.role)) return null
  return scope
}
