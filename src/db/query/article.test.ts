import { expect, test, describe } from 'bun:test'
import {
  isArticleOrgInScope,
  isBeritaTerbit,
  listLatestBeritaForOrg,
  articleQuery
} from './article'

describe('isBeritaTerbit', () => {
  const now = new Date('2026-06-15T12:00:00.000Z')

  test('draft is never Terbit, even with a past publishedAt', () => {
    expect(
      isBeritaTerbit(
        { status: 'draft', publishedAt: new Date('2026-01-01T00:00:00.000Z') },
        now
      )
    ).toBe(false)
  })

  test('archived is never Terbit', () => {
    expect(
      isBeritaTerbit(
        {
          status: 'archived',
          publishedAt: new Date('2026-01-01T00:00:00.000Z')
        },
        now
      )
    ).toBe(false)
  })

  test('published with no publishedAt is not Terbit', () => {
    expect(isBeritaTerbit({ status: 'published', publishedAt: null }, now)).toBe(
      false
    )
  })

  test('published with a future publishedAt is terjadwal, not Terbit', () => {
    expect(
      isBeritaTerbit(
        {
          status: 'published',
          publishedAt: new Date('2026-12-31T00:00:00.000Z')
        },
        now
      )
    ).toBe(false)
  })

  test('published with a past publishedAt is Terbit', () => {
    expect(
      isBeritaTerbit(
        {
          status: 'published',
          publishedAt: new Date('2026-01-01T00:00:00.000Z')
        },
        now
      )
    ).toBe(true)
  })

  test('published exactly at now is Terbit (inclusive)', () => {
    expect(isBeritaTerbit({ status: 'published', publishedAt: now }, now)).toBe(
      true
    )
  })
})

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

describe('listLatestBeritaForOrg', () => {
  test('returns only Terbit blog articles for the org, newest first', async () => {
    const orgId = process.env.TEST_ORGANIZATION_ID
    if (!orgId) return // skip gracefully when no test DB is wired up

    const terbitOld = await articleQuery.create({
      organizationId: orgId,
      type: 'blog',
      title: 'Berita Lama',
      slug: `berita-lama-${Date.now()}`,
      body: { type: 'doc', content: [] },
      status: 'published',
      publishedAt: new Date('2020-01-01T00:00:00.000Z')
    })
    const terbitNew = await articleQuery.create({
      organizationId: orgId,
      type: 'blog',
      title: 'Berita Baru',
      slug: `berita-baru-${Date.now()}`,
      body: { type: 'doc', content: [] },
      status: 'published',
      publishedAt: new Date('2020-06-01T00:00:00.000Z')
    })
    await articleQuery.create({
      organizationId: orgId,
      type: 'blog',
      title: 'Berita Draf',
      slug: `berita-draf-${Date.now()}`,
      body: { type: 'doc', content: [] },
      status: 'draft',
      publishedAt: new Date('2020-01-01T00:00:00.000Z')
    })
    await articleQuery.create({
      organizationId: orgId,
      type: 'blog',
      title: 'Berita Terjadwal',
      slug: `berita-terjadwal-${Date.now()}`,
      body: { type: 'doc', content: [] },
      status: 'published',
      publishedAt: new Date('2999-01-01T00:00:00.000Z')
    })
    await articleQuery.create({
      organizationId: orgId,
      type: 'page',
      title: 'Halaman, Bukan Berita',
      slug: `halaman-${Date.now()}`,
      body: { type: 'doc', content: [] },
      status: 'published',
      publishedAt: new Date('2020-01-01T00:00:00.000Z')
    })

    const list = await listLatestBeritaForOrg(orgId, 12)
    const ids = list.map((a) => a.id)

    expect(ids).toContain(terbitOld.id)
    expect(ids).toContain(terbitNew.id)
    expect(ids.indexOf(terbitNew.id)).toBeLessThan(ids.indexOf(terbitOld.id))
  })
})
