import { expect, test, describe } from 'bun:test'
import { articlePermalinkHistory } from './article-permalink-history.sql'

describe('articlePermalinkHistory schema', () => {
  test('has expected columns', () => {
    expect(Object.keys(articlePermalinkHistory)).toEqual(
      expect.arrayContaining([
        'id',
        'organizationId',
        'articleId',
        'oldSlug',
        'oldTahun',
        'oldBulan',
        'createdAt'
      ])
    )
  })
})
