import { expect, test, describe } from 'bun:test'
import { isArticleOrgInScope } from './article'

describe('isArticleOrgInScope', () => {
  test('root is always in scope', () => {
    expect(isArticleOrgInScope({ role: 'root' }, 'org-a')).toBe(true)
    expect(isArticleOrgInScope({ role: 'root' }, 'org-b')).toBe(true)
  })

  test('humas is in scope only for their own organization', () => {
    const user = { role: 'humas', connectedOrganizationId: 'org-a' }
    expect(isArticleOrgInScope(user, 'org-a')).toBe(true)
    expect(isArticleOrgInScope(user, 'org-b')).toBe(false)
  })

  test('humas with no connected organization is never in scope', () => {
    const user = { role: 'humas', connectedOrganizationId: null }
    expect(isArticleOrgInScope(user, 'org-a')).toBe(false)
  })

  test('other roles are never in scope', () => {
    expect(
      isArticleOrgInScope({ role: 'bpk', connectedOrganizationId: 'org-a' }, 'org-a')
    ).toBe(false)
    expect(isArticleOrgInScope({ role: 'member' }, 'org-a')).toBe(false)
  })
})
