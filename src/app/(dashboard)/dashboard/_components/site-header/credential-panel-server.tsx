import { readActiveSession } from '~/lib/auth/cookies'
import { CredentialPanel } from '~/components/credential-store'

export const CredentialPanelServer = async () => {
  const session = await readActiveSession()
  if (!session?.user) return null

  const { role, connectedOrganization } = session.user
  if (role !== 'bpk' || !connectedOrganization) return null

  return (
    <CredentialPanel
      organizationId={connectedOrganization.id}
      orgSlug={connectedOrganization.slug}
    />
  )
}
