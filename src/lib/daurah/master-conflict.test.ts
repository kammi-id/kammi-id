import { describe, it, expect } from 'bun:test'
import { isMasterConflict, MASTER_UNIQUE_INDEX } from './master-conflict'

/**
 * `addInstructorAction` already rejects a second MoT with a named message
 * before it ever inserts, so the `23505` branch this predicate feeds is only
 * reachable through a genuine race — same reasoning as `isSlugConflict`
 * (`src/lib/struktur/slug-conflict.test.ts`), and the same reason the error
 * shape is stated directly here instead of being raced for.
 */
const pgError = (errno: string, constraint: string) => ({
  message: 'duplicate key value violates unique constraint',
  cause: { errno, constraint }
})

describe('isMasterConflict', () => {
  it('mengenali pelanggaran indeks unik Master of Training', () => {
    expect(isMasterConflict(pgError('23505', MASTER_UNIQUE_INDEX))).toBe(true)
  })

  it('menolak `23505` dari constraint lain — `(trainingId, memberId)` punya perannya sendiri', () => {
    // Pemanggil yang menganggap tiap 23505 di tabel ini sebagai kursi MoT
    // penuh akan salah melaporkan keanggotaan ganda sebagai perebutan MoT.
    expect(
      isMasterConflict(
        pgError('23505', 'training_instructors_training_id_member_id_pk')
      )
    ).toBe(false)
  })

  it('menolak SQLSTATE lain pada indeks yang sama', () => {
    expect(isMasterConflict(pgError('23503', MASTER_UNIQUE_INDEX))).toBe(
      false
    )
  })

  it('menolak galat yang bentuknya bukan galat basis data sama sekali', () => {
    expect(isMasterConflict(new Error('boom'))).toBe(false)
    expect(isMasterConflict(undefined)).toBe(false)
    expect(isMasterConflict(null)).toBe(false)
    expect(isMasterConflict({ cause: {} })).toBe(false)
  })
})
