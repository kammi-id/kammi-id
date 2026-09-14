import {
  and,
  asc,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  lte,
  sql
} from 'drizzle-orm'
import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { organization } from '~/db/schema/organization.sql'
import { organizationNotDeleted } from './organization'
import { terbitCutoffForQuery } from '~/lib/publikasi/tanggal-terbit'

export type EventListKind = 'upcoming' | 'past' | 'cancelled'
export const EVENT_PAGE_SIZE = 24

export const listEventsForOrg = async (
  organizationId: string,
  kind: EventListKind = 'upcoming',
  page = 1,
  limit = EVENT_PAGE_SIZE
) => {
  const effectiveEnd = sql`coalesce(${article.eventEndsAt}, (((${article.eventStartsAt} at time zone ${article.eventTimezone})::date + 1)::timestamp at time zone ${article.eventTimezone}))`
  const rows = await db
    .select({
      id: article.id,
      title: article.title,
      slug: article.slug,
      featuredImage: article.featuredImage,
      eventStartsAt: article.eventStartsAt,
      eventEndsAt: article.eventEndsAt,
      eventTimezone: article.eventTimezone,
      eventLocation: article.eventLocation,
      eventCancelled: article.eventCancelled,
      totalCount: sql<number>`count(*) over()`.mapWith(Number)
    })
    .from(article)
    .innerJoin(organization, eq(article.organizationId, organization.id))
    .where(
      and(
        eq(article.organizationId, organizationId),
        eq(article.type, 'event'),
        eq(article.status, 'published'),
        lte(article.publishedAt, terbitCutoffForQuery()),
        isNotNull(article.eventStartsAt),
        isNotNull(article.eventTimezone),
        isNull(organization.deletedAt),
        eq(organization.isNonActive, false),
        eq(organization.isSiteActive, true),
        eq(article.eventCancelled, kind === 'cancelled'),
        kind === 'cancelled'
          ? undefined
          : kind === 'upcoming'
            ? gt(effectiveEnd, sql`now()`)
            : lte(effectiveEnd, sql`now()`)
      )
    )
    .orderBy(
      kind === 'past'
        ? desc(article.eventStartsAt)
        : asc(article.eventStartsAt),
      asc(article.id)
    )
    .limit(limit)
    .offset((Math.max(1, page) - 1) * limit)
  return { items: rows, total: rows[0]?.totalCount ?? 0 }
}

export const getEventBySlug = async (organizationId: string, slug: string) => {
  const [row] = await db
    .select()
    .from(article)
    .where(
      and(
        eq(article.organizationId, organizationId),
        eq(article.type, 'event'),
        eq(article.slug, slug),
        organizationNotDeleted(article.organizationId)
      )
    )
    .limit(1)
  return row
}
