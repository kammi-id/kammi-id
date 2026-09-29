import { isLegalChildType, type StrukturJenjang } from '~/lib/auth/kestrukturan'
import type { OrganizationState } from '~/db/query/organization'
import { resolveRegisterNumberCodes } from '~/lib/utils/member'

/**
 * The columns a move verdict needs, and nothing else: `code` because the whole
 * rule is derived from it, `type` because the tree has a shape, `state` because
 * a dead Struktur cannot receive, and `id` because "already there" and "itself"
 * are identity questions.
 */
export type StrukturRef = {
  id: string
  type: StrukturJenjang
  code: string
  state: OrganizationState
}

const ALREADY_THERE = 'Struktur ini sudah berada di bawah induk tersebut.'

const ITSELF = 'Sebuah Struktur tidak dapat menjadi induk dirinya sendiri.'

/**
 * A Struktur Terhapus is answered exactly as a slug that never existed is
 * (spec §1.4). No refusal may say "this one was deleted" — the sentence itself
 * leaks that the row is there.
 */
const NOT_FOUND = 'Struktur induk tidak ditemukan.'

/**
 * A Struktur Non-Aktif is refused as a destination, and this is the narrower of
 * the two grounds: the mirror rule (spec §6.4) means whatever is parked beneath
 * a dead induk cannot be brought back to life until it is moved again, so
 * accepting one is accepting a dead end.
 */
const DEAD_END =
  'Struktur induk tujuan sedang Non-Aktif, jadi ia tidak dapat menerima Struktur lain.'

/**
 * Every refusal that is about the Nomor Induk gets this one sentence. It names
 * the consequence rather than the mechanism: `pwCode` means nothing to whoever
 * is reading, and "Nomor Induk Kader berubah" is the thing they can weigh.
 */
const CHANGES_NIA =
  'Pemindahan ke Struktur ini akan mengubah Nomor Induk Kader yang didaftarkan sesudahnya.'

const cannotHost = (candidate: StrukturRef, org: StrukturRef) =>
  `Struktur ${org.type.toUpperCase()} tidak dapat berada langsung di bawah ${candidate.type.toUpperCase()}.`

/**
 * Whether `candidate` may hold `org` at all, tree-shape-wise.
 *
 * Two clauses, and the second is the whole of *penitipan*. A Komisariat may go
 * to a sibling Daerah — that is `isLegalChildType` outright. It may **also** be
 * parked one rung up, directly beneath the Struktur that holds its current
 * induk, which is how a Daerah that is winding down can be emptied today and
 * its Komisariat placed properly later.
 *
 * That second clause is why this is not `isLegalChildType` alone: PK beneath PW
 * is not a shape anyone may *create* (spec §8.2 keeps creation centralised),
 * but it is a shape a move may *reach*. The rule stays one line for every
 * Jenjang because "one rung up" is stated through the same table rather than
 * enumerated per case.
 */
const mayHost = (
  candidate: StrukturRef,
  org: StrukturRef,
  currentParent: StrukturRef | null
): boolean =>
  isLegalChildType(candidate.type, org.type) ||
  (currentParent !== null &&
    isLegalChildType(candidate.type, currentParent.type))

/**
 * Whether `candidate` is a legal new induk for `org`. Returns a denial message,
 * or null when the move is allowed.
 *
 * **The `pwCode` rule is "hasil penurunan NIA tidak boleh berubah" — not "dalam
 * PW yang sama"** (spec §6.2). The old wording was a proxy that leaked twice:
 * it is undefined for a PK beneath PDLN, which has no PW at all (`pwCode` 99),
 * and it waved through PDLN → PW, which is exactly the permanent lie that spec
 * §6.3 refuses when it bans a PD from crossing PW.
 *
 * **It takes two rules, not one.** Spec §6.3 claims `pwCode` alone already
 * refuses a PD's move "tanpa aturan khusus"; it refuses a PD across PW, but a
 * PD offered a sibling PD in its own PW passes `pwCode` untouched — both read
 * `01` — and so does a PK offered a sibling PK. Shape is what refuses those,
 * and it is the same table that governs creation.
 *
 * This limits **which Struktur may receive**, never **who may move it** — the
 * Kewenangan question is `requireStrukturMoveAccess` and has zero overlap.
 *
 * The order below is chosen for the *message*, not the outcome: a candidate
 * that fails two tests is refused either way, and what changes is whether the
 * sentence it gets back is true.
 */
export const checkMoveCandidate = (
  org: StrukturRef,
  currentParent: StrukturRef | null,
  candidate: StrukturRef
): string | null => {
  if (candidate.id === org.id) return ITSELF
  if (candidate.id === currentParent?.id) return ALREADY_THERE

  if (candidate.state === 'terhapus') return NOT_FOUND
  if (candidate.state === 'non_aktif') return DEAD_END

  // Derived through the same function that issues the real Nomor Induk, so the
  // rule cannot drift from what the numbering actually does. A PK asks its
  // induk; everything else answers from its own code (spec §6.6).
  //
  // The candidate is asked with a null induk on purpose. It is not having a
  // number derived *for* it — the question is which PW it names — and with no
  // induk to consult that is what every Jenjang answers. Going through the one
  // decision rather than reaching past it to `resolveOrgCodes` is the rule
  // ticket 24 installed after the branch had already been copied once.
  const current = resolveRegisterNumberCodes(org, currentParent)
  const after = resolveRegisterNumberCodes(candidate, null)

  // A **known** disagreement outranks shape: a PK beneath PDLN offered a PW
  // fails both, and only one of them can explain itself. "PK tidak dapat berada
  // di bawah PW" is a sentence the penitipan clause makes false; "Nomor Induk
  // berubah" is the actual reason and stays true.
  if (current && after && current.pwCode !== after.pwCode) return CHANGES_NIA

  if (!mayHost(candidate, org, currentParent)) return cannotHost(candidate, org)

  // Codes that cannot be read at all land here rather than above, so a shape
  // that is plainly wrong is named as a shape. What is left — PP offered to a
  // PK beneath PDLN, say — really is a Nomor Induk that cannot be derived.
  if (!current || !after) return CHANGES_NIA

  return null
}

/**
 * The candidates a move surface may offer. The empty list is a real answer, not
 * a failure: a PK beneath the only PDLN there is has nowhere to go that keeps
 * its Kader's Nomor Induk honest (spec §8.2).
 */
export const filterMoveCandidates = <T extends StrukturRef>(
  org: StrukturRef,
  currentParent: StrukturRef | null,
  candidates: readonly T[]
): T[] =>
  candidates.filter(
    (candidate) => checkMoveCandidate(org, currentParent, candidate) === null
  )
