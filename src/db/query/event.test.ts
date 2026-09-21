import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { organization } from '~/db/schema/organization.sql'
import { listEventsForOrg, getEventBySlug } from './event'
import { listLatestBeritaForOrg } from './article'
import { listSitePages } from './site-pages'
import {
  eventInstantToWallClock,
  eventWallClockToInstant
} from '~/lib/publikasi/event'

describe('Event publication and ownership', () => {
  const orgIds: string[] = []
  let orgId: string
  let otherId: string
  const day = 86400000
  const now = Date.now()
  const seed = async (
    slug: string,
    overrides: Partial<typeof article.$inferInsert> = {}
  ) =>
    db.insert(article).values({
      organizationId: orgId,
      type: 'event',
      title: slug,
      slug,
      body: { type: 'doc', content: [] },
      status: 'published',
      publishedAt: new Date(now - day),
      eventStartsAt: new Date(now + day),
      eventTimezone: 'Asia/Jakarta',
      eventLocation: 'Jakarta',
      ...overrides
    })
  beforeAll(async () => {
    for (const label of ['own', 'other']) {
      const [row] = await db
        .insert(organization)
        .values({
          name: label,
          slug: `event-${label}-${now}`,
          code: `E${label}${now}`,
          type: 'pk',
          isSiteActive: true
        })
        .returning()
      orgIds.push(row.id)
    }
    ;[orgId, otherId] = orgIds
    await seed('near')
    await seed('far', { eventStartsAt: new Date(now + day * 3) })
    await seed('ongoing', {
      eventStartsAt: new Date(now - day),
      eventEndsAt: new Date(now + day)
    })
    const today = eventInstantToWallClock(new Date(now), 'Asia/Jayapura').slice(
      0,
      10
    )
    await seed('all-day', {
      eventStartsAt: eventWallClockToInstant(`${today}T00:00`, 'Asia/Jayapura'),
      eventTimezone: 'Asia/Jayapura'
    })
    await seed('past', {
      eventStartsAt: new Date(now - day * 3),
      eventEndsAt: new Date(now - day * 2)
    })
    await seed('cancelled', { eventCancelled: true })
    await seed('draft', { status: 'draft' })
    await seed('scheduled', { publishedAt: new Date(now + day * 10) })
    await seed('archived', { status: 'archived' })
    await seed('foreign', { organizationId: otherId })
    await seed('page', { type: 'page' })
    await seed('news', { type: 'blog' })
  })
  afterAll(async () => {
    await db.delete(article).where(inArray(article.organizationId, orgIds))
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })
  test('upcoming includes ongoing and local all-day; excludes other types, owners and unpublished', async () => {
    const result = await listEventsForOrg(orgId)
    expect(result.items.map((item) => item.slug)).toEqual([
      'ongoing',
      'all-day',
      'near',
      'far'
    ])
    expect(result.total).toBe(4)
    expect(
      (await listEventsForOrg(orgId, 'upcoming', 2, 2)).items.map(
        (item) => item.slug
      )
    ).toEqual(['near', 'far'])
  })
  test('past and cancellation lists remain separate', async () => {
    expect(
      (await listEventsForOrg(orgId, 'past')).items.map((item) => item.slug)
    ).toEqual(['past'])
    expect(
      (await listEventsForOrg(orgId, 'cancelled')).items.map(
        (item) => item.slug
      )
    ).toEqual(['cancelled'])
    expect(await getEventBySlug(orgId, 'foreign')).toBeUndefined()
    expect(
      (await listLatestBeritaForOrg(orgId)).map((item) => item.slug)
    ).toEqual(['news'])
  })
  test('page references keep their id after rename and never include Events', async () => {
    const [page] = await listSitePages(orgId)
    await db
      .update(article)
      .set({ slug: 'renamed-page' })
      .where(and(eq(article.id, page.id), eq(article.organizationId, orgId)))
    expect(await listSitePages(orgId)).toEqual([
      { id: page.id, title: 'page', slug: 'renamed-page' }
    ])
  })
  test('inactive site loses lists but retains archive lookup; deleted site loses both', async () => {
    await db
      .update(organization)
      .set({ isNonActive: true })
      .where(eq(organization.id, orgId))
    expect((await listEventsForOrg(orgId)).items).toEqual([])
    expect((await getEventBySlug(orgId, 'archived'))?.slug).toBe('archived')
    await db
      .update(organization)
      .set({ deletedAt: new Date() })
      .where(eq(organization.id, orgId))
    expect(await getEventBySlug(orgId, 'archived')).toBeUndefined()
  })
})
