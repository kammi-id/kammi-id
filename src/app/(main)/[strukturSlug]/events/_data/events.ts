import { cacheLife, cacheTag } from 'next/cache'
import { listEventsForOrg, type EventListKind } from '~/db/query/event'

export const getEvents = async (
  organizationId: string,
  kind: EventListKind = 'upcoming',
  page = 1,
  limit = 24
) => {
  'use cache'
  // Schedule boundaries also invalidate visibility without an editor saving.
  cacheLife({ stale: 0, revalidate: 1, expire: 2 })
  cacheTag(`article-${organizationId}`, `struktur-${organizationId}`)
  return listEventsForOrg(organizationId, kind, page, limit)
}
