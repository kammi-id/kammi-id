/**
 * Resolves a site image value to a stable proxy URL for Next.js Image Optimization.
 * - Root-relative paths (/) are returned as-is.
 * - Full path-style S3 URLs (https://endpoint/bucket/key) are rewritten to the proxy path.
 * - S3 keys are converted to the internal proxy path /api/images/<key>.
 * - Other external URLs are returned as-is (will be unoptimized by next/image).
 */
export const resolveSiteImage = async (path: string): Promise<string> => {
  if (!path) return ''
  if (path.startsWith('/')) return path
  // Strip both endpoint and bucket name for path-style S3 URLs
  const S3_ENDPOINT = process.env.S3_ENDPOINT || ''
  const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || ''
  const s3PathPrefix = `${S3_ENDPOINT}/${S3_BUCKET_NAME}/`
  if (S3_ENDPOINT && S3_BUCKET_NAME && path.startsWith(s3PathPrefix)) {
    return `/api/images/${path.slice(s3PathPrefix.length)}`
  }
  if (path.startsWith('http')) return path
  return `/api/images/${path}`
}
