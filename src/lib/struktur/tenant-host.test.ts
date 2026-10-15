import { describe, expect, it } from 'bun:test'
import { resolveTenantHost, resolveStrukturHost } from './tenant-host'

describe('resolveTenantHost', () => {
  it('reads www.kammi.id as apex (PP canonical host, ADR 0018)', () => {
    expect(resolveTenantHost('www.kammi.id')).toEqual({ kind: 'apex' })
  })

  it('reads a <slug>.kammi.id host as that Struktur subdomain', () => {
    expect(resolveTenantHost('pw-jabar.kammi.id')).toEqual({
      kind: 'subdomain',
      slug: 'pw-jabar'
    })
  })

  it('is case-insensitive', () => {
    expect(resolveTenantHost('PW-JABAR.KAMMI.ID')).toEqual({
      kind: 'subdomain',
      slug: 'pw-jabar'
    })
  })

  it('redirects the bare apex to www.kammi.id', () => {
    expect(resolveTenantHost('kammi.id')).toEqual({
      kind: 'redirect-to-www'
    })
  })

  it('reads the staging deployment host as apex, not the slug "staging"', () => {
    expect(resolveTenantHost('staging.kammi.id')).toEqual({ kind: 'apex' })
  })

  it('reads the production candidate host as apex, not the slug "candidate"', () => {
    expect(resolveTenantHost('candidate.production.kammi.id')).toEqual({
      kind: 'apex'
    })
  })

  it('reads localhost as apex for local dev', () => {
    expect(resolveTenantHost('localhost')).toEqual({ kind: 'apex' })
  })

  it('falls back to apex for a host that is not a kammi.id subdomain', () => {
    expect(resolveTenantHost('203.0.113.10')).toEqual({ kind: 'apex' })
  })

  it('does not mistake a lookalike domain for a kammi.id subdomain', () => {
    expect(resolveTenantHost('notkammi.id')).toEqual({ kind: 'apex' })
    expect(resolveTenantHost('kammi.id.evil.example')).toEqual({
      kind: 'apex'
    })
  })
})

describe('resolveStrukturHost', () => {
  it('resolves a non-PP Struktur to its <slug>.kammi.id subdomain', () => {
    expect(resolveStrukturHost({ type: 'pw', slug: 'pw-jabar' })).toBe(
      'pw-jabar.kammi.id'
    )
  })

  it('resolves PP to www.kammi.id, not the apex or "pp.kammi.id"', () => {
    expect(resolveStrukturHost({ type: 'pp', slug: 'pp' })).toBe('www.kammi.id')
  })
})
