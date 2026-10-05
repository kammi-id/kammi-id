import { describe, expect, test } from 'bun:test'
import type { LogRecord } from '@logtape/logtape'
import { textFormatter } from './config'

const buildRecord = (overrides: Partial<LogRecord> = {}): LogRecord => ({
  category: ['app', 'action', 'organization'],
  level: 'info',
  message: ['Organisasi dibuat'],
  rawMessage: 'Organisasi dibuat',
  timestamp: Date.UTC(2026, 5, 8, 15, 30, 0),
  properties: {},
  ...overrides
})

describe('textFormatter', () => {
  test('renders timestamp, level, category and message as plain text', () => {
    const formatted = textFormatter(buildRecord())

    expect(formatted).toContain('INFO')
    expect(formatted).toContain('app·action·organization')
    expect(formatted).toContain('Organisasi dibuat')
  })

  test('contains no ANSI escape sequences (Dokploy renders raw text)', () => {
    const formatted = textFormatter(buildRecord({ level: 'error' }))

    // eslint-disable-next-line no-control-regex
    expect(formatted).not.toMatch(/\x1b\[/)
  })

  test('renders the level distinctly per record', () => {
    const info = textFormatter(buildRecord({ level: 'info' }))
    const error = textFormatter(
      buildRecord({ level: 'error', message: ['Gagal membuat organisasi'] })
    )

    expect(info).toContain('INFO')
    expect(error).toContain('ERROR')
    expect(error).toContain('Gagal membuat organisasi')
  })
})
