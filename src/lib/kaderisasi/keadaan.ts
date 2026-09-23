/**
 * The counts behind Lapis 3 (ADR 0021): every table that holds a plain
 * (NO ACTION) reference to `member.id`. `user.connected_member_id` is
 * deliberately absent — it is `ON DELETE CASCADE`, so it never blocks and
 * never needs counting here.
 */
export type MemberHardDeletionCounts = {
  trainingAttendant: number
  trainingInstructor: number
  academic: number
  career: number
  organizationHistory: number
  mutation: number
}

export type MemberHardDeletionRefusal = {
  reason: 'prasyarat'
  message: string
  counts: MemberHardDeletionCounts
}

/** "5 riwayat Daurah, 1 riwayat akademik dan 2 riwayat mutasi" — commas, then one `dan`. */
const joinClauses = (clauses: string[]): string =>
  clauses.length <= 1
    ? (clauses[0] ?? '')
    : `${clauses.slice(0, -1).join(', ')} dan ${clauses[clauses.length - 1]}`

/**
 * Whether a Kader Terhapus may be erased dari basis data sungguhan. Returns a
 * refusal, or null. Lihat ADR 0021.
 *
 * **Garis pemisahnya:** Kader yang punya riwayat bukan salah input — ia orang
 * sungguhan yang berhenti, dan itu soft delete. Hapus Selamanya hanya untuk
 * baris yang belum sempat mengumpulkan apa pun, jadi satu baris riwayat mana
 * pun di salah satu dari keenam tabel di bawah sudah cukup untuk menolak.
 *
 * Menolak **dengan pesan**, bukan ikut menghapus riwayatnya — mengulang
 * pembersihan diam-diam yang membuat cascade lama dicabut (ADR 0004) adalah
 * persis kesalahan yang tidak boleh terulang di sini.
 */
export const checkHardDeletionMember = (
  counts: MemberHardDeletionCounts
): MemberHardDeletionRefusal | null => {
  const clauses = [
    counts.trainingAttendant > 0
      ? `${counts.trainingAttendant} riwayat Daurah sebagai peserta`
      : null,
    counts.trainingInstructor > 0
      ? `${counts.trainingInstructor} riwayat Daurah sebagai instruktur`
      : null,
    counts.academic > 0 ? `${counts.academic} riwayat akademik` : null,
    counts.career > 0 ? `${counts.career} riwayat karier` : null,
    counts.organizationHistory > 0
      ? `${counts.organizationHistory} riwayat organisasi`
      : null,
    counts.mutation > 0 ? `${counts.mutation} riwayat mutasi` : null
  ].filter((clause): clause is string => clause !== null)

  if (clauses.length === 0) return null

  return {
    reason: 'prasyarat',
    message: `Tidak bisa dihapus selamanya: masih ada ${joinClauses(clauses)}.`,
    counts
  }
}
