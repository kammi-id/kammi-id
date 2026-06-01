import { getNetworkStats, getPWOrganizations } from '~/app/(main)/_data/network'
import { NetworkSectionClient } from './network-section-client'

export const NetworkSection = async () => {
  const [stats, pwOrgs] = await Promise.all([
    getNetworkStats(),
    getPWOrganizations()
  ])

  return <NetworkSectionClient stats={stats} pwOrgs={pwOrgs} />
}
