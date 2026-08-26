import { expect, test, it, describe, beforeAll, afterAll } from 'bun:test'
import {
  isArticleOrgInScope,
  articleQuery,
  hasPublishedArticle,
  isBeritaTerbit,
  listLatestBeritaForOrg
} from './article'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { article } from '~/db/schema/article.sql'
import { eq, inArray } from 'drizzle-orm'
import {
  wibWallClockToPublishedAt,
  deriveTahunBulanTerbit
} from '~/lib/publikasi/tanggal-terbit'

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
    expect(
      isBeritaTerbit({ status: 'published', publishedAt: null }, now)
    ).toBe(false)
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

/**
 * Tiket 05 (permalink Berita). Fixture bersufiks, dibereskan sendiri —
 * berkas ini menyentuh basis data staging bersama, jadi tidak memakai
 * TRUNCATE (bisa menabrak berkas tes lain yang jalan di worktree paralel).
 */
describe('articleQuery.getBlogArticleBySlug', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const articleIds: string[] = []

  let orgId: string
  let deletedOrgId: string
  let otherOrgId: string

  const seedOrg = async (
    name: string,
    code: string,
    deletedAt: Date | null = null
  ) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `${name} ${suffix}`,
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code,
        type: 'pk',
        parentId: null,
        isNonActive: false,
        deletedAt
      })
      .returning({ id: organization.id })
    orgIds.unshift(row.id)
    return row.id
  }

  const seedArticle = async (
    values: Partial<typeof article.$inferInsert> & { organizationId: string }
  ) => {
    const [row] = await db
      .insert(article)
      .values({
        type: 'blog',
        title: 'Judul Uji',
        slug: `slug-uji-${suffix}`,
        body: { type: 'doc', content: [] },
        status: 'published',
        ...values
      })
      .returning()
    articleIds.unshift(row.id)
    return row
  }

  beforeAll(async () => {
    orgId = await seedOrg('Berita Query Org', `BQO-${suffix}`)
    otherOrgId = await seedOrg('Berita Query Lain', `BQL-${suffix}`)
    deletedOrgId = await seedOrg(
      'Berita Query Terhapus',
      `BQT-${suffix}`,
      new Date()
    )
  })

  afterAll(async () => {
    if (articleIds.length > 0)
      await db.delete(article).where(inArray(article.id, articleIds))
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  it('menemukan Berita lewat slug di organisasinya', async () => {
    const slug = `terbit-${suffix}`
    await seedArticle({ organizationId: orgId, slug })

    const found = await articleQuery.getBlogArticleBySlug(orgId, slug)
    expect(found?.slug).toBe(slug)
    expect(found?.organizationId).toBe(orgId)
  })

  it('tidak menemukan slug milik organisasi lain', async () => {
    const slug = `khusus-org-lain-${suffix}`
    await seedArticle({ organizationId: otherOrgId, slug })

    const found = await articleQuery.getBlogArticleBySlug(orgId, slug)
    expect(found).toBeUndefined()
  })

  it('tidak menemukan Berita milik Struktur Terhapus', async () => {
    const slug = `punya-org-terhapus-${suffix}`
    await seedArticle({ organizationId: deletedOrgId, slug })

    const found = await articleQuery.getBlogArticleBySlug(deletedOrgId, slug)
    expect(found).toBeUndefined()
  })

  it('tidak menemukan Artikel bertipe page (halaman, bukan Berita)', async () => {
    const slug = `halaman-bukan-berita-${suffix}`
    await seedArticle({ organizationId: orgId, slug, type: 'page' })

    const found = await articleQuery.getBlogArticleBySlug(orgId, slug)
    expect(found).toBeUndefined()
  })

  it('tetap mengembalikan baris draft/terjadwal — penyaringan Terbit BUKAN tugas fungsi ini', async () => {
    const slug = `draft-tetap-terbaca-fungsi-ini-${suffix}`
    await seedArticle({ organizationId: orgId, slug, status: 'draft' })

    const found = await articleQuery.getBlogArticleBySlug(orgId, slug)
    expect(found?.status).toBe('draft')
  })

  it('roundtrip nyata lewat Postgres: 06.00 WIB 1 Januari tersimpan dan terbaca kembali sebagai Januari, bukan Desember (ADR 0014, jalur tulis+baca sungguhan)', async () => {
    const slug = `roundtrip-wib-${suffix}`
    const publishedAt = wibWallClockToPublishedAt('2026-01-01T06:00')
    expect(publishedAt).not.toBeNull()

    await seedArticle({
      organizationId: orgId,
      slug,
      publishedAt: publishedAt as Date
    })

    const found = await articleQuery.getBlogArticleBySlug(orgId, slug)
    expect(found?.publishedAt).toBeInstanceOf(Date)
    expect(deriveTahunBulanTerbit(found?.publishedAt as Date)).toEqual({
      tahun: 2026,
      bulan: 1
    })
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
