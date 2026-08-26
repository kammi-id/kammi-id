import { expect, test, describe } from 'bun:test'
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
})
