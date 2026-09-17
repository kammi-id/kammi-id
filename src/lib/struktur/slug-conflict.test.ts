import { describe, it, expect } from 'bun:test'
import { isSlugConflict, SLUG_UNIQUE_INDEX } from './slug-conflict'

/**
 * Spec §4.3 makes handling `23505` mandatory at two write paths, and both
 * `catch` branches are only reachable through a real race — so the predicate
 * they hang on is tested here, where the shape of the error can be stated
 * directly instead of being raced for.
 *
 * The shape is not obvious and was got wrong once already: Drizzle wraps the
 * error, and Bun's `PostgresError` carries SQLSTATE on `cause.errno`, not on
 * `cause.code` as other drivers do.
 */
const pgError = (errno: string, constraint: string) => ({
  message: 'duplicate key value violates unique constraint',
  cause: { errno, constraint }
})

describe('isSlugConflict', () => {
  it('mengenali pelanggaran indeks unik slug', () => {
    expect(isSlugConflict(pgError('23505', SLUG_UNIQUE_INDEX))).toBe(true)
  })

  it('menolak `23505` dari constraint lain — `code` punya indeksnya sendiri', () => {
    // Pemanggil yang menganggap tiap 23505 sebagai tabrakan slug akan menaruh
    // galat `code` kembar di field slug, yaitu field yang salah.
    expect(isSlugConflict(pgError('23505', 'organization_code_unique'))).toBe(
      false
    )
  })

  it('menolak SQLSTATE lain pada indeks yang sama', () => {
    expect(isSlugConflict(pgError('23503', SLUG_UNIQUE_INDEX))).toBe(false)
  })

  it('menolak galat yang bentuknya bukan galat basis data sama sekali', () => {
    expect(isSlugConflict(new Error('boom'))).toBe(false)
    expect(isSlugConflict(undefined)).toBe(false)
    expect(isSlugConflict(null)).toBe(false)
    expect(isSlugConflict({ cause: {} })).toBe(false)
  })
})
