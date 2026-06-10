import { describe, it, expect, beforeAll } from 'bun:test'
import type { resolveSiteImage as ResolveSiteImage } from '~/lib/utils/site-image'

let resolveSiteImage: typeof ResolveSiteImage

beforeAll(async () => {
  process.env.S3_ENDPOINT = 'https://assets.kammi.id'
  process.env.S3_BUCKET_NAME = 'kammiid'
  ;({ resolveSiteImage } = await import('~/lib/utils/site-image'))
})

describe('resolveSiteImage', () => {
  it('returns empty string for empty input', async () => {
    expect(await resolveSiteImage('')).toBe('')
  })

  it('returns root-relative paths as-is', async () => {
    expect(await resolveSiteImage('/images/logo.png')).toBe('/images/logo.png')
  })

  it('converts S3 key to proxy URL', async () => {
    expect(await resolveSiteImage('uploads/uuid_photo.jpg')).toBe(
      '/api/images/uploads/uuid_photo.jpg'
    )
  })

  it('converts S3 key without folder to proxy URL', async () => {
    expect(await resolveSiteImage('photo.jpg')).toBe('/api/images/photo.jpg')
  })

  it('returns other external URLs as-is', async () => {
    expect(await resolveSiteImage('https://example.com/image.jpg')).toBe(
      'https://example.com/image.jpg'
    )
  })

  it('converts full path-style S3 URL to proxy path', async () => {
    const result = await resolveSiteImage(
      'https://assets.kammi.id/kammiid/uploads/uuid.jpg'
    )
    expect(result).toBe('/api/images/uploads/uuid.jpg')
  })
})
