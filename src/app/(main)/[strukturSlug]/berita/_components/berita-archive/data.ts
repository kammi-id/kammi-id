import { cacheLife, cacheTag } from 'next/cache'
import { listBeritaArsipForOrg, type BeritaArsipPage } from '~/db/query/article'

/**
 * `/berita` full archive (ticket 07, spec "Template Situs") — one page of
 * one Struktur's Berita, newest first, 48 per page.
 *
 * Shares the exact per-Struktur tag used by `berita-preview-section`, so one
 * publish invalidation refreshes both without affecting another Situs.
 */
export const getBeritaArsip = async (
  organizationId: string,
  page: number
): Promise<BeritaArsipPage> => {
  'use cache'
  cacheLife('days')
  cacheTag(`article-${organizationId}`)

  try {
    return await listBeritaArsipForOrg(organizationId, page)
  } catch {
    return { items: [], totalCount: 0, totalPages: 0 }
  }
}
