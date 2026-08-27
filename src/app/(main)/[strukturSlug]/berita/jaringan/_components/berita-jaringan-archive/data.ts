import { cacheLife, cacheTag } from 'next/cache'
import { listBeritaJaringan, type BeritaJaringanPage } from '~/db/query/article'

/**
 * `/berita/jaringan` full archive (ticket 08, spec "Template Situs") — one
 * page of Berita across every Struktur, newest first, 48 per page.
 *
 * Tagged `berita-jaringan` (same tag `berita-jaringan-section/data.ts` uses)
 * plus the broad `articles` tag — see that file's comment for the full
 * reasoning; this is its paginated-archive counterpart, same as
 * `berita-archive/data.ts` is to `berita-preview-section/data.ts`.
 */
export const getBeritaJaringan = async (
  page: number
): Promise<BeritaJaringanPage> => {
  'use cache'
  cacheLife('days')
  cacheTag('articles', 'berita-jaringan')

  try {
    return await listBeritaJaringan(page)
  } catch {
    return { items: [], totalCount: 0, totalPages: 0 }
  }
}
