import { describe, expect, test } from 'bun:test'
import { redact } from './redact'

describe('redact', () => {
  test('masks top-level keys matching sensitive patterns', () => {
    const input = { username: 'alice', password: 'hunter2', token: 'abc123' }

    expect(redact(input)).toEqual({
      username: 'alice',
      password: '[REDACTED]',
      token: '[REDACTED]'
    })
  })

  test('masks nested sensitive keys recursively', () => {
    const input = {
      user: { name: 'alice', credentials: { secret: 'shh', sessionToken: 'xyz' } }
    }

    expect(redact(input)).toEqual({
      user: {
        name: 'alice',
        credentials: { secret: '[REDACTED]', sessionToken: '[REDACTED]' }
      }
    })
  })

  test('redacts sensitive keys inside arrays of objects', () => {
    const input = [{ password: 'a' }, { name: 'bob' }]

    expect(redact(input)).toEqual([{ password: '[REDACTED]' }, { name: 'bob' }])
  })

  test('masks HTTP credential-bearing header names', () => {
    const input = {
      cookie: 'kammi_id_session=abc',
      authorization: 'Bearer xyz',
      'set-cookie': 'kammi_id_session=abc; HttpOnly',
      'content-type': 'application/json'
    }

    expect(redact(input)).toEqual({
      cookie: '[REDACTED]',
      authorization: '[REDACTED]',
      'set-cookie': '[REDACTED]',
      'content-type': 'application/json'
    })
  })

  test('passes through primitives and non-sensitive values unchanged', () => {
    expect(redact('hello')).toBe('hello')
    expect(redact(42)).toBe(42)
    expect(redact(null)).toBe(null)
    expect(redact(undefined)).toBe(undefined)
  })
})
