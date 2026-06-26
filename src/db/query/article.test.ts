import { expect, test, describe } from 'bun:test'
import { isArticleOrgInScope, articleQuery } from './article'

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

describe('articleQuery.create / getById / listForOrg', () => {
  test('create inserts and listForOrg returns it scoped to organizationId', async () => {
    const orgId = process.env.TEST_ORGANIZATION_ID
    if (!orgId) return // skip gracefully when no test DB is wired up

    const created = await articleQuery.create({
      organizationId: orgId,
      type: 'blog',
      title: 'Judul Uji Coba',
      slug: 'judul-uji-coba',
      body: { type: 'doc', content: [] },
      status: 'draft',
      tags: ['uji'],
      publishedAt: new Date()
    })

    expect(created.id).toBeTruthy()

    const list = await articleQuery.listForOrg(orgId, {})
    expect(list.some((a) => a.id === created.id)).toBe(true)

    const fetched = await articleQuery.getById(created.id)
    expect(fetched?.title).toBe('Judul Uji Coba')
  })
})
