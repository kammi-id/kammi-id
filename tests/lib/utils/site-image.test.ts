import { describe, it, expect } from 'bun:test'
import { resolveSiteImage } from '~/lib/utils/site-image'

describe('resolveSiteImage', () => {
  it('returns empty string for empty input', async () => {
    expect(await resolveSiteImage('')).toBe('')
  })

  it('returns root-relative paths as-is', async () => {
    expect(await resolveSiteImage('/images/logo.png')).toBe('/images/logo.png')
  })

  it('converts a bare key to proxy URL', async () => {
    expect(await resolveSiteImage('uploads/uuid_photo.jpg')).toBe(
      '/api/images/uploads/uuid_photo.jpg'
    )
  })

  it('converts a bare key without folder to proxy URL', async () => {
    expect(await resolveSiteImage('photo.jpg')).toBe('/api/images/photo.jpg')
  })

  it('returns other external URLs as-is', async () => {
    expect(await resolveSiteImage('https://example.com/image.jpg')).toBe(
      'https://example.com/image.jpg'
    )
  })

  it('converts a legacy full URL to proxy path', async () => {
    const result = await resolveSiteImage(
      'https://assets.kammi.id/kammiid/uploads/uuid.jpg'
    )
    expect(result).toBe('/api/images/uploads/uuid.jpg')
  })
})
