import { describe, it, expect } from 'bun:test'
import { interpretApplicationStatus } from './status'

describe('interpretApplicationStatus', () => {
  it.each([
    ['done', false, 'success'],
    ['done', true, 'success'],
    ['error', false, 'failure'],
    ['error', true, 'failure'],
    ['idle', false, 'running'],
    ['running', false, 'running'],
    ['idle', true, 'timeout'],
    ['running', true, 'timeout']
  ] as const)(
    'maps status=%s timedOut=%s to %s',
    (status, timedOut, expected) => {
      expect(interpretApplicationStatus(status, timedOut)).toBe(expected)
    }
  )

  it.each([
    ['an unfamiliar status', 'building'],
    ['an empty string', ''],
    ['a differently-cased known value', 'DONE']
  ])('treats %s as failure rather than staying silent', (_label, status) => {
    expect(interpretApplicationStatus(status, false)).toBe('failure')
  })

  it('treats an unfamiliar status as failure even past the deadline', () => {
    expect(interpretApplicationStatus('building', true)).toBe('failure')
  })
})
