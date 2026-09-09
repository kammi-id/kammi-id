import { expect, it, describe, beforeAll, afterAll } from 'bun:test'
import { articlePermalinkHistoryQuery } from './article-permalink-history'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { article } from '~/db/schema/article.sql'
import { articlePermalinkHistory } from '~/db/schema/article-permalink-history.sql'
import { inArray } from 'drizzle-orm'

/**
 * Ticket 10 (Riwayat alamat Berita, ADR 0014). Tabel fisiknya BELUM ada di
 * basis data manapun sampai migrasi digenerate terpusat (batasan tiket) —
 * seluruh `describe` ini DIHARAPKAN merah dengan `relation does not exist`
 * sampai saat itu. Fixture bersufiks, dibereskan sendiri, mengikuti pola
 * `src/db/query/article.test.ts`.
 */
describe('articlePermalinkHistoryQuery', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const articleIds: string[] = []
  const historyIds: string[] = []

  let orgId: string

  const seedArticle = async (slug: string) => {
    const [row] = await db
      .insert(article)
      .values({
        organizationId: orgId,
        type: 'blog',
        title: `Judul ${suffix}`,
        slug,
        body: { type: 'doc', content: [] },
        status: 'published',
        publishedAt: new Date('2026-01-05T00:00:00Z')
      })
      .returning()
    articleIds.unshift(row.id)
    return row
  }

  beforeAll(async () => {
    const [org] = await db
      .insert(organization)
      .values({
        name: `Riwayat Permalink Org ${suffix}`,
        slug: `riwayat-permalink-org-${suffix}`,
        code: `RPO-${suffix}`,
        type: 'pk',
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgId = org.id
    orgIds.unshift(orgId)
  })

  afterAll(async () => {
    if (historyIds.length > 0)
      await db
        .delete(articlePermalinkHistory)
        .where(inArray(articlePermalinkHistory.id, historyIds))
    if (articleIds.length > 0)
      await db.delete(article).where(inArray(article.id, articleIds))
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  it('record menyimpan baris riwayat dan mengembalikannya', async () => {
    const target = await seedArticle(`target-${suffix}`)

    const created = await articlePermalinkHistoryQuery.record({
      organizationId: orgId,
      articleId: target.id,
      oldSlug: `lama-${suffix}`,
      oldTahun: 2025,
      oldBulan: 12
    })
    historyIds.unshift(created.id)

    expect(created.articleId).toBe(target.id)
    expect(created.oldSlug).toBe(`lama-${suffix}`)
  })

  it('findCurrentArticleForOldPermalink menemukan Berita tujuan lewat alamat lamanya', async () => {
    const target = await seedArticle(`tujuan-${suffix}`)
    const oldSlug = `alamat-lama-${suffix}`
    const created = await articlePermalinkHistoryQuery.record({
      organizationId: orgId,
      articleId: target.id,
      oldSlug,
      oldTahun: 2025,
      oldBulan: 12
    })
    historyIds.unshift(created.id)

    const found =
      await articlePermalinkHistoryQuery.findCurrentArticleForOldPermalink(
        orgId,
        oldSlug
      )

    expect(found?.id).toBe(target.id)
    // Baris yang dikembalikan adalah baris `article` SEGAR — bukan snapshot
    // beku dari saat riwayat ditulis — jadi slug-nya slug TERKINI si Berita.
    expect(found?.slug).toBe(`tujuan-${suffix}`)
  })

  it('tidak menemukan apa pun untuk alamat yang tidak pernah punya riwayat', async () => {
    const found =
      await articlePermalinkHistoryQuery.findCurrentArticleForOldPermalink(
        orgId,
        `tidak-pernah-ada-${suffix}`
      )
    expect(found).toBeUndefined()
  })

  it('alamat lama yang dipakai ulang oleh Berita lain melayani Berita yang benar-benar aktif sekarang, bukan yang lama', async () => {
    const articleLama = await seedArticle(`sekarang-pindah-${suffix}`)
    const oldSlug = `dipakai-ulang-${suffix}`

    // articleLama dulu pernah memakai oldSlug, lalu pindah (baris riwayat #1).
    const historyLama = await articlePermalinkHistoryQuery.record({
      organizationId: orgId,
      articleId: articleLama.id,
      oldSlug,
      oldTahun: 2025,
      oldBulan: 1
    })
    historyIds.unshift(historyLama.id)

    // Sekarang Berita LAIN memakai slug yang sama persis, lalu ia SENDIRI
    // juga pindah (baris riwayat #2, articleId beda, createdAt lebih baru).
    const articleBaru = await seedArticle(`penerima-slug-${suffix}`)
    const historyBaru = await articlePermalinkHistoryQuery.record({
      organizationId: orgId,
      articleId: articleBaru.id,
      oldSlug,
      oldTahun: 2025,
      oldBulan: 6
    })
    historyIds.unshift(historyBaru.id)

    const found =
      await articlePermalinkHistoryQuery.findCurrentArticleForOldPermalink(
        orgId,
        oldSlug
      )

    // Pemenangnya articleBaru (pemetaan TERBARU), bukan articleLama.
    expect(found?.id).toBe(articleBaru.id)
  })

  it('tidak menemukan riwayat milik organisasi lain', async () => {
    const [otherOrg] = await db
      .insert(organization)
      .values({
        name: `Riwayat Permalink Org Lain ${suffix}`,
        slug: `riwayat-permalink-org-lain-${suffix}`,
        code: `RPL-${suffix}`,
        type: 'pk',
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgIds.unshift(otherOrg.id)

    const oldSlug = `khusus-org-ini-${suffix}`
    const target = await seedArticle(`target-scoped-${suffix}`)
    const created = await articlePermalinkHistoryQuery.record({
      organizationId: orgId,
      articleId: target.id,
      oldSlug,
      oldTahun: 2025,
      oldBulan: 12
    })
    historyIds.unshift(created.id)

    const found =
      await articlePermalinkHistoryQuery.findCurrentArticleForOldPermalink(
        otherOrg.id,
        oldSlug
      )
    expect(found).toBeUndefined()
  })
})
