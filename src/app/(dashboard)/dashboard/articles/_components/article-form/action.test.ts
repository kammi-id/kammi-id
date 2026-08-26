import { expect, test, describe } from 'bun:test'
import { RESERVED_STRUKTUR_PATHS } from '~/lib/struktur/reserved-paths'
import { ArticleInputSchema } from './schema'

describe('ArticleInputSchema', () => {
  test('requires publishedAt when type is blog', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'blog',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: []
    })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.flatten().fieldErrors.publishedAt).toBeTruthy()
  })

  test('publishedAt optional when type is page', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'page',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: []
    })
    expect(result.success).toBe(true)
  })

  test('accepts blog with publishedAt set', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'blog',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: [],
      publishedAt: new Date().toISOString(),
      featuredImage: 'articles/foto.jpg'
    })
    expect(result.success).toBe(true)
  })

  test('requires featuredImage when type is blog', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'blog',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: [],
      publishedAt: new Date().toISOString()
    })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.flatten().fieldErrors.featuredImage).toBeTruthy()
  })

  test('featuredImage optional when type is page', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'page',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: []
    })
    expect(result.success).toBe(true)
  })

  test('accepts blog with both publishedAt and featuredImage set', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'blog',
      title: 'Judul',
      slug: 'judul',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: [],
      publishedAt: new Date().toISOString(),
      featuredImage: 'articles/foto.jpg'
    })
    expect(result.success).toBe(true)
  })

  test('menolak Permalink Halaman yang bertabrakan dengan alamat milik sistem', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'page',
      title: 'Judul',
      slug: 'dashboard',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: []
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const slugErrors = result.error.flatten().fieldErrors.slug
      expect(slugErrors).toBeTruthy()
      // Pesan galat wajib menyebut alamat mana yang dipakai sistem — bukan
      // sekadar "permalink tidak valid" generik.
      expect(slugErrors?.[0]).toContain('dashboard')
    }
  })

  test('menolak setiap alamat milik sistem, bukan cuma satu contoh', () => {
    for (const reserved of RESERVED_STRUKTUR_PATHS) {
      const result = ArticleInputSchema.safeParse({
        organizationId: 'org-a',
        type: 'page',
        title: 'Judul',
        slug: reserved,
        body: { type: 'doc', content: [] },
        status: 'draft',
        tags: []
      })
      expect(result.success).toBe(false)
    }
  })

  test('Berita (type blog) tidak disaring daftar alamat milik sistem — permalinknya hidup di bawah /berita/tahun/bulan/, tidak pernah bertabrakan', () => {
    const result = ArticleInputSchema.safeParse({
      organizationId: 'org-a',
      type: 'blog',
      title: 'Judul',
      slug: 'dashboard',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: [],
      featuredImage: '/api/images/placeholder.jpg',
      publishedAt: new Date().toISOString()
    })
    expect(result.success).toBe(true)
  })
})
