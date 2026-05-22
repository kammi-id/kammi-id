import { storage } from '~/lib/api/storage'

/**
 * Resolves a site image value to a usable URL.
 * - Full URLs (http/https) and root-relative paths (/) are returned as-is.
 * - S3 keys get a 24-hour presigned URL.
 */
export const resolveSiteImage = async (path: string): Promise<string> => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path
  }
  try {
    return await storage.client.file(path).presign({ expiresIn: 86400 })
  } catch {
    return ''
  }
}
