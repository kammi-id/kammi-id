import { readAccessScope } from './access-scope'
import { isOrgInAccessScope, readOrganization } from '~/db/query/organization'

/**
 * The shape of the tree, stated on the server.
 *
 * The Tambah form offers the same list, but a form is a suggestion: `type` and
 * `parentId` arrive as posted fields, so the shape has to be enforced where
 * they land rather than where they are chosen.
 *
 * Nothing lists `pp` as a legal child, so PP can never be created through this
 * path at all.
 */
const CHILD_TYPES: Record<string, readonly string[]> = {
  pp: ['pw', 'pdln'],
  pw: ['pd'],
  pd: ['pk'],
  pdln: ['pk'],
  pk: []
}

export const isLegalChildType = (
  parentType: string,
  childType: string
): boolean => CHILD_TYPES[parentType]?.includes(childType) ?? false

/**
 * One denial message for every refusal that is about authority. Saying only
 * "you may not" keeps the reply from doubling as a map of what exists and who
 * reaches it.
 */
const DENIAL = 'Antum tidak memiliki hak akses atas struktur ini.'

/**
 * Grants the privilege of creating a Struktur of `childType` directly beneath
 * `parentId`. Returns an error message, or null when the caller holds it.
 *
 * Cakupan is checked against the **parent**, not the child — the child does not
 * exist yet, and where it is allowed to land is exactly the question.
 */
export const requireCreateStrukturAccess = async (
  parentId: string,
  childType: string
): Promise<string | null> => {
  const scope = await readAccessScope()
  if (!scope) return 'Sesi tidak ditemukan.'
  if (scope.role !== 'bpw' && scope.role !== 'root') return DENIAL

  if (!(await isOrgInAccessScope(scope, parentId))) return DENIAL

  const [parent] = await readOrganization({ id: [parentId] })
  if (!parent) return 'Struktur induk tidak ditemukan.'

  if (!isLegalChildType(parent.type, childType)) {
    return `Struktur ${childType.toUpperCase()} tidak dapat berada langsung di bawah ${parent.type.toUpperCase()}.`
  }

  return null
}

/**
 * Grants the privilege of editing the identity of an existing Struktur.
 *
 * A BPW manages the Struktur **below** its own and never its own (`CONTEXT.md`,
 * Kewenangan). That exclusion is not a nicety: a BPW PP's Cakupan is the whole
 * country, so without it Cakupan alone would still leave PP editable by a
 * Kewenangan that must not reach it.
 */
export const requireEditStrukturAccess = async (
  targetId: string
): Promise<string | null> => {
  const scope = await readAccessScope()
  if (!scope) return 'Sesi tidak ditemukan.'
  if (scope.role !== 'bpw' && scope.role !== 'root') return DENIAL

  if (scope.role === 'bpw' && scope.connectedOrganizationId === targetId) {
    return DENIAL
  }

  if (!(await isOrgInAccessScope(scope, targetId))) return DENIAL

  return null
}
