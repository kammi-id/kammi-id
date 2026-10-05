import { describe, expect, it } from 'bun:test'
import { hasCustomOgImage } from './site-image'

describe('hasCustomOgImage', () => {
  it('treats empty and missing values as unset', () => {
    expect(hasCustomOgImage('')).toBe(false)
    expect(hasCustomOgImage(null)).toBe(false)
    expect(hasCustomOgImage(undefined)).toBe(false)
  })

  it('treats the legacy dead default as unset', () => {
    expect(hasCustomOgImage('/assets/logo.png')).toBe(false)
  })

  it('accepts a real image URL', () => {
    expect(hasCustomOgImage('https://cdn.example.com/og.png')).toBe(true)
    expect(hasCustomOgImage('/api/images/og.png')).toBe(true)
  })
})
