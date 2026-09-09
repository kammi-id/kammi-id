import { describe, it, expect } from 'bun:test'
import {
  isJenisDaurahDiizinkan,
  jenisDaurahUntukJenjang
} from './matriks-jenis-daurah'

describe('matriks jenis Daurah × Jenjang (ADR 0025)', () => {
  it('allows every jenis for PP', () => {
    expect(jenisDaurahUntukJenjang('pp')).toEqual([
      'dm1',
      'dm2',
      'dm3',
      'dpmk',
      'tfi',
      'other'
    ])
  })

  it('allows every jenis for PW', () => {
    expect(jenisDaurahUntukJenjang('pw')).toEqual([
      'dm1',
      'dm2',
      'dm3',
      'dpmk',
      'tfi',
      'other'
    ])
  })

  it.each(['pd', 'pdln'] as const)(
    'forbids DM3 for %s but allows the rest',
    (jenjang) => {
      expect(isJenisDaurahDiizinkan(jenjang, 'dm3')).toBe(false)
      expect(isJenisDaurahDiizinkan(jenjang, 'dm1')).toBe(true)
      expect(isJenisDaurahDiizinkan(jenjang, 'dm2')).toBe(true)
      expect(isJenisDaurahDiizinkan(jenjang, 'dpmk')).toBe(true)
      expect(isJenisDaurahDiizinkan(jenjang, 'tfi')).toBe(true)
      expect(isJenisDaurahDiizinkan(jenjang, 'other')).toBe(true)
    }
  )

  it('allows only DM1 and Lainnya for PK', () => {
    expect(jenisDaurahUntukJenjang('pk')).toEqual(['dm1', 'other'])
    expect(isJenisDaurahDiizinkan('pk', 'dm2')).toBe(false)
    expect(isJenisDaurahDiizinkan('pk', 'dm3')).toBe(false)
    expect(isJenisDaurahDiizinkan('pk', 'dpmk')).toBe(false)
    expect(isJenisDaurahDiizinkan('pk', 'tfi')).toBe(false)
  })

  it('treats an unknown Jenjang as allowing nothing', () => {
    expect(jenisDaurahUntukJenjang('unknown')).toEqual([])
    expect(isJenisDaurahDiizinkan('unknown', 'dm1')).toBe(false)
  })
})
