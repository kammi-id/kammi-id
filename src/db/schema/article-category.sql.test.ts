import { expect, test, describe } from 'bun:test'
import { articleCategory } from './article-category.sql'

describe('articleCategory schema', () => {
  test('has expected columns', () => {
    expect(Object.keys(articleCategory)).toEqual(
      expect.arrayContaining([
        'id',
        'organizationId',
        'name',
        'slug',
        'parentId'
      ])
    )
  })
})
