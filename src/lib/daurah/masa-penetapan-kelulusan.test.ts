import { describe, it, expect } from 'bun:test'
import { masaPenetapanKelulusan } from './masa-penetapan-kelulusan'

const daysAgo = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const daysFromNow = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

describe('masaPenetapanKelulusan', () => {
  const now = new Date()

  it('is closed while the daurah is still running', () => {
    const masa = masaPenetapanKelulusan({
      endDate: daysFromNow(3),
      role: 'bpk',
      now
    })

    expect(masa.terbuka).toBe(false)
    expect(masa.terbuka === false && masa.alasan).toBe('belum-selesai')
    expect(masa.batasAkhir).toBeNull()
  })

  it('is open within 30 days after the daurah ends', () => {
    const masa = masaPenetapanKelulusan({
      endDate: daysAgo(5),
      role: 'bpk',
      now
    })

    expect(masa.terbuka).toBe(true)
    expect(masa.batasAkhir).not.toBeNull()
  })

  it('is open on exactly the 30th day after the daurah ends', () => {
    const masa = masaPenetapanKelulusan({
      endDate: daysAgo(30),
      role: 'bpk',
      now
    })

    expect(masa.terbuka).toBe(true)
  })

  it('is closed on the 31st day after the daurah ends', () => {
    const masa = masaPenetapanKelulusan({
      endDate: daysAgo(31),
      role: 'bpk',
      now
    })

    expect(masa.terbuka).toBe(false)
    expect(masa.terbuka === false && masa.alasan).toBe('terlampaui')
  })

  it('reports no batasAkhir once the masa has been overrun', () => {
    const masa = masaPenetapanKelulusan({
      endDate: daysAgo(90),
      role: 'bpk',
      now
    })

    expect(masa.terbuka).toBe(false)
    expect(masa.batasAkhir).toBeNull()
  })

  it('is open for root while the daurah is still running', () => {
    const masa = masaPenetapanKelulusan({
      endDate: daysFromNow(3),
      role: 'root',
      now
    })

    expect(masa.terbuka).toBe(true)
  })

  it('is open for root more than 30 days after the daurah ends', () => {
    const masa = masaPenetapanKelulusan({
      endDate: daysAgo(31),
      role: 'root',
      now
    })

    expect(masa.terbuka).toBe(true)
  })

  it('places batasAkhir 30 days after the daurah ends', () => {
    const endDate = daysAgo(5)
    const masa = masaPenetapanKelulusan({ endDate, role: 'bpk', now })

    const expected = new Date(
      new Date(endDate).getTime() + 30 * 24 * 60 * 60 * 1000
    )
    expect(masa.batasAkhir?.getTime()).toBe(expected.getTime())
  })

  it('reads the masa against the given now, not the wall clock', () => {
    const masa = masaPenetapanKelulusan({
      endDate: '2026-01-01',
      role: 'bpk',
      now: new Date('2026-06-01T09:00:00')
    })

    expect(masa.terbuka).toBe(false)
    expect(masa.terbuka === false && masa.alasan).toBe('terlampaui')
  })
})
