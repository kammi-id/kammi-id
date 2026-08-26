import { expect, test, describe, afterAll } from 'bun:test'
import {
  isArticleOrgInScope,
  articleQuery,
  hasPublishedArticle
} from './article'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { article } from '~/db/schema/article.sql'
import { eq, inArray } from 'drizzle-orm'

describe('isArticleOrgInScope', () => {
  test('root is always in scope', () => {
    expect(isArticleOrgInScope({ role: 'root' }, 'org-a')).toBe(true)
    expect(isArticleOrgInScope({ role: 'root' }, 'org-b')).toBe(true)
  })

  test('humas is in scope only for their own organization', () => {
    const user = { role: 'humas', connectedOrganizationId: 'org-a' }
    expect(isArticleOrgInScope(user, 'org-a')).toBe(true)
    expect(isArticleOrgInScope(user, 'org-b')).toBe(false)
  })

  test('humas with no connected organization is never in scope', () => {
    const user = { role: 'humas', connectedOrganizationId: null }
    expect(isArticleOrgInScope(user, 'org-a')).toBe(false)
  })

  test('other roles are never in scope', () => {
    expect(
      isArticleOrgInScope(
        { role: 'bpk', connectedOrganizationId: 'org-a' },
        'org-a'
      )
    ).toBe(false)
    expect(isArticleOrgInScope({ role: 'member' }, 'org-a')).toBe(false)
  })
})

describe('articleQuery.create / getById / listForOrg', () => {
  test('create inserts and listForOrg returns it scoped to organizationId', async () => {
    const orgId = process.env.TEST_ORGANIZATION_ID
    if (!orgId) return // skip gracefully when no test DB is wired up

    const created = await articleQuery.create({
      organizationId: orgId,
      type: 'blog',
      title: 'Judul Uji Coba',
      slug: 'judul-uji-coba',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: ['uji'],
      publishedAt: new Date()
    })

    expect(created.id).toBeTruthy()

    const list = await articleQuery.listForOrg(orgId, {})
    expect(list.some((a) => a.id === created.id)).toBe(true)

    const fetched = await articleQuery.getById(created.id)
    expect(fetched?.title).toBe('Judul Uji Coba')
  })
})

/**
 * Ticket 03, spec "Aktivasi Situs", CONTEXT.md "Terbit". Fixture-nya
 * bersufiks dan dibereskan sendiri tanpa `TRUNCATE`, mengikuti preseden
 * `struktur-keadaan/action.test.ts` — banyak berkas tes lain berebut tabel
 * yang sama.
 */
describe('hasPublishedArticle', () => {
  const suffix = Date.now().toString(36)
  const articleIds: string[] = []
  let orgId: string

  const seedArticle = async (values: {
    type: 'page' | 'blog'
    status: 'draft' | 'published' | 'archived'
    publishedAt: Date | null
  }) => {
    const [row] = await db
      .insert(article)
      .values({
        organizationId: orgId,
        title: `Judul ${suffix}`,
        slug: `judul-${suffix}-${articleIds.length}`,
        body: { type: 'doc', content: [] },
        ...values
      })
      .returning({ id: article.id })
    articleIds.unshift(row.id)
    return row.id
  }

  test('setup: seed organization', async () => {
    const [org] = await db
      .insert(organization)
      .values({
        name: `Struktur Uji ${suffix}`,
        slug: `struktur-uji-${suffix}`,
        code: `UJI.${suffix}`,
        type: 'pk',
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgId = org.id
  })

  test('false when the organization has no articles at all', async () => {
    expect(await hasPublishedArticle(orgId)).toBe(false)
  })

  test('false while the only Berita is still draft', async () => {
    await seedArticle({ type: 'blog', status: 'draft', publishedAt: null })
    expect(await hasPublishedArticle(orgId)).toBe(false)
  })

  test('false for a published Berita dated in the future — dinyatakan but not yet Terbit', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    await seedArticle({
      type: 'blog',
      status: 'published',
      publishedAt: future
    })
    expect(await hasPublishedArticle(orgId)).toBe(false)
  })

  test('false for a published Halaman — type page does not count as Berita', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60)
    await seedArticle({ type: 'page', status: 'published', publishedAt: past })
    expect(await hasPublishedArticle(orgId)).toBe(false)
  })

  test('true once a Berita is published with a past date', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60)
    await seedArticle({ type: 'blog', status: 'published', publishedAt: past })
    expect(await hasPublishedArticle(orgId)).toBe(true)
  })

  test('false again once that Berita is archived', async () => {
    await db
      .update(article)
      .set({ status: 'archived' })
      .where(eq(article.organizationId, orgId))
    expect(await hasPublishedArticle(orgId)).toBe(false)
  })

  afterAll(async () => {
    if (articleIds.length > 0) {
      await db.delete(article).where(inArray(article.id, articleIds))
    }
    if (orgId) {
      await db.delete(organization).where(eq(organization.id, orgId))
    }
  })
})
