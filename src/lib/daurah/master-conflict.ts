/**
 * The partial unique index on `training_instructors.training_id` — `WHERE
 * role = 'master'`, so a Daurah is unique in its Master of Training only
 * among rows carrying that role (tiket 03).
 */
export const MASTER_UNIQUE_INDEX = 'training_instructors_master_unique'

/**
 * Whether a write to `training_instructors` failed **because the Daurah
 * already had a Master of Training**.
 *
 * `addInstructorAction` checks this ahead of the insert and rejects with a
 * message naming the sitting MoT, so this helper only ever fires on the
 * race it cannot see coming — two requests reading "no master yet"
 * concurrently. The generic catch block that wraps it has no such name to
 * offer, so a race still surfaces as a correct refusal, just a blunter one.
 *
 * The constraint name is checked, not just the SQLSTATE: `(trainingId,
 * memberId)` on the same table can raise `23505` too, and a caller that
 * treated any `23505` here as a master clash would misreport a duplicate
 * membership as a full MoT seat.
 *
 * Drizzle wraps the error; Bun's `PostgresError` carries SQLSTATE on
 * `cause.errno`, not on `cause.code` as other drivers do — same shape as
 * `isSlugConflict` (`src/lib/struktur/slug-conflict.ts`).
 */
export const isMasterConflict = (error: unknown): boolean => {
  const cause = (error as { cause?: { errno?: unknown; constraint?: unknown } })
    ?.cause
  return (
    String(cause?.errno) === '23505' &&
    cause?.constraint === MASTER_UNIQUE_INDEX
  )
}
