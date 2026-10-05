import { describe, it, expect, beforeEach, mock } from 'bun:test'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

const { requireSiteSettingsAccess } = await import('./site-settings')

const sessionWith = (role: string, organizationId: string | null) => ({
  user: {
    id: 'u1',
    role,
    connectedOrganization: organizationId ? { id: organizationId } : null
  }
})

describe('requireSiteSettingsAccess', () => {
  beforeEach(() => {
    mockSession = undefined
  })

  it('resolves a root session to the caller organisation', async () => {
    mockSession = sessionWith('root', 'org-1')

    expect(await requireSiteSettingsAccess()).toEqual({ orgId: 'org-1' })
  })

  it('resolves a humas session to the caller organisation', async () => {
    mockSession = sessionWith('humas', 'org-2')

    expect(await requireSiteSettingsAccess()).toEqual({ orgId: 'org-2' })
  })

  it('refuses a role outside the site-settings allowlist', async () => {
    mockSession = sessionWith('bpk', 'org-1')

    expect(await requireSiteSettingsAccess()).toBeNull()
  })

  it('refuses when there is no active session', async () => {
    mockSession = undefined

    expect(await requireSiteSettingsAccess()).toBeNull()
  })

  it('refuses a privileged role with no connected organisation', async () => {
    mockSession = sessionWith('root', null)

    expect(await requireSiteSettingsAccess()).toBeNull()
  })
})
