import { describe, it, expect } from 'bun:test'
import {
  hasRequiredRole,
  hasMinimumLevel,
  isHumas,
  type UserRole,
  type OrgLevel
} from './access-control'

describe('hasRequiredRole', () => {
  it('root always has access regardless of allowedRoles', () => {
    expect(hasRequiredRole('root', [])).toBe(true)
    expect(hasRequiredRole('root', ['bph'])).toBe(true)
    expect(hasRequiredRole('root', ['member'])).toBe(true)
  })

  it('returns true when role is in allowedRoles', () => {
    expect(hasRequiredRole('bph', ['bph', 'bpw'])).toBe(true)
    expect(hasRequiredRole('bpw', ['bpw'])).toBe(true)
    expect(hasRequiredRole('member', ['member', 'humas'])).toBe(true)
  })

  it('returns false when role is not in allowedRoles', () => {
    expect(hasRequiredRole('bph', ['bpw'])).toBe(false)
    expect(hasRequiredRole('member', ['bph', 'bpk', 'bpw'])).toBe(false)
    expect(hasRequiredRole('humas', ['member'])).toBe(false)
  })

  it('returns false for empty allowedRoles (non-root)', () => {
    expect(hasRequiredRole('bph', [])).toBe(false)
    expect(hasRequiredRole('member', [])).toBe(false)
  })
})

describe('hasMinimumLevel', () => {
  it('returns true when userLevel equals minLevel', () => {
    expect(hasMinimumLevel(1, 1)).toBe(true)
    expect(hasMinimumLevel(4, 4)).toBe(true)
  })

  it('returns true when userLevel is higher in hierarchy (lower number)', () => {
    expect(hasMinimumLevel(1, 2)).toBe(true)
    expect(hasMinimumLevel(1, 4)).toBe(true)
    expect(hasMinimumLevel(2, 3)).toBe(true)
  })

  it('returns false when userLevel is lower in hierarchy (higher number)', () => {
    expect(hasMinimumLevel(4, 3)).toBe(false)
    expect(hasMinimumLevel(3, 2)).toBe(false)
    expect(hasMinimumLevel(4, 1)).toBe(false)
  })
})

describe('isHumas', () => {
  it('returns true for humas role', () => {
    expect(isHumas('humas')).toBe(true)
  })

  it('returns true for root role', () => {
    expect(isHumas('root')).toBe(true)
  })

  it('returns false for all other roles', () => {
    const nonHumasRoles: UserRole[] = ['bph', 'bpk', 'bpw', 'member']
    for (const role of nonHumasRoles) {
      expect(isHumas(role)).toBe(false)
    }
  })
})
