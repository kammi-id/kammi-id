import { expect, test, describe } from 'bun:test'
import { getCachedArticlesForOrg } from './articles'

describe('getCachedArticlesForOrg', () => {
  test('is exported as a function', () => {
    expect(typeof getCachedArticlesForOrg).toBe('function')
  })
})
