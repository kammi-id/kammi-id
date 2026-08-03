import { readAccessScope, type AccessScope } from './access-scope'
import { isOrgInAccessScope } from '~/db/query/organization'
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
