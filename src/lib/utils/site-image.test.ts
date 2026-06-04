// Set dummy S3 env vars before any imports to prevent S3Client init errors
process.env.S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000'
process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'test'
process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'test'
process.env.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'test'
process.env.S3_REGION = process.env.S3_REGION || 'us-east-1'

import { describe, it, expect } from 'bun:test'
import { resolveSiteImage } from './site-image'

describe('resolveSiteImage', () => {
  it('returns empty string for empty input', async () => {
    expect(await resolveSiteImage('')).toBe('')
  })

  it('returns https URLs unchanged', async () => {
    const url = 'https://example.com/image.jpg'
    expect(await resolveSiteImage(url)).toBe(url)
  })

  it('returns http URLs unchanged', async () => {
    const url = 'http://example.com/image.jpg'
    expect(await resolveSiteImage(url)).toBe(url)
  })

  it('returns root-relative paths unchanged', async () => {
    const path = '/images/logo.png'
    expect(await resolveSiteImage(path)).toBe(path)
  })
})
