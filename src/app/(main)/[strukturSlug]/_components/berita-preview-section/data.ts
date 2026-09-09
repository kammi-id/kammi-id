import { cacheLife, cacheTag } from 'next/cache'
import {
  listLatestBeritaForOrg,
  type BeritaPreviewItem
} from '~/db/query/article'

/**
 * Both templates' "Berita terbaru" section (spec "Template Situs") — 12
 * latest Terbit Berita for one Struktur. Its cache belongs only to that
 * Struktur, so publishing elsewhere cannot evict this surface.
 */
export const getBeritaPreview = async (
  organizationId: string
): Promise<BeritaPreviewItem[]> => {
  'use cache'
  cacheLife('days')
  cacheTag(`article-${organizationId}`)

  try {
    return await listLatestBeritaForOrg(organizationId, 12)
  } catch {
    return []
  }
}
