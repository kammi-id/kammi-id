import { describe, expect, it } from 'bun:test'
import { buildPaginationItems } from './pagination'

describe('buildPaginationItems', () => {
  it('returns every page with no ellipsis when the whole range already fits', () => {
    expect(buildPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(buildPaginationItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('always keeps the first and last page visible even for a huge archive', () => {
    const items = buildPaginationItems(5, 10)
    expect(items[0]).toBe(1)
    expect(items[items.length - 1]).toBe(10)
  })

  it('windows around the current page with a single ellipsis on each side', () => {
    expect(buildPaginationItems(5, 10)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      'ellipsis',
      10
    ])
  })

  it('drops the left ellipsis when the current page is near the start', () => {
    expect(buildPaginationItems(1, 10)).toEqual([1, 2, 'ellipsis', 10])
    expect(buildPaginationItems(2, 10)).toEqual([1, 2, 3, 'ellipsis', 10])
  })

  it('drops the right ellipsis when the current page is near the end', () => {
    expect(buildPaginationItems(10, 10)).toEqual([1, 'ellipsis', 9, 10])
    expect(buildPaginationItems(9, 10)).toEqual([1, 'ellipsis', 8, 9, 10])
  })

  it('never repeats a page number and always stays sorted ascending', () => {
    for (let total = 1; total <= 20; total++) {
      for (let current = 1; current <= total; current++) {
        const items = buildPaginationItems(current, total)
        const numbers = items.filter((i): i is number => i !== 'ellipsis')
        expect(new Set(numbers).size).toBe(numbers.length)
        expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
      }
    }
  })

  it('returns an empty list when there are no pages at all', () => {
    expect(buildPaginationItems(1, 0)).toEqual([])
  })
})
