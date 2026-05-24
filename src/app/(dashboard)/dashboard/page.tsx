import { readActiveSession } from '~/lib/auth/cookies'
import { fetchAllowedOrgIds } from '~/db/query/organization'
import { readMemberAggregates } from '~/db/query/member'
import { getCachedMemberYearDistribution } from './_data/members'
import { getCachedOrganizationCount } from './_data/organizations'
import { getCachedUpcomingTrainings } from './_data/trainings'
import { KaderStats, type KaderStatsData } from './_components/kader-stats'
import { KaderChart } from './_components/kader-chart'
import { WilayahStats } from './_components/wilayah-stats'
import { UpcomingTrainings } from './_components/upcoming-trainings'
import { DashboardTabs } from './_components/dashboard-tabs'

const sumAggregates = (
  rows: Awaited<ReturnType<typeof readMemberAggregates>>
) =>
  rows.reduce(
    (acc, r) => ({
      ab1: acc.ab1 + r.ab1,
      ab2: acc.ab2 + r.ab2,
      ab3: acc.ab3 + r.ab3,
      ikhwan: acc.ikhwan + r.ikhwan,
      akhwat: acc.akhwat + r.akhwat,
      total: acc.total + r.total
    }),
    { ab1: 0, ab2: 0, ab3: 0, ikhwan: 0, akhwat: 0, total: 0 }
  )

const Page = async () => {
  const session = await readActiveSession()
  if (!session) return null

  const user = session.user
  const role = user.role
  const connectedOrganizationId = user.connectedOrganization?.id ?? null

  const userForScope = { role, connectedOrganizationId }
  const allowedOrgIds = await fetchAllowedOrgIds(userForScope)

  const showKader = ['root', 'bph', 'bpk'].includes(role)
  const showWilayah = ['root', 'bph', 'bpw'].includes(role)
  const showTabs = ['root', 'bph'].includes(role)

  const [
    kaderAgg,
    pemandoAgg,
    instrukturAgg,
    alumniAgg,
    yearDist,
    pwCount,
    pdCount,
    pkCount,
    upcomingTrainings
  ] = await Promise.all([
    showKader
      ? readMemberAggregates({ user: userForScope })
      : Promise.resolve([]),
    showKader
      ? readMemberAggregates({ user: userForScope, isCertifiedMentor: true })
      : Promise.resolve([]),
    showKader
      ? readMemberAggregates({ user: userForScope, isCertifiedInstructor: true })
      : Promise.resolve([]),
    showKader
      ? readMemberAggregates({ user: userForScope, isAlumn: true })
      : Promise.resolve([]),
    showKader
      ? getCachedMemberYearDistribution(allowedOrgIds)
      : Promise.resolve([]),
    showWilayah
      ? getCachedOrganizationCount({ type: ['pw', 'pdln'], id: allowedOrgIds.length ? allowedOrgIds : undefined })
      : Promise.resolve(0),
    showWilayah
      ? getCachedOrganizationCount({ type: ['pd'], id: allowedOrgIds.length ? allowedOrgIds : undefined })
      : Promise.resolve(0),
    showWilayah
      ? getCachedOrganizationCount({ type: ['pk'], id: allowedOrgIds.length ? allowedOrgIds : undefined })
      : Promise.resolve(0),
    getCachedUpcomingTrainings(allowedOrgIds.length ? allowedOrgIds : undefined)
  ])

  const kaderData: KaderStatsData = {
    ...sumAggregates(kaderAgg),
    pemandu: sumAggregates(pemandoAgg).total,
    instruktur: sumAggregates(instrukturAgg).total,
    alumni: sumAggregates(alumniAgg).total
  }

  const wilayahData = { pw: pwCount, pd: pdCount, pk: pkCount }

  const kaderSection = showKader ? (
    <div className='flex flex-col gap-4'>
      <KaderStats data={kaderData} />
      <KaderChart data={yearDist} />
    </div>
  ) : null

  const wilayahSection = showWilayah ? (
    <WilayahStats data={wilayahData} />
  ) : null

  return (
    <div className='flex flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight'>Ringkasan</h1>
        <p className='mt-0.5 text-sm text-muted-foreground'>
          {user.connectedOrganization?.name ?? 'KAMMI Indonesia'}
        </p>
      </div>

      {/* Stats section — tabs for BPH, direct for BPK/BPW */}
      {showTabs ? (
        <DashboardTabs
          kaderContent={kaderSection}
          wilayahContent={wilayahSection}
        />
      ) : (
        <>
          {kaderSection}
          {wilayahSection}
        </>
      )}

      {/* Upcoming trainings — always shown if user has scope */}
      <UpcomingTrainings data={upcomingTrainings} />
    </div>
  )
}

export default Page
