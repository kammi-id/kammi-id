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

const MUTATION_DENIAL = 'Antum tidak memiliki hak akses untuk mutasi kader.'
const MUTATION_NO_SESSION = 'Sesi tidak ditemukan.'

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
> => {
  const scope = await readAccessScope()
  if (!scope) return MUTATION_NO_SESSION

  if (scope.role === 'root') return null
  if (scope.role !== 'bpk') return MUTATION_DENIAL

  if (!scope.connectedOrganizationId) return MUTATION_DENIAL
  const [org] = await readOrganization({ id: [scope.connectedOrganizationId] })

  return org?.type === 'pp' ? null : MUTATION_DENIAL
}
