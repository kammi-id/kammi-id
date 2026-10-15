import { describe, it, expect } from 'bun:test'
import { classifyDatabaseUrl } from './database-url'

describe('classifyDatabaseUrl', () => {
  it('reads host and database name out of a connection string', () => {
    expect(
      classifyDatabaseUrl('postgresql://user:pw@db.example.com:5432/kammi-id')
    ).toEqual({
      host: 'db.example.com',
      database: 'kammi-id',
      isLocal: false
    })
  })

  it.each([
    ['localhost', 'postgresql://user:pw@localhost:5432/kammi'],
    ['127.0.0.1', 'postgresql://user:pw@127.0.0.1:5432/kammi'],
    ['[::1]', 'postgresql://user:pw@[::1]:5432/kammi'],
    ['host.docker.internal', 'postgresql://user:pw@host.docker.internal/kammi']
  ])('treats %s as local', (_label, url) => {
    expect(classifyDatabaseUrl(url)?.isLocal).toBe(true)
  })

  it('strips the brackets an IPv6 host is written with', () => {
    expect(classifyDatabaseUrl('postgresql://[::1]:5432/kammi')?.host).toBe(
      '::1'
    )
  })

  it('matches a local host case-insensitively', () => {
    expect(
      classifyDatabaseUrl('postgresql://LOCALHOST:5432/kammi')?.isLocal
    ).toBe(true)
  })

  it.each([
    ['a remote IP', 'postgresql://user:pw@103.93.160.47:5432/postgres'],
    ['a compose service name', 'postgresql://user:pw@db:5432/kammi'],
    [
      'a host merely spelled like localhost',
      'postgresql://localhost.evil.com/k'
    ]
  ])('treats %s as remote', (_label, url) => {
    expect(classifyDatabaseUrl(url)?.isLocal).toBe(false)
  })

  it('reports no database name when the URL carries no path', () => {
    expect(classifyDatabaseUrl('postgresql://localhost:5432')?.database).toBe(
      ''
    )
  })

  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['whitespace', '   '],
    ['unparseable', 'not-a-url'],
    ['hostless', 'postgresql:///kammi']
  ])('returns null for %s input', (_label, url) => {
    expect(classifyDatabaseUrl(url)).toBeNull()
  })
})
