import { resolveStrukturHost } from '~/lib/struktur/tenant-host'

/**
 * Prefix milik object storage lama. Sebagian baris DB menyimpan URL penuh
 * `https://assets.kammi.id/kammiid/<key>`, dan hanya baris lama itu yang perlu
 * dikupas. Nilainya dibekukan di sini, bukan dirakit dari env S3, supaya
 * pencabutan env tidak membuat cabang ini diam-diam berhenti kena.
 */
export const LEGACY_ASSET_PREFIX = 'https://assets.kammi.id/kammiid/'

/**
 * Resolves a site image value to a stable proxy URL for Next.js Image Optimization.
 * - Root-relative paths (/) are returned as-is.
 * - Legacy full URLs (LEGACY_ASSET_PREFIX + key) are rewritten to the proxy path.
 * - Storage keys are converted to the internal proxy path /api/images/<key>.
 * - Other external URLs are returned as-is (will be unoptimized by next/image).
 */
export const resolveSiteImage = async (path: string): Promise<string> => {
  if (!path) return ''
  if (path.startsWith('/')) return path
  if (path.startsWith(LEGACY_ASSET_PREFIX)) {
    return `/api/images/${path.slice(LEGACY_ASSET_PREFIX.length)}`
  }
  if (path.startsWith('http')) return path
  return `/api/images/${path}`
}

/**
 * Sama seperti `resolveSiteImage`, untuk Galeri (issue 04) — dipakai dua
 * halaman publik (Berita dan Halaman) yang keduanya merender
 * `ImageGalleryGrid`, jadi satu tempat alih-alih `Promise.all(...map(...))`
 * diulang di keduanya.
 */
export const resolveGalleryImages = async (
  paths: string[]
): Promise<string[]> => Promise.all(paths.map((path) => resolveSiteImage(path)))

/**
 * Same as `resolveSiteImage`, but on the Struktur's own absolute host —
 * `https://<slug>.kammi.id/api/images/<key>` rather than the root-relative
 * `/api/images/<key>`. `next/image` accepts a relative `src`, but a `fetch()`
 * (OG image generation, ADR 0006/0007 — satori can't load a remote `<img>`
 * itself, bytes must be fetched by hand) or a `<meta>` tag needs an absolute
 * URL. Mirrors the idiom the Permalink Berita `generateMetadata` already used
 * for its Open Graph image before ticket 04 (og-image kartu bagikan) folded
 * it in here for reuse across every OG image caller.
 */
export const resolveAbsoluteSiteImage = async (
  path: string | null | undefined,
  org: { type: string; slug: string }
): Promise<string | undefined> => {
  if (!path) return undefined
  const resolved = await resolveSiteImage(path)
  if (!resolved) return undefined
  return resolved.startsWith('http')
    ? resolved
    : `https://${resolveStrukturHost(org)}${resolved}`
}
