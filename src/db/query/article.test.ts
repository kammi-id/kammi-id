import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { db } from '~/db/db'
import { inArray } from 'drizzle-orm'
import { organization } from '~/db/schema/organization.sql'
import { article } from '~/db/schema/article.sql'
import { articleQuery } from './article'
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
