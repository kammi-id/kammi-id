import { expect, test, describe } from 'bun:test'
import { article } from './article.sql'

describe('article schema', () => {
  test('has expected columns', () => {
    expect(Object.keys(article)).toEqual(
      expect.arrayContaining([
        'id',
        'organizationId',
        'type',
        'title',
        'slug',
        'body',
        'featuredImage',
        'publishedAt',
        'status',
        'tags',
        'categoryId',
        'createdAt',
        'updatedAt'
      ])
    )
  })
})
