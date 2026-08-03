import type { Metadata } from 'next'
import { readActiveSession } from '~/lib/auth/cookies'
import { fetchAllowedOrgIds, type AccessScope } from '~/db/query/organization'
import type { readMemberAggregates } from '~/db/query/member'
import {
  getCachedMemberAggregates,
  getCachedMemberDistributionByOrgType
} from './_data/members'
import { getCachedOrganizationCount } from './_data/organizations'
import { getCachedUpcomingTrainings } from './_data/trainings'
import { DashboardHeader } from './_components/dashboard-header'
import { DashboardStats } from './_components/dashboard-stats'
import { KaderBentoStats } from './_components/kader-bento-stats'
import { WilayahStats } from './_components/wilayah-stats'
import { UpcomingTrainings } from './_components/upcoming-trainings'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Panel pengelolaan data dan konten KAMMI.id.'
}

// readMemberAggregates returns accumulated rows per org (children rolled up into parents).
// The anchor (root) row has the minimum level and already contains the grand total.
// Summing all rows would double-count every member.
const sumAggregates = (
  rows: Awaited<ReturnType<typeof readMemberAggregates>>
) => {
  const empty = { ab1: 0, ab2: 0, ab3: 0, ikhwan: 0, akhwat: 0, total: 0 }
  if (rows.length === 0) return empty
  const minLevel = Math.min(...rows.map((r) => r.level))
  const anchorRow = rows.find((r) => r.level === minLevel)
  if (!anchorRow) return empty
  return {
    ab1: anchorRow.ab1,
    ab2: anchorRow.ab2,
    ab3: anchorRow.ab3,
    ikhwan: anchorRow.ikhwan,
    akhwat: anchorRow.akhwat,
    total: anchorRow.total
  }
}

const Page = async () => {
  const session = await readActiveSession()
  if (!session) return null

  const user = session.user
  const role = user.role
  const connectedOrganizationId = user.connectedOrganization?.id ?? null

  const userForScope: AccessScope = { role, connectedOrganizationId }
  const allowedOrgIds = await fetchAllowedOrgIds(userForScope)

  const showKader = ['root', 'bph', 'bpk'].includes(role)
  const showWilayah = ['root', 'bph', 'bpw'].includes(role)

  const [
    kaderAgg,
    pemandoAgg,
    instrukturAgg,
    pwCount,
    pdCount,
    pkCount,
    upcomingTrainings,
    pwDistribution,
    pdDistribution
  ] = await Promise.all([
    showKader
      ? getCachedMemberAggregates({ user: userForScope, isAlumn: false })
      : Promise.resolve([]),
    showKader
      ? getCachedMemberAggregates({
          user: userForScope,
          isCertifiedMentor: true
        })
      : Promise.resolve([]),
    showKader
      ? getCachedMemberAggregates({
          user: userForScope,
          isCertifiedInstructor: true
        })
      : Promise.resolve([]),
    showWilayah
      ? getCachedOrganizationCount({
          type: ['pw', 'pdln'],
          id: allowedOrgIds.length ? allowedOrgIds : undefined
        })
      : Promise.resolve(0),
    showWilayah
      ? getCachedOrganizationCount({
          type: ['pd'],
          id: allowedOrgIds.length ? allowedOrgIds : undefined
        })
      : Promise.resolve(0),
    showWilayah
      ? getCachedOrganizationCount({
          type: ['pk'],
          id: allowedOrgIds.length ? allowedOrgIds : undefined
        })
      : Promise.resolve(0),
    getCachedUpcomingTrainings(
      allowedOrgIds.length ? allowedOrgIds : undefined
    ),
    showKader
      ? getCachedMemberDistributionByOrgType('pw', allowedOrgIds)
      : Promise.resolve([]),
    showKader
      ? getCachedMemberDistributionByOrgType('pd', allowedOrgIds)
      : Promise.resolve([])
  ])

  const wilayahData = { pw: pwCount, pd: pdCount, pk: pkCount }

  const kaderContent = showKader ? (
    <KaderBentoStats
      data={{
        ...sumAggregates(kaderAgg),
        pemandu: sumAggregates(pemandoAgg).total,
        instruktur: sumAggregates(instrukturAgg).total
      }}
      pwDistribution={pwDistribution}
      pdDistribution={pdDistribution}
    />
  ) : null

  const wilayahContent = showWilayah ? (
    <WilayahStats data={wilayahData} />
  ) : null

  const orgName = user.connectedOrganization?.name ?? 'KAMMI Indonesia'

  return (
    <div className='flex flex-col gap-8 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      {/* Zona 1: Contextual Header */}
      <DashboardHeader
        displayName={user.displayName}
        role={role}
        orgName={orgName}
        date={new Date()}
      />

      {/* Zona 2: Stats (role-adaptive) */}
      {(kaderContent || wilayahContent) && (
        <DashboardStats
          role={role}
          kaderContent={kaderContent}
          wilayahContent={wilayahContent}
        />
      )}

      {/* Zona 3: Daurah Terdekat */}
      <UpcomingTrainings data={upcomingTrainings} />
    </div>
  )
}

export default Page
