import { readActiveSession, type SessionUser } from './cookies'
import { readAccessScope } from './access-scope'
import { isOrgInAccessScope } from '~/db/query/organization'

export type DaurahAccess =
  | { allowed: true; user: SessionUser }
  | { allowed: false; message: string }

const NO_SESSION = 'Sesi tidak ditemukan.'
const NOT_ALLOWED = 'Antum tidak memiliki hak akses untuk menambah daurah.'

/**
 * Resolves the caller allowed to hold a Daurah **for one specific
 * Struktur** — and, in the same breath, to browse the national pool of
 * certified Instruktur while filling that Daurah's form.
 *
 * `organizationId` comes from a hidden form field the client controls, so it
 * is a required argument here (AGENTS.md: Cakupan is never optional):
 * omitting it is a `tsc` error, not a silent leak. The predecessor of this
 * gate checked only role, never Cakupan — a BPK scoped to one PK could name
 * another Struktur's id and be accepted.
 *
 * Privilege is `root` or `bpk`, and a BPK's reach is bounded by its Cakupan —
 * its own Struktur or any descendant, per `isOrgInAccessScope`
 * (`db/query/organization.ts`). `root` bypasses that bound entirely, same as
 * `isOrgInAccessScope` already does on its own.
 */
export const requireDaurahAccess = async (
  organizationId: string
): Promise<DaurahAccess> => {
  const session = await readActiveSession()
  if (!session?.user) return { allowed: false, message: NO_SESSION }

  const { user } = session
  if (user.role !== 'root' && user.role !== 'bpk')
    return { allowed: false, message: NOT_ALLOWED }

  const scope = await readAccessScope()
  if (!scope) return { allowed: false, message: NO_SESSION }

  const inScope = await isOrgInAccessScope(scope, organizationId)
  if (!inScope) return { allowed: false, message: NOT_ALLOWED }

  return { allowed: true, user }
}
