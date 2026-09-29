import { cacheLife, cacheTag } from 'next/cache'
import { listBeritaJaringan, type BeritaJaringanPage } from '~/db/query/article'

/**
 * `/berita/seindonesia` full archive (ticket 08, spec "Template Situs") — one
 * page of Berita across every Struktur, newest first, 48 per page.
 *
 * Shares `berita-jaringan` with its homepage counterpart, so a mutation in
 * one Struktur refreshes the network archive without evicting every Situs.
 */
export const getBeritaJaringan = async (
  page: number
): Promise<BeritaJaringanPage> => {
  'use cache'
  cacheLife('days')
  cacheTag('berita-jaringan')

  try {
    return await listBeritaJaringan(page)
  } catch {
    return { items: [], totalCount: 0, totalPages: 0 }
  }
}
