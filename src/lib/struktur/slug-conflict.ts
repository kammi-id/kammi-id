/**
 * The partial unique index on `slug` — `WHERE deleted_at IS NULL`, so a slug is
 * unique only among Struktur that are not Terhapus (spec §4.2).
 */
export const SLUG_UNIQUE_INDEX = 'organization_slug_live_unique'

/**
 * Whether a write failed **because the slug was already taken**.
 *
 * Spec §4.3 counts three moments where the index can fire, and two of them are
 * real failures a person has to fix: BPH editing its own slug (§8.1) and
 * restoring a Struktur Terhapus whose slug has since been claimed (§8.4). Both
 * land the message **in the slug field** rather than in a toast, because it is
 * fixable on the spot — two failures with an identical cause are not explained
 * two different ways.
 *
 * The constraint name is checked, not just the SQLSTATE: `code` has its own
 * unique index across every row, and a caller that treated any `23505` as a
 * slug clash would point at the wrong field.
 *
 * Drizzle wraps the error; Bun's `PostgresError` carries SQLSTATE on
 * `cause.errno`, not on `cause.code` as other drivers do.
 */
export const isSlugConflict = (error: unknown): boolean => {
  const cause = (error as { cause?: { errno?: unknown; constraint?: unknown } })
    ?.cause
  return (
    String(cause?.errno) === '23505' && cause?.constraint === SLUG_UNIQUE_INDEX
  )
}
