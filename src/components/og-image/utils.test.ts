import { describe, expect, test } from 'bun:test'
import {
  buildStrukturMetaLine,
  resolveOgImageMode,
  resolveTitleFontSize,
  truncateTitle,
  TITLE_FONT_SIZE_DEFAULT,
  TITLE_FONT_SIZE_LONG,
  TITLE_LONG_THRESHOLD
} from './utils'

describe('resolveOgImageMode', () => {
  test('picks bergambar when image bytes are present', () => {
    expect(resolveOgImageMode(new ArrayBuffer(8))).toBe('bergambar')
  })

  test('picks tanpa-gambar when bytes are undefined (no imageUrl, or fetch failed)', () => {
    expect(resolveOgImageMode(undefined)).toBe('tanpa-gambar')
  })
})

describe('resolveTitleFontSize', () => {
  test('one-word title stays at the default size', () => {
    expect(resolveTitleFontSize('Kongres')).toBe(TITLE_FONT_SIZE_DEFAULT)
  })

  test('title exactly at the threshold stays at the default size', () => {
    const title = 'a'.repeat(TITLE_LONG_THRESHOLD)
    expect(resolveTitleFontSize(title)).toBe(TITLE_FONT_SIZE_DEFAULT)
  })

  test('title one character past the threshold drops to the long size', () => {
    const title = 'a'.repeat(TITLE_LONG_THRESHOLD + 1)
    expect(resolveTitleFontSize(title)).toBe(TITLE_FONT_SIZE_LONG)
  })

  test('a 140-character title drops to the long size', () => {
    const title = 'a'.repeat(140)
    expect(resolveTitleFontSize(title)).toBe(TITLE_FONT_SIZE_LONG)
  })
})

describe('truncateTitle', () => {
  test('a one-word title passes through unchanged', () => {
    expect(truncateTitle('Kongres')).toBe('Kongres')
  })

  test('a title within budget for its tier passes through unchanged', () => {
    const title = 'a'.repeat(72)
    expect(truncateTitle(title)).toBe(title)
  })

  test('a 140-character title is cut and ellipsized, never left whole', () => {
    const title = 'a'.repeat(140)
    const result = truncateTitle(title)
    expect(result.length).toBeLessThan(title.length)
    expect(result.endsWith('…')).toBe(true)
  })

  test('truncation never produces a string longer than the long tier budget', () => {
    // Long enough to select the "long" font-size tier (> threshold chars).
    const title = 'a'.repeat(TITLE_LONG_THRESHOLD + 200)
    expect(truncateTitle(title).length).toBeLessThanOrEqual(120)
  })

  test('a title at the tier threshold is never truncated (fits within budget by construction)', () => {
    // `TITLE_LONG_THRESHOLD` (60) is chosen below `TITLE_MAX_CHARS_DEFAULT`
    // (72) deliberately — a title short enough to stay in the "default"
    // font-size tier is, by that same length, always short enough to skip
    // truncation entirely.
    const title = 'a'.repeat(TITLE_LONG_THRESHOLD)
    expect(truncateTitle(title)).toBe(title)
  })
})

describe('buildStrukturMetaLine', () => {
  test('struktur name alone when there is no published date', () => {
    expect(buildStrukturMetaLine('KAMMI Kota Bandung', undefined)).toBe(
      'KAMMI Kota Bandung'
    )
  })

  test('struktur name joined with the published date when present', () => {
    expect(
      buildStrukturMetaLine('KAMMI Kota Bandung', '3 September 2026')
    ).toBe('KAMMI Kota Bandung · 3 September 2026')
  })
})
