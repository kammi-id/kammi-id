import { type StrukturJenjang } from '~/lib/auth/kestrukturan'
import { type OrganizationState } from '~/db/query/organization'

/**
 * The domain word for what sits directly beneath a Jenjang (CONTEXT.md).
 *
 * Refusals name what is actually in the way — "3 Komisariat", not "3 Struktur"
 * — because the surface (spec §8.2, §8.3) writes them as whole sentences a
 * person reads, not as tooltips. PK has nothing beneath it, so it falls back to
 * the generic word rather than pretending otherwise.
 */
export const describeChildJenjang = (parentType: StrukturJenjang): string =>
  ({
    pp: 'Wilayah',
    pw: 'Daerah',
    pd: 'Komisariat',
    pdln: 'Komisariat',
    pk: 'Struktur'
  })[parentType]

/** The columns a Keadaan verdict needs of a child — enough to name it. */
export type ChildRef = { id: string; name: string }

export type DeactivationRefusal =
  | { reason: 'pp'; message: string }
  | { reason: 'anak-aktif'; message: string; activeChildren: ChildRef[] }

export type ReactivationRefusal = { reason: 'induk-mati'; message: string }

export type DeletionCounts = {
  children: number
  members: number
  trainings: number
}

export type DeletionRefusal = {
  reason: 'prasyarat'
  message: string
  counts: DeletionCounts
}

/**
 * Whether a Struktur may be deactivated. Returns a refusal, or null.
 *
 * Two prerequisites, checked **after** the Kewenangan gate, never inside it:
 *
 * 1. **The target is not PP.** Jenjang PP can be deactivated by nobody, Root
 *    included. The ban sits on the **target** rather than as an exception on
 *    the actor, because the reason is not to protect the `root` Akun — it is
 *    that "the central leadership is not currently running" is not a state that
 *    means anything in this organisation.
 * 2. **Zero children still Aktif.** Children already Non-Aktif may be left
 *    where they are (spec §6.4). What that costs is stated plainly elsewhere:
 *    the induk then cannot be deleted while they remain (spec §3).
 *
 * The refusal carries the children themselves, not a boolean, because the
 * surface has to offer the way out — "Pindahkan semua Komisariat Aktif ke PW"
 * plus a route to moving them one at a time (spec §8.2). A refusal that only
 * says no makes the surface guess.
 */
export const checkDeactivation = (
  org: { type: StrukturJenjang },
  activeChildren: readonly ChildRef[]
): DeactivationRefusal | null => {
  if (org.type === 'pp') {
    return {
      reason: 'pp',
      message: 'Kepengurusan pusat tidak dapat dinonaktifkan.'
    }
  }

  if (activeChildren.length > 0) {
    const noun = describeChildJenjang(org.type)
    return {
      reason: 'anak-aktif',
      message:
        `Masih ada ${activeChildren.length} ${noun} yang aktif di bawahnya. ` +
        `Pindahkan atau nonaktifkan ${noun.toLowerCase()} itu lebih dulu.`,
      activeChildren: [...activeChildren]
    }
  }

  return null
}

/**
 * Whether a Struktur may be brought back to Aktif. Returns a refusal, or null.
 *
 * **The exact mirror of deactivation** (spec §6.4): deactivating an induk
 * demands its living children leave first; reviving a child demands its induk
 * live first. One rule, two directions, nothing to memorise separately.
 *
 * `parent` arriving as `null` while `parentId` is set is not a missing case —
 * it is the Terhapus case. The read layer filters Terhapus (spec §7), so a
 * deleted induk reaches here as absence rather than as a row with a state, and
 * both are refused by the same line. The message never says the induk was
 * deleted: that sentence would leak that the row is there (spec §1.4).
 */
export const checkReactivation = (
  org: { parentId: string | null },
  parent: { id: string; state: OrganizationState } | null
): ReactivationRefusal | null => {
  if (org.parentId === null) return null
  if (parent !== null && parent.state === 'aktif') return null

  return {
    reason: 'induk-mati',
    message:
      'Induknya sedang tidak aktif, jadi Struktur ini belum bisa diaktifkan. ' +
      'Aktifkan induknya lebih dulu, atau pindahkan Struktur ini ke induk yang aktif.'
  }
}

/** "5 Kader, 1 Daurah dan 2 Daerah" — commas, then one `dan`. */
const joinClauses = (clauses: string[]): string =>
  clauses.length <= 1
    ? (clauses[0] ?? '')
    : `${clauses.slice(0, -1).join(', ')} dan ${clauses[clauses.length - 1]}`

/**
 * Whether a Struktur may be deleted. Returns a refusal, or null.
 *
 * The prerequisite reads in full: **nol Struktur anak, nol Member, nol Daurah**
 * (spec §3). Three clauses that are easy to lose while assembling, so all three
 * are stated here rather than spread across their call sites:
 *
 * 1. **Children that are Non-Aktif COUNT.** An induk with a Non-Aktif child
 *    cannot be deleted while that child exists. That is fine — deletion is for
 *    a record entered in error, and a Struktur with descendants was not entered
 *    in error (spec §1.3).
 * 2. **Children that are Terhapus DO NOT count.** Terhapus is treated as though
 *    the row had never been there, so it may not hold anything up. The price is
 *    paid knowingly: a Terhapus-beneath-Terhapus chain becomes possible, and
 *    spec §8.4 is the surface that handles it. This function never has to know
 *    — the count it is handed comes from the read layer, which has already
 *    dropped Terhapus.
 * 3. **Publikasi is NOT a prerequisite.** Artikel, Kategori Artikel and
 *    Pengaturan Situs may dangle. Only the three above hold a deletion.
 *
 * **It applies to everyone, Root included.** Cakupan limits reach; the
 * prerequisite keeps the data consistent, and Root passes through the first and
 * never the second. This is deliberately not part of any gate — folding it in
 * would invite the reading that a high enough Kewenangan can push through it.
 *
 * The refusal carries counts rather than a boolean so the surface can write
 * "Tidak bisa dihapus: masih ada 847 Kader dan 3 Komisariat" as a whole
 * sentence (spec §8.2).
 */
export const checkDeletion = (
  org: { type: StrukturJenjang },
  counts: DeletionCounts
): DeletionRefusal | null => {
  const clauses = [
    counts.members > 0 ? `${counts.members} Kader` : null,
    counts.trainings > 0 ? `${counts.trainings} Daurah` : null,
    counts.children > 0
      ? `${counts.children} ${describeChildJenjang(org.type)}`
      : null
  ].filter((clause): clause is string => clause !== null)

  if (clauses.length === 0) return null

  return {
    reason: 'prasyarat',
    message: `Tidak bisa dihapus: masih ada ${joinClauses(clauses)}.`,
    counts
  }
}

export type RestoreRefusal =
  | { reason: 'induk-non-aktif'; message: string }
  | {
      reason: 'induk-terhapus'
      message: string
      /** Named and linkable: it is a row on the very same surface. */
      parent: { id: string; name: string }
    }

/**
 * Whether a Struktur Terhapus may be restored. Returns a refusal, or null.
 *
 * **The mirror rule applies in full** (spec §6.4), because restoring always ends
 * at Aktif — so a Struktur may not come back beneath an induk that is not alive.
 *
 * Unlike `checkReactivation`, this one is handed the Terhapus induk explicitly
 * and **says so**. The two cases differ in what the person has to do next, and a
 * refusal that does not distinguish them sends someone hunting:
 *
 * - **induk Non-Aktif** — the way out is elsewhere: activate the induk, or move
 *   this Struktur to one that is alive.
 * - **induk juga Terhapus** — the way out is *on this very page*, so the induk
 *   is named and its row linked. That is not a leak of the kind spec §1.4
 *   forbids: the only callers hold `pulihkan`, and the whole page they are
 *   looking at is Struktur Terhapus.
 *
 * The second case is real rather than theoretical: a Terhapus child does not
 * count toward its induk's deletion prerequisite (spec §3), so a
 * Terhapus-beneath-Terhapus chain is reachable by ordinary use.
 */
export const checkRestore = (
  org: { parentId: string | null },
  liveParent: { state: OrganizationState } | null,
  deletedParent: { id: string; name: string } | null
): RestoreRefusal | null => {
  if (org.parentId === null) return null
  if (liveParent !== null && liveParent.state === 'aktif') return null

  if (deletedParent) {
    return {
      reason: 'induk-terhapus',
      message:
        `Induknya, ${deletedParent.name}, juga terhapus. ` +
        `Pulihkan ${deletedParent.name} lebih dulu — pemulihan berjalan dari atas ke bawah.`,
      parent: deletedParent
    }
  }

  return {
    reason: 'induk-non-aktif',
    message:
      'Induknya sedang tidak aktif, jadi Struktur ini belum bisa dipulihkan. ' +
      'Aktifkan induknya lebih dulu, atau pindahkan Struktur ini ke induk yang aktif.'
  }
}
