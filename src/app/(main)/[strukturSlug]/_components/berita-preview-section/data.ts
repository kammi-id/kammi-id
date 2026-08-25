import { cacheLife, cacheTag } from 'next/cache'
import {
  listLatestBeritaForOrg,
  type BeritaPreviewItem
} from '~/db/query/article'

/**
 * Both templates' "Berita terbaru" section (spec "Template Situs") — 12
 * latest Terbit Berita for one Struktur. Tagged with the spec's own
 * per-Struktur convention (`article-<idStruktur>`, spec "Cache") *and* the
 * broad `articles` tag the dashboard's article actions already bust today,
 * so a newly published Berita actually shows up here — the specific tag
 * alone would sit unbusted until whoever wires per-org article cache
 * invalidation (a later ticket) adds the call.
 */
export const getBeritaPreview = async (
  organizationId: string
): Promise<BeritaPreviewItem[]> => {
  'use cache'
  cacheLife('days')
  cacheTag('articles', `article-${organizationId}`)

  try {
    return await listLatestBeritaForOrg(organizationId, 12)
  } catch {
    return []
  }
}
