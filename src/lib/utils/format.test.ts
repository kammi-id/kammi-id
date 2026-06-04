import { describe, it, expect } from 'bun:test'
import { fmt } from './format'

describe('fmt', () => {
  it('formats integer with Indonesian locale (dot as thousands separator)', () => {
    expect(fmt(1000)).toBe('1.000')
    expect(fmt(1000000)).toBe('1.000.000')
  })

  it('formats zero', () => {
    expect(fmt(0)).toBe('0')
  })

  it('formats small numbers without separator', () => {
    expect(fmt(42)).toBe('42')
    expect(fmt(999)).toBe('999')
  })

  it('formats large numbers correctly', () => {
    expect(fmt(1234567)).toBe('1.234.567')
  })
})
