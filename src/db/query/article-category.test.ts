import { expect, test, describe } from 'bun:test'
import { wouldCreateCycle } from './article-category'

describe('wouldCreateCycle', () => {
  test('returns true when parentId equals the category itself', () => {
    expect(wouldCreateCycle('cat-1', 'cat-1', [])).toBe(true)
  })

  test('returns true when parentId is a descendant of the category', () => {
    const allCategories = [
      { id: 'cat-2', parentId: 'cat-1' },
      { id: 'cat-3', parentId: 'cat-2' }
    ]
    expect(wouldCreateCycle('cat-1', 'cat-3', allCategories)).toBe(true)
  })

  test('returns false for a valid non-cyclic reassignment', () => {
    const allCategories = [
      { id: 'cat-2', parentId: 'cat-1' },
      { id: 'cat-3', parentId: null }
    ]
    expect(wouldCreateCycle('cat-2', 'cat-3', allCategories)).toBe(false)
  })

  test('returns false when parentId is null', () => {
    expect(wouldCreateCycle('cat-1', null, [])).toBe(false)
  })
})
