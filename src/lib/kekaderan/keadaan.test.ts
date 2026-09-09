import { describe, it, expect } from 'bun:test'
import {
  checkHardDeletionMember,
  type MemberHardDeletionCounts
} from './keadaan'

const zeroCounts: MemberHardDeletionCounts = {
  trainingAttendant: 0,
  trainingInstructor: 0,
  academic: 0,
  career: 0,
  organizationHistory: 0,
  mutation: 0
}

describe('checkHardDeletionMember', () => {
  it('allows hard deletion when every count is zero', () => {
    expect(checkHardDeletionMember(zeroCounts)).toBeNull()
  })

  it('refuses when the Kader has attended a Daurah', () => {
    const refusal = checkHardDeletionMember({
      ...zeroCounts,
      trainingAttendant: 3
    })

    expect(refusal?.reason).toBe('prasyarat')
    expect(refusal?.message).toBe(
      'Tidak bisa dihapus selamanya: masih ada 3 riwayat Daurah sebagai peserta.'
    )
  })

  it('refuses when the Kader has instructed a Daurah', () => {
    const refusal = checkHardDeletionMember({
      ...zeroCounts,
      trainingInstructor: 1
    })

    expect(refusal?.message).toBe(
      'Tidak bisa dihapus selamanya: masih ada 1 riwayat Daurah sebagai instruktur.'
    )
  })

  it('refuses when the Kader carries academic history', () => {
    const refusal = checkHardDeletionMember({ ...zeroCounts, academic: 2 })

    expect(refusal?.message).toBe(
      'Tidak bisa dihapus selamanya: masih ada 2 riwayat akademik.'
    )
  })

  it('refuses when the Kader carries career history', () => {
    const refusal = checkHardDeletionMember({ ...zeroCounts, career: 1 })

    expect(refusal?.message).toBe(
      'Tidak bisa dihapus selamanya: masih ada 1 riwayat karier.'
    )
  })

  it('refuses when the Kader carries organization history', () => {
    const refusal = checkHardDeletionMember({
      ...zeroCounts,
      organizationHistory: 4
    })

    expect(refusal?.message).toBe(
      'Tidak bisa dihapus selamanya: masih ada 4 riwayat organisasi.'
    )
  })

  it('refuses when the Kader has a mutation record', () => {
    const refusal = checkHardDeletionMember({ ...zeroCounts, mutation: 1 })

    expect(refusal?.message).toBe(
      'Tidak bisa dihapus selamanya: masih ada 1 riwayat mutasi.'
    )
  })

  it('joins multiple blockers with commas and a trailing dan', () => {
    const refusal = checkHardDeletionMember({
      trainingAttendant: 2,
      trainingInstructor: 0,
      academic: 1,
      career: 0,
      organizationHistory: 0,
      mutation: 1
    })

    expect(refusal?.message).toBe(
      'Tidak bisa dihapus selamanya: masih ada 2 riwayat Daurah sebagai peserta, 1 riwayat akademik dan 1 riwayat mutasi.'
    )
  })

  it('carries the raw counts back for the caller to reuse', () => {
    const counts: MemberHardDeletionCounts = {
      ...zeroCounts,
      trainingAttendant: 5
    }
    const refusal = checkHardDeletionMember(counts)

    expect(refusal?.counts).toEqual(counts)
  })
})
