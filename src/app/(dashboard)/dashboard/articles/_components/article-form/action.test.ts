import { expect, test, describe } from 'bun:test'
import { ArticleInputSchema } from './action'

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
      publishedAt: new Date().toISOString()
    })
    expect(result.success).toBe(true)
  })
})
