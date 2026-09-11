/** Keadaan Kader — the one state a member holds at a time (CONTEXT.md). */
export type KeadaanKader = 'aktif' | 'sanksi' | 'non-aktif' | 'alumni'

/**
 * Alumni "menggantikan Keadaan sebelumnya" — it supersedes Sanksi and
 * Non-Aktif if either flag is still set alongside it. Sanksi is checked next
 * because it is the more consequential state to surface if both linger.
 */
export const deriveKeadaanKader = (member: {
  isAlumn: boolean
  isSuspended: boolean
  isNonActive: boolean
}): KeadaanKader => {
  if (member.isAlumn) return 'alumni'
  if (member.isSuspended) return 'sanksi'
  if (member.isNonActive) return 'non-aktif'
  return 'aktif'
}

export const keadaanKaderLabel: Record<KeadaanKader, string> = {
  aktif: 'Aktif',
  sanksi: 'Sanksi',
  'non-aktif': 'Non-Aktif',
  alumni: 'Alumni'
}
