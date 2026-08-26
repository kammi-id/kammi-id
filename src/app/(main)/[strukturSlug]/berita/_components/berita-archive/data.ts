import { cacheLife, cacheTag } from 'next/cache'
import { listBeritaArsipForOrg, type BeritaArsipPage } from '~/db/query/article'

/**
 * `/berita` full archive (ticket 07, spec "Template Situs") — one page of
 * one Struktur's Berita, newest first, 48 per page.
 *
 * Tagged with the same per-Struktur convention `berita-preview-section`
 * already uses (`article-<idStruktur>`) plus the broad `articles` tag the
 * dashboard's article actions currently bust on every publish — same
 * documented tradeoff as that section: the specific tag alone would sit
 * unbusted until a later ticket wires per-org article cache invalidation
 * through `updateTag`. Reusing the exact same specific tag string (rather
 * than inventing a second one for the archive) means that future wiring
 * busts both surfaces with a single call per Struktur.
 */
export const getBeritaArsip = async (
  organizationId: string,
  page: number
): Promise<BeritaArsipPage> => {
  'use cache'
  cacheLife('days')
  cacheTag('articles', `article-${organizationId}`)

  try {
    return await listBeritaArsipForOrg(organizationId, page)
  } catch {
    return { items: [], totalCount: 0, totalPages: 0 }
  }
}
