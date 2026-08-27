import { expect, test, it, describe, beforeAll, afterAll } from 'bun:test'
import {
  isArticleOrgInScope,
  articleQuery,
  hasPublishedArticle,
  listLatestBeritaForOrg,
  listBeritaArsipForOrg,
  BERITA_ARSIP_PAGE_SIZE,
  listLatestBeritaJaringan,
  listBeritaJaringan,
  BERITA_JARINGAN_PAGE_SIZE
} from './article'
import { articleCategoryQuery } from './article-category'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { article } from '~/db/schema/article.sql'
import { articleCategory } from '~/db/schema/article-category.sql'
import { eq, inArray } from 'drizzle-orm'
import {
  wibWallClockToPublishedAt,
  deriveTahunBulanTerbit
} from '~/lib/publikasi/tanggal-terbit'

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
 * Ticket 09 (Halaman beralamat akar). Fixture bersufiks, dibereskan sendiri,
 * mengikuti preseden `getBlogArticleBySlug` di atas.
 */
describe('articleQuery.getPageArticleBySlug', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const articleIds: string[] = []
  let orgId: string

  beforeAll(async () => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `Halaman Query Org ${suffix}`,
        slug: `halaman-query-org-${suffix}`,
        code: `HQO-${suffix}`,
        type: 'pk',
        parentId: null,
        isNonActive: false,
        deletedAt: null
      })
      .returning({ id: organization.id })
    orgId = row.id
    orgIds.push(orgId)
  })

  afterAll(async () => {
    if (articleIds.length > 0)
      await db.delete(article).where(inArray(article.id, articleIds))
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  it('menemukan Halaman lewat slug di organisasinya', async () => {
    const slug = `tentang-kami-${suffix}`
    const [row] = await db
      .insert(article)
      .values({
        organizationId: orgId,
        type: 'page',
        title: 'Tentang Kami',
        slug,
        body: { type: 'doc', content: [] },
        status: 'published'
      })
      .returning()
    articleIds.push(row.id)

    const found = await articleQuery.getPageArticleBySlug(orgId, slug)
    expect(found?.slug).toBe(slug)
    expect(found?.type).toBe('page')
  })

  it('tidak menemukan Berita (type blog) dengan slug yang sama', async () => {
    const slug = `berita-bukan-halaman-${suffix}`
    const [row] = await db
      .insert(article)
      .values({
        organizationId: orgId,
        type: 'blog',
        title: 'Judul Berita',
        slug,
        body: { type: 'doc', content: [] },
        status: 'published',
        publishedAt: new Date()
      })
      .returning()
    articleIds.push(row.id)

    const found = await articleQuery.getPageArticleBySlug(orgId, slug)
    expect(found).toBeUndefined()
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

/**
 * Ticket 07 (arsip Berita per Situs Struktur). Fixture bersufiks dan
 * dibereskan sendiri tanpa TRUNCATE — mengikuti preseden `hasPublishedArticle`
 * di atas, bukan `listLatestBeritaForOrg` yang menumpang `TEST_ORGANIZATION_ID`
 * bersama tanpa pembersihan (berkas ini butuh isolasi ketat untuk menghitung
 * totalCount/totalPages dengan tepat).
 */
describe('listBeritaArsipForOrg', () => {
  const suffix = Date.now().toString(36)
  const articleIds: string[] = []
  const categoryIds: string[] = []
  const orgIds: string[] = []
  let orgId: string
  let otherOrgId: string
  let categoryId: string

  const seedOrg = async (name: string, code: string) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `${name} ${suffix}`,
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code,
        type: 'pk',
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgIds.push(row.id)
    return row.id
  }

  const seedArticle = async (
    values: Partial<typeof article.$inferInsert> & {
      organizationId: string
      publishedAt: Date | null
    },
    idx: number
  ) => {
    const [row] = await db
      .insert(article)
      .values({
        type: 'blog',
        title: `Arsip ${suffix} ${idx}`,
        slug: `arsip-${suffix}-${idx}`,
        body: { type: 'doc', content: [] },
        status: 'published',
        ...values
      })
      .returning()
    articleIds.push(row.id)
    return row
  }

  beforeAll(async () => {
    orgId = await seedOrg('Arsip Berita Org', `ABO-${suffix}`)
    otherOrgId = await seedOrg('Arsip Berita Lain', `ABL-${suffix}`)

    const category = await articleCategoryQuery.create({
      organizationId: orgId,
      name: `Kategori ${suffix}`,
      slug: `kategori-${suffix}`
    })
    categoryId = category.id
    categoryIds.push(category.id)
  })

  afterAll(async () => {
    // Articles first — `article.categoryId` is `onDelete: 'restrict'`, so the
    // category row can't go while an article still points at it.
    if (articleIds.length > 0)
      await db.delete(article).where(inArray(article.id, articleIds))
    if (categoryIds.length > 0)
      await db
        .delete(articleCategory)
        .where(inArray(articleCategory.id, categoryIds))
    if (orgIds.length > 0)
      await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  test('exposes a 48-item page size, per spec "48 per halaman"', () => {
    expect(BERITA_ARSIP_PAGE_SIZE).toBe(48)
  })

  test('paginates with total count and total pages computed in the same query, no gaps or duplicates across pages', async () => {
    const now = Date.now()
    const seeded = []
    for (let i = 0; i < 7; i++) {
      seeded.push(
        await seedArticle(
          {
            organizationId: orgId,
            publishedAt: new Date(now - i * 60_000)
          },
          100 + i
        )
      )
    }

    const page1 = await listBeritaArsipForOrg(orgId, 1, 3)
    const page2 = await listBeritaArsipForOrg(orgId, 2, 3)
    const page3 = await listBeritaArsipForOrg(orgId, 3, 3)

    expect(page1.totalCount).toBe(7)
    expect(page1.totalPages).toBe(3)
    expect(page1.items.length).toBe(3)
    expect(page2.items.length).toBe(3)
    expect(page3.items.length).toBe(1)
    expect(page2.totalCount).toBe(7)
    expect(page3.totalCount).toBe(7)

    const allIds = [...page1.items, ...page2.items, ...page3.items].map(
      (i) => i.id
    )
    const seededIds = seeded.map((s) => s.id)
    expect(new Set(allIds).size).toBe(allIds.length) // no duplicates
    expect(allIds.sort()).toEqual(seededIds.sort()) // no gaps
  })

  test('orders newest publishedAt first, with a stable tie-breaker for equal timestamps', async () => {
    const same = new Date(Date.now() - 999_000_000)
    const a = await seedArticle(
      { organizationId: orgId, publishedAt: same },
      200
    )
    const b = await seedArticle(
      { organizationId: orgId, publishedAt: same },
      201
    )

    const first = await listBeritaArsipForOrg(orgId, 1, 200)
    const second = await listBeritaArsipForOrg(orgId, 1, 200)

    const idxA1 = first.items.findIndex((i) => i.id === a.id)
    const idxB1 = second.items.findIndex((i) => i.id === a.id)
    expect(idxA1).toBe(idxB1) // same position across repeated calls

    const orderOfTie = first.items
      .filter((i) => i.id === a.id || i.id === b.id)
      .map((i) => i.id)
    // b has a larger uuidv7 (created later) — tie-break is deterministic
    expect(orderOfTie).toEqual([b.id, a.id])
  })

  test('excludes draft, scheduled, and Halaman (type page) rows from both items and totalCount', async () => {
    const past = new Date(Date.now() - 60_000)
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)

    await seedArticle(
      { organizationId: orgId, publishedAt: past, status: 'draft' },
      300
    )
    await seedArticle(
      { organizationId: orgId, publishedAt: future, status: 'published' },
      301
    )
    await seedArticle(
      { organizationId: orgId, publishedAt: past, type: 'page' },
      302
    )

    const result = await listBeritaArsipForOrg(orgId, 1, 200)
    const titles = result.items.map((i) => i.title)
    expect(titles).not.toContain(`Arsip ${suffix} 300`)
    expect(titles).not.toContain(`Arsip ${suffix} 301`)
    expect(titles).not.toContain(`Arsip ${suffix} 302`)
  })

  test('attaches Struktur identity via the same query (organization name/slug on every item)', async () => {
    await seedArticle(
      { organizationId: orgId, publishedAt: new Date(Date.now() - 1000) },
      400
    )

    const result = await listBeritaArsipForOrg(orgId, 1, 200)
    expect(result.items.length).toBeGreaterThan(0)
    for (const item of result.items) {
      expect(item.organization.id).toBe(orgId)
      expect(item.organization.slug).toBe(`arsip-berita-org-${suffix}`)
    }
  })

  test('attaches the category label when set, and null when the article has none', async () => {
    const withCategory = await seedArticle(
      {
        organizationId: orgId,
        publishedAt: new Date(Date.now() - 2000),
        categoryId
      },
      500
    )
    const withoutCategory = await seedArticle(
      { organizationId: orgId, publishedAt: new Date(Date.now() - 3000) },
      501
    )

    const result = await listBeritaArsipForOrg(orgId, 1, 200)
    const withCat = result.items.find((i) => i.id === withCategory.id)
    const withoutCat = result.items.find((i) => i.id === withoutCategory.id)

    expect(withCat?.category?.name).toBe(`Kategori ${suffix}`)
    expect(withoutCat?.category).toBeNull()
  })

  test("does not leak another Struktur's Berita into items or totalCount", async () => {
    await seedArticle(
      {
        organizationId: otherOrgId,
        publishedAt: new Date(Date.now() - 1000)
      },
      600
    )

    const own = await listBeritaArsipForOrg(orgId, 1, 200)
    const other = await listBeritaArsipForOrg(otherOrgId, 1, 200)

    expect(own.items.every((i) => i.organization.id === orgId)).toBe(true)
    expect(other.items.length).toBe(1)
    expect(other.totalCount).toBe(1)
  })
})

/**
 * Ticket 08 (Berita Jaringan). Fixture bersufiks dan dibereskan sendiri,
 * mengikuti preseden `listBeritaArsipForOrg` di atas — tapi filter Struktur
 * yang diuji BEDA (ADR 0013): Terhapus dan Situs belum Aktif disaring,
 * Non-Aktif TIDAK.
 */
describe('listBeritaJaringan & listLatestBeritaJaringan', () => {
  const suffix = Date.now().toString(36)
  const articleIds: string[] = []
  const orgIds: string[] = []
  let activeOrgId: string
  let otherActiveOrgId: string
  let inactiveSiteOrgId: string
  let deletedOrgId: string
  let nonAktifStrukturOrgId: string

  const seedOrg = async (
    name: string,
    code: string,
    opts: { isSiteActive: boolean; deletedAt?: Date; isNonActive?: boolean }
  ) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `${name} ${suffix}`,
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code,
        type: 'pk',
        isNonActive: opts.isNonActive ?? false,
        isSiteActive: opts.isSiteActive,
        deletedAt: opts.deletedAt ?? null
      })
      .returning({ id: organization.id })
    orgIds.push(row.id)
    return row.id
  }

  const seedArticle = async (
    values: Partial<typeof article.$inferInsert> & {
      organizationId: string
      publishedAt: Date | null
    },
    idx: number
  ) => {
    const [row] = await db
      .insert(article)
      .values({
        type: 'blog',
        title: `Jaringan ${suffix} ${idx}`,
        slug: `jaringan-${suffix}-${idx}`,
        body: { type: 'doc', content: [] },
        status: 'published',
        ...values
      })
      .returning()
    articleIds.push(row.id)
    return row
  }

  beforeAll(async () => {
    activeOrgId = await seedOrg('Jaringan Org Aktif', `JOA-${suffix}`, {
      isSiteActive: true
    })
    otherActiveOrgId = await seedOrg('Jaringan Org Aktif Lain', `JOL-${suffix}`, {
      isSiteActive: true
    })
    inactiveSiteOrgId = await seedOrg('Jaringan Situs Belum Aktif', `JSB-${suffix}`, {
      isSiteActive: false
    })
    deletedOrgId = await seedOrg('Jaringan Org Terhapus', `JOT-${suffix}`, {
      isSiteActive: true,
      deletedAt: new Date()
    })
    nonAktifStrukturOrgId = await seedOrg('Jaringan Struktur Non Aktif', `JNA-${suffix}`, {
      isSiteActive: true,
      isNonActive: true
    })
  })

  afterAll(async () => {
    if (articleIds.length > 0)
      await db.delete(article).where(inArray(article.id, articleIds))
    if (orgIds.length > 0)
      await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  test('exposes a 48-item page size, per spec "48 per halaman"', () => {
    expect(BERITA_JARINGAN_PAGE_SIZE).toBe(48)
  })

  test('combines Berita across multiple Struktur, newest first, with organization identity attached', async () => {
    const a = await seedArticle(
      {
        organizationId: activeOrgId,
        publishedAt: new Date(Date.now() - 60_000)
      },
      1
    )
    const b = await seedArticle(
      {
        organizationId: otherActiveOrgId,
        publishedAt: new Date(Date.now() - 30_000)
      },
      2
    )

    const result = await listBeritaJaringan(1, 200)
    const ids = result.items.map((i) => i.id)

    expect(ids).toContain(a.id)
    expect(ids).toContain(b.id)
    expect(ids.indexOf(b.id)).toBeLessThan(ids.indexOf(a.id))

    const itemB = result.items.find((i) => i.id === b.id)
    expect(itemB?.organization.id).toBe(otherActiveOrgId)
    expect(itemB?.organization.type).toBe('pk')
  })

  test('excludes Berita from a Struktur Terhapus', async () => {
    const excluded = await seedArticle(
      {
        organizationId: deletedOrgId,
        publishedAt: new Date(Date.now() - 1000)
      },
      3
    )

    const result = await listBeritaJaringan(1, 200)
    expect(result.items.map((i) => i.id)).not.toContain(excluded.id)
  })

  test('excludes Berita from a Struktur whose Situs is not yet Aktif', async () => {
    const excluded = await seedArticle(
      {
        organizationId: inactiveSiteOrgId,
        publishedAt: new Date(Date.now() - 1000)
      },
      4
    )

    const result = await listBeritaJaringan(1, 200)
    expect(result.items.map((i) => i.id)).not.toContain(excluded.id)
  })

  test('does NOT exclude Berita from a Struktur Non-Aktif (ADR 0013 — beda dari filter arsip per Situs)', async () => {
    const included = await seedArticle(
      {
        organizationId: nonAktifStrukturOrgId,
        publishedAt: new Date(Date.now() - 1000)
      },
      5
    )

    const result = await listBeritaJaringan(1, 200)
    expect(result.items.map((i) => i.id)).toContain(included.id)
  })

  test('paginates with total count computed in the same query', async () => {
    const now = Date.now()
    const seeded = []
    for (let i = 0; i < 5; i++) {
      seeded.push(
        await seedArticle(
          {
            organizationId: activeOrgId,
            publishedAt: new Date(now - i * 60_000)
          },
          10 + i
        )
      )
    }

    const page1 = await listBeritaJaringan(1, 2)
    expect(page1.items.length).toBe(2)
    expect(page1.totalPages).toBe(Math.ceil(page1.totalCount / 2))
    expect(page1.totalCount).toBeGreaterThanOrEqual(5)
  })

  test('listLatestBeritaJaringan returns the same cross-Struktur filter, newest first, limited', async () => {
    const excluded = await seedArticle(
      {
        organizationId: deletedOrgId,
        publishedAt: new Date(Date.now() - 500)
      },
      20
    )
    // +60s, still well inside the Terbit cutoff (now + 7h) but guaranteed
    // newer than every `Date.now() - X` fixture seeded by earlier tests in
    // this block — a `- X` offset close to the process clock can otherwise
    // race with a later test's own `Date.now()` within the same run.
    const included = await seedArticle(
      {
        organizationId: activeOrgId,
        publishedAt: new Date(Date.now() + 60_000)
      },
      21
    )

    const items = await listLatestBeritaJaringan(3)
    const ids = items.map((i) => i.id)
    expect(ids).not.toContain(excluded.id)
    expect(ids[0]).toBe(included.id)
    expect(items.length).toBeLessThanOrEqual(3)
  })
})
