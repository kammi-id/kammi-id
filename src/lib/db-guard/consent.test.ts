import { describe, it, expect } from 'bun:test'
import { decideConsent } from './consent'

const LOCAL = 'postgresql://postgres:postgres@localhost:5432/kammi_test'
const REMOTE = 'postgresql://postgres:pw@103.93.160.47:5432/kammi-id'

const decide = (over: Partial<Parameters<typeof decideConsent>[0]> = {}) =>
  decideConsent({
    databaseUrl: REMOTE,
    acknowledgement: undefined,
    interactive: true,
    ...over
  })

describe('decideConsent', () => {
  it('lets a local database through without asking', () => {
    expect(decide({ databaseUrl: LOCAL })).toEqual({
      kind: 'allow',
      reason: 'local'
    })
  })

  it('lets a local database through even with no TTY to ask on', () => {
    expect(decide({ databaseUrl: LOCAL, interactive: false })).toEqual({
      kind: 'allow',
      reason: 'local'
    })
  })

  it('asks before touching a remote database', () => {
    expect(decide()).toEqual({
      kind: 'prompt',
      host: '103.93.160.47',
      database: 'kammi-id'
    })
  })

  it('takes an up-front acknowledgement in place of the prompt', () => {
    expect(decide({ acknowledgement: '1' })).toEqual({
      kind: 'allow',
      reason: 'acknowledged'
    })
  })

  it.each([
    ['empty', ''],
    ['whitespace', '  ']
  ])('ignores an acknowledgement that is %s', (_label, ack) => {
    expect(decide({ acknowledgement: ack }).kind).toBe('prompt')
  })

  it('refuses rather than hangs when there is no TTY to ask on', () => {
    expect(decide({ interactive: false })).toEqual({
      kind: 'refuse',
      reason: 'no-tty'
    })
  })

  it('honours an acknowledgement without a TTY, so runners have a way in', () => {
    expect(decide({ interactive: false, acknowledgement: '1' })).toEqual({
      kind: 'allow',
      reason: 'acknowledged'
    })
  })

  it.each([
    ['missing', undefined],
    ['unparseable', 'not-a-url']
  ])('refuses a %s URL rather than assuming it is safe', (_label, url) => {
    expect(decide({ databaseUrl: url })).toEqual({
      kind: 'refuse',
      reason: 'unreadable-url'
    })
  })

  it('refuses a remote URL with no database name to type back', () => {
    expect(decide({ databaseUrl: 'postgresql://103.93.160.47:5432' })).toEqual({
      kind: 'refuse',
      reason: 'no-database-name'
    })
  })

  it('blames the missing database name, not the missing TTY', () => {
    expect(
      decide({
        databaseUrl: 'postgresql://103.93.160.47:5432',
        interactive: false
      })
    ).toEqual({ kind: 'refuse', reason: 'no-database-name' })
  })

  it('still lets an acknowledgement past a URL with no database name', () => {
    expect(
      decide({
        databaseUrl: 'postgresql://103.93.160.47:5432',
        acknowledgement: '1'
      })
    ).toEqual({ kind: 'allow', reason: 'acknowledged' })
  })
})
