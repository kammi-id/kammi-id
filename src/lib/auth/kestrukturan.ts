import { readAccessScope, type AccessScope } from './access-scope'
import {
  isOrgInAccessScope,
  readOrganization,
  type Organization
} from '~/db/query/organization'

/**
 * The shape of the tree, stated on the server.
 *
 * The Tambah form offers the same list, but a form is a suggestion: `type` and
 * `parentId` arrive as posted fields, so the shape has to be enforced where
 * they land rather than where they are chosen.
 *
 * Nothing lists `pp` as a legal child, so PP can never be created through this
 * path at all.
 *
 * This stays alongside the Kewenangan matrix below and is **not** part of it:
 * it guards the shape of the tree, not authority, and that is a different
 * question with a different answer.
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

/** Jenjang — the rung a Struktur occupies in the tree. */
export type StrukturJenjang = Organization['type']

/** The columns of the matrix in spec §2.2. */
export type KestrukturanAction =
  | 'baca'
  | 'buat'
  | 'sunting'
  | 'nonaktifkan'
  | 'aktifkan'
  | 'hapus'
  | 'pulihkan'

/**
 * The actions that address a Struktur that already exists. `baca` has its own
 * gate, `buat` addresses a child that does not exist yet, and `pulihkan`
 * addresses a Terhapus row that no Cakupan walk reaches.
 */
export type StrukturManageAction = Extract<
  KestrukturanAction,
  'sunting' | 'nonaktifkan' | 'aktifkan' | 'hapus'
>

type MatrixRow = Record<KestrukturanAction, readonly StrukturJenjang[]>

const ALL_JENJANG: readonly StrukturJenjang[] = ['pp', 'pw', 'pdln', 'pd', 'pk']
const BELOW_PP: readonly StrukturJenjang[] = ['pw', 'pdln', 'pd', 'pk']
const PK_ONLY: readonly StrukturJenjang[] = ['pk']
const NONE: readonly StrukturJenjang[] = []

/** Root: every cell, every Jenjang. The PP guard below trims two of them. */
const ROOT_ROW: MatrixRow = {
  baca: ALL_JENJANG,
  buat: ALL_JENJANG,
  sunting: ALL_JENJANG,
  nonaktifkan: ALL_JENJANG,
  aktifkan: ALL_JENJANG,
  hapus: ALL_JENJANG,
  pulihkan: ALL_JENJANG
}

/**
 * Reach without authority — the row of a Kewenangan that may open the Struktur
 * surface inside its Cakupan and change nothing there. BPH and BPW PW share it.
 */
const READ_ONLY_ROW: MatrixRow = {
  baca: ALL_JENJANG,
  buat: NONE,
  sunting: NONE,
  nonaktifkan: NONE,
  aktifkan: NONE,
  hapus: NONE,
  pulihkan: NONE
}

/** Nothing at all, `baca` included. BPK, Humas, and Akun Kader share it. */
const NO_AUTHORITY_ROW: MatrixRow = {
  baca: NONE,
  buat: NONE,
  sunting: NONE,
  nonaktifkan: NONE,
  aktifkan: NONE,
  hapus: NONE,
  pulihkan: NONE
}

/**
 * BPW PP reaches every Jenjang beneath PP for every action — deleting a whole
 * PW included. What protects a PW is not Kewenangan but its contents: the
 * deletion prerequisite (spec §3) refuses any PW that has children, Member, or
 * Daurah. Written plainly so the next reader does not mistake it for a hole and
 * "patch" it.
 */
const BPW_PP_ROW: MatrixRow = {
  baca: ALL_JENJANG,
  buat: BELOW_PP,
  sunting: BELOW_PP,
  nonaktifkan: BELOW_PP,
  aktifkan: BELOW_PP,
  hapus: BELOW_PP,
  pulihkan: BELOW_PP
}

/**
 * BPW PD and BPW PDLN hold PK and nothing else, and hold zero `pulihkan` —
 * Struktur Terhapus is addressable by Root and BPW PP only (spec §2.1 rule 3).
 */
const BPW_PD_ROW: MatrixRow = {
  baca: ALL_JENJANG,
  buat: PK_ONLY,
  sunting: PK_ONLY,
  nonaktifkan: PK_ONLY,
  aktifkan: PK_ONLY,
  hapus: PK_ONLY,
  pulihkan: NONE
}

/**
 * Keyed by the Jenjang of the Struktur the BPW Akun is connected to.
 *
 * - `pw` is read-only on purpose, not by oversight: creating a PD is
 *   centralised at BPW PP, and a PK is handled by its PD. PW is skipped, and
 *   that is the only reason the rule is not "everything below you".
 * - `pk` has **no entry**: that Kewenangan is never issued at Jenjang PK
 *   (`src/db/query/organization.ts:148-161` skips it), so a BPW PK that somehow
 *   existed falls through to `NO_AUTHORITY_ROW`.
 */
const BPW_ROWS: Partial<Record<StrukturJenjang, MatrixRow>> = {
  pp: BPW_PP_ROW,
  pw: READ_ONLY_ROW,
  pd: BPW_PD_ROW,
  pdln: BPW_PD_ROW
}

const rowFor = (
  role: string,
  jenjangAkun: StrukturJenjang | null
): MatrixRow => {
  if (role === 'root') return ROOT_ROW

  // BPH holds exactly one manage cell — `sunting` over its **own** Struktur —
  // and that cell turns on identity, not on Jenjang, so it cannot be a cell of
  // a Jenjang table. It lives in `requireOwnStrukturEditAccess` instead. Left
  // read-only here deliberately: a UI that lit an edit control from this row
  // would light it for every Struktur in a BPH's Cakupan.
  if (role === 'bph') return READ_ONLY_ROW

  if (role === 'bpw') {
    if (!jenjangAkun) return NO_AUTHORITY_ROW
    return BPW_ROWS[jenjangAkun] ?? NO_AUTHORITY_ROW
  }

  // BPK, Humas, Akun Kader, and anything unrecognised. Silence means no.
  // Giving Humas a recursive read would undo ADR 0002 through the back door.
  return NO_AUTHORITY_ROW
}

/**
 * The matrix of spec §2.2 itself — **pure, zero database.** The point is not
 * speed: this is the one gate in the repo with enough content to get wrong, and
 * content that size has to be testable as a table of arguments to results with
 * not one fixture. The UI calls this same function, so a control that appears
 * and a request that passes are held to a single source.
 *
 * Each cell is read as a conjunction: it names the Jenjang a caller may act
 * upon, and the privilege holds **only** if the target also sits inside the
 * caller's Cakupan. Cakupan is not an axis here because it never has an
 * exception — the async gates below add it.
 *
 * ## Why the signature in spec §2.5 is widened
 *
 * Spec §2.5 writes `canManageKestrukturan(role, jenjangAkun, jenjangSasaran)`
 * with no action argument, but §2.2/§2.3 demand per-action answers that such a
 * signature cannot state: Root may `sunting` a PP yet may never `nonaktifkan`
 * one, and BPW PD/PDLN hold PK for every action **except** `pulihkan`. The
 * choice was to add the action rather than to quietly drop those cells to fit
 * the signature. All four parameters are disjoint string unions, so swapping
 * two of them is a `tsc` error.
 */
export const canManageKestrukturan = (
  role: string,
  jenjangAkun: StrukturJenjang | null,
  jenjangSasaran: StrukturJenjang,
  action: KestrukturanAction
): boolean => {
  // Jenjang PP can be deactivated by nobody, Root included. The ban is placed
  // on the **target**, not written as an exception on the actor: "the central
  // leadership is not currently running" is not a state that means anything in
  // this organisation. PP has no parent, so the ban is one line.
  if (
    jenjangSasaran === 'pp' &&
    (action === 'nonaktifkan' || action === 'aktifkan')
  ) {
    return false
  }

  return rowFor(role, jenjangAkun)[action].includes(jenjangSasaran)
}

/**
 * One denial message for every refusal that is about authority. Saying only
 * "you may not" keeps the reply from doubling as a map of what exists and who
 * reaches it.
 */
const DENIAL = 'Antum tidak memiliki hak akses atas struktur ini.'

const NO_SESSION = 'Sesi tidak ditemukan.'

const readJenjang = async (
  organizationId: string | null
): Promise<StrukturJenjang | null> => {
  if (!organizationId) return null
  const [org] = await readOrganization({ id: [organizationId] })
  return org?.type ?? null
}

/**
 * Grants the privilege of opening the Struktur surface for one target, and
 * returns the Cakupan the page then reads under — Root, BPH, and BPW, target
 * inside Cakupan. Returns null when the caller does not hold it.
 *
 * Unlike the manage gate, the caller's own Struktur is a legitimate target:
 * reading is "inside Cakupan", not "below it".
 */
export const requireKestrukturanReadAccess = async (
  targetOrgId: string
): Promise<AccessScope | null> => {
  const scope = await readAccessScope()
  if (!scope) return null

  const [target] = await readOrganization({ id: [targetOrgId] })
  if (!target) return null

  const jenjangAkun = await readJenjang(scope.connectedOrganizationId)
  if (!canManageKestrukturan(scope.role, jenjangAkun, target.type, 'baca')) {
    return null
  }

  return (await isOrgInAccessScope(scope, targetOrgId)) ? scope : null
}

/**
 * Grants the privilege of creating a Struktur of `childType` directly beneath
 * `parentId`. Returns a denial message, or null when the caller holds it.
 *
 * Cakupan is checked against the **parent** while the matrix is asked about the
 * **child**: the child does not exist yet, and which Jenjang is allowed to land
 * where is exactly the question. For the same reason the manage gate's "never
 * your own Struktur" rule has nothing to bite on here — a BPW PD creates its
 * PK directly beneath itself, and the Struktur being created is the child.
 */
export const requireKestrukturanCreateAccess = async (
  parentId: string,
  childType: StrukturJenjang
): Promise<string | null> => {
  const scope = await readAccessScope()
  if (!scope) return NO_SESSION

  const [parent] = await readOrganization({ id: [parentId] })
  if (!parent) return 'Struktur induk tidak ditemukan.'

  const jenjangAkun = await readJenjang(scope.connectedOrganizationId)
  if (!canManageKestrukturan(scope.role, jenjangAkun, childType, 'buat')) {
    return DENIAL
  }

  if (!(await isOrgInAccessScope(scope, parentId))) return DENIAL

  if (!isLegalChildType(parent.type, childType)) {
    return `Struktur ${childType.toUpperCase()} tidak dapat berada langsung di bawah ${parent.type.toUpperCase()}.`
  }

  return null
}

/**
 * Grants the privilege of acting on an existing Struktur — editing its
 * identity, deactivating or reactivating it, deleting it. Returns a denial
 * message, or null when the caller holds it.
 *
 * Wraps `readAccessScope` + Cakupan + the pure matrix + the rule that the
 * target is **never the caller's own Struktur**. That last rule needs its own
 * line: `isOrgInAccessScope` counts the caller's own Struktur as a member of
 * its Cakupan (see the `humas` branch at `src/db/query/organization.ts:71-73`,
 * which returns `[connectedOrgId]`), so Cakupan alone would leave a BPW PP —
 * whose Cakupan is the whole country — holding PP itself.
 *
 * The deletion prerequisite (zero children, zero Member, zero Daurah) is **not**
 * here. It is a data invariant, not authority; folding it in would invite the
 * conclusion that a high enough Kewenangan can push through it. It is checked
 * on the delete path, separately and after this gate.
 */
export const requireKestrukturanManageAccess = async (
  targetOrgId: string,
  action: StrukturManageAction
): Promise<string | null> => {
  const scope = await readAccessScope()
  if (!scope) return NO_SESSION

  const [target] = await readOrganization({ id: [targetOrgId] })
  if (!target) return 'Struktur tidak ditemukan.'

  const jenjangAkun = await readJenjang(scope.connectedOrganizationId)
  if (!canManageKestrukturan(scope.role, jenjangAkun, target.type, action)) {
    return DENIAL
  }

  // A BPW manages the Struktur **below** its own and never its own. Root is
  // exempt because its row is not a Cakupan at all: it holds every Struktur,
  // the PP its Akun happens to be connected to included.
  if (scope.role !== 'root' && scope.connectedOrganizationId === targetOrgId) {
    return DENIAL
  }

  if (!(await isOrgInAccessScope(scope, targetOrgId))) return DENIAL

  return null
}

/**
 * Grants BPH the privilege of editing the identity of its **own** Struktur, and
 * returns that Struktur. Returns null when the caller does not hold it.
 *
 * Shaped unlike the gates above on purpose: the target is always the caller's
 * own Struktur, so there is nothing to pass in, and one call serves both the
 * authorization and the page's data — no second read.
 *
 * Only BPH passes. Root does not need this path; it already edits any Struktur
 * through `branches`.
 */
export const requireOwnStrukturEditAccess =
  async (): Promise<Organization | null> => {
    const scope = await readAccessScope()
    if (!scope) return null
    if (scope.role !== 'bph') return null
    if (!scope.connectedOrganizationId) return null

    const [org] = await readOrganization({
      id: [scope.connectedOrganizationId]
    })
    return org ?? null
  }

/**
 * Grants the privilege of restoring a Terhapus Struktur. Returns a denial
 * message, or null when the caller holds it.
 *
 * It stands alone, and it is the easiest one to get wrong. It is **not**
 * `role === 'root'` alone and **not** `role === 'root' || role === 'bpw'`:
 * only Root and a BPW whose connected Struktur is **PP** pass. Copying the
 * `role === 'bpw'` pattern from elsewhere would open restoration to every BPW
 * in the country.
 *
 * The answer is derived from the same matrix rather than restated, so that
 * BPW PD/PDLN's empty `pulihkan` cell cannot drift away from this gate. There
 * is no target argument: a Terhapus row is unreachable by any Cakupan walk, so
 * the question is only ever who may address the recycle bin at all.
 */
export const requireStrukturRestoreAccess = async (): Promise<
  string | null
> => {
  const scope = await readAccessScope()
  if (!scope) return NO_SESSION

  const jenjangAkun = await readJenjang(scope.connectedOrganizationId)
  const holdsRestore = rowFor(scope.role, jenjangAkun).pulihkan.length > 0

  return holdsRestore ? null : DENIAL
}
