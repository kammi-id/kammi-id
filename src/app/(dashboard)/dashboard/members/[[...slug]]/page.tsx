import { AccessGuard } from '~/components/access-guard'
import { notFound, redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  getCachedOrganization,
  getCachedOrganizations,
  getCachedOrganizationCount
} from '../../_data/organizations'
import {
  getCachedMemberAggregates,
  getCachedDescendantMembers
} from '../../_data/members'
import { Database01Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { MembersTable } from '../_components/members-table'
import { IndividualMemberTable } from '../_components/individual-table'
import { MemberSectionCards } from '../_components/member-section-cards'
import { type Organization } from '../../_data/organizations'
import { type Member, type MemberAggregatesResult } from '~/db/query/member'
import { type IndividualMember } from '../_components/individual-table'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { buttonVariants } from '~/components/shadcn/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '~/components/shadcn/ui/tabs'

interface PageProps {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const MembersPage = async ({ params, searchParams }: PageProps) => {
  const { slug } = await params
  const sParams = await searchParams

  const session = await readActiveSession()
  if (!session) {
    redirect('/login')
  }

  const user = session.user
  if (!user) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>Pengguna tidak ditemukan.</p>
      </div>
    )
  }

  const type = typeof sParams.type === 'string' ? sParams.type : undefined

  let currentOrg: Organization | undefined

  if (!slug || slug.length === 0) {
    if (user.connectedOrganization) {
      currentOrg = user.connectedOrganization
    }
  } else {
    const lastSlug = slug[slug.length - 1]
    const org = await getCachedOrganization(lastSlug)
    currentOrg = org
  }

  if (!currentOrg) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>Wilayah tidak ditemukan.</p>
      </div>
    )
  }

  if ((type === 'instruktur' || type === 'pemandu') && currentOrg.type === 'pk') {
    notFound()
  }

  // UI Customization based on Org Type
  const typeLabel =
    type === 'pemandu'
      ? 'Data Pemandu'
      : type === 'instruktur'
      ? 'Data Instruktur'
      : type === 'alumni'
      ? 'Data Alumni'
      : 'Data Kader'

  const typeSubLabel =
    type === 'pemandu'
      ? 'pemandu'
      : type === 'instruktur'
      ? 'instruktur'
      : type === 'alumni'
      ? 'alumni'
      : 'anggota'

  let pageTitle = `${typeLabel} ${currentOrg.name}`
  let subTitle = `Menampilkan jumlah ${typeSubLabel} di bawah ${currentOrg.name}.`
  let nameHeader = 'Nama Organisasi'

  if (currentOrg.type === 'pp') {
    pageTitle = `${typeLabel} se-Indonesia`
    subTitle =
      `Menampilkan statistik ${typeSubLabel} dari seluruh wilayah dan daerah luar negeri.`
    nameHeader = 'PW/PDLN'
  } else if (currentOrg.type === 'pw') {
    subTitle = `Statistik ${typeSubLabel} di wilayah ${currentOrg.name}.`
    nameHeader = 'PD/PK'
  } else if (currentOrg.type === 'pd') {
    subTitle = `Statistik ${typeSubLabel} di daerah ${currentOrg.name}.`
    nameHeader = 'PK'
  }

  // Parse searchParams for "Ringkasan Struktur" (prefix: none)
  const query = typeof sParams.q === 'string' ? sParams.q : undefined
  const page =
    typeof sParams.page === 'string' ? Math.max(1, parseInt(sParams.page)) : 1
  const limit = typeof sParams.size === 'string' ? parseInt(sParams.size) : 10
  const offset = (page - 1) * limit

  let orderBy:
    | { column: keyof Organization; direction: 'asc' | 'desc' }[]
    | undefined
  if (typeof sParams.sort === 'string') {
    const [col, dir] = sParams.sort.split('.')
    if (col && (dir === 'asc' || dir === 'desc')) {
      orderBy = [{ column: col as keyof Organization, direction: dir }]
    }
  }

  // Parse searchParams for "Daftar Kader" (prefix: m)
  const mQuery = typeof sParams.mq === 'string' ? sParams.mq : undefined
  const mPage =
    typeof sParams.mpage === 'string' ? Math.max(1, parseInt(sParams.mpage)) : 1
  const mLimit =
    typeof sParams.msize === 'string' ? parseInt(sParams.msize) : 10
  const mOffset = (mPage - 1) * mLimit

  // Fetch logic based on Org Type
  const isSpecialView = type === 'pemandu' || type === 'instruktur'
  const showSummary = (type === 'alumni' || !type)
    ? ['pp', 'pw', 'pd', 'pdln'].includes(currentOrg.type)
    : ['pp', 'pw', 'pd', 'pdln'].includes(currentOrg.type) && currentOrg.type !== 'pd'

  const showIndividuals = ['pd', 'pdln', 'pk'].includes(currentOrg.type) || (isSpecialView && currentOrg.type === 'pw')
  if (isSpecialView && currentOrg.type === 'pk') {
    // This is already handled by notFound() above, but for safety
    // we can keep showIndividuals = false or just rely on notFound()
  }


  const orgFilters = {
    parentId: [currentOrg.id],
    name: query,
    limit,
    offset,
    orderBy
  }

  const mFilters = {
    name: mQuery,
    limit: mLimit,
    offset: mOffset,
    isCertifiedMentor: type === 'pemandu',
    isCertifiedInstructor: type === 'instruktur',
    isAlumn: type === 'alumni'
  }


  const summaryPromise = showSummary
    ? Promise.all([
        getCachedOrganizations(orgFilters),
        getCachedOrganizationCount(orgFilters)
      ])
    : Promise.resolve([[], 0])

  const aggregatesPromise = getCachedMemberAggregates({
    organizationId: currentOrg.id,
    isCertifiedMentor: type === 'pemandu',
    isCertifiedInstructor: type === 'instruktur',
    isAlumn: type === 'alumni'
  })

  const individualsPromise = showIndividuals
    ? getCachedDescendantMembers(currentOrg.id, mFilters)
    : Promise.resolve([[], 0])

  const [
    [organizations, totalCount],
    [mMembers, mTotalCount],
    memberAggregates
  ] = await Promise.all([summaryPromise, individualsPromise, aggregatesPromise])

  const pageCount = Math.ceil(totalCount / limit)
  const mPageCount = Math.ceil(mTotalCount / mLimit)

  const overallAggregate = memberAggregates.find(
    (a) => a.organizationId === currentOrg.id
  )

  const basePath =
    slug && slug.length > 0
      ? `/dashboard/members/${slug.join('/')}`
      : '/dashboard/members'

  // Map aggregates to organizations (only if summary is shown)
  const memberData = organizations.map((org) => {
    const agg = memberAggregates.find(
      (a) => a.organizationId === org.id
    )
    return {
      ...org,
      organizationId: org.id,
      ab1: agg?.ab1 || 0,
      ab2: agg?.ab2 || 0,
      ab3: agg?.ab3 || 0,
      ikhwan: agg?.ikhwan || 0,
      akhwat: agg?.akhwat || 0,
      total: agg?.total || 0
    }
  })

  const activeTab =
    typeof sParams.tab === 'string'
      ? sParams.tab
      : showIndividuals && !showSummary
        ? 'individuals'
        : 'members'

  const individualsLabel = type === 'pemandu'
    ? 'Daftar Pemandu'
    : type === 'instruktur'
    ? 'Daftar Instruktur'
    : 'Daftar Kader'

  const renderSummary = () => (
    <div className='bg-card rounded-3xl border p-6 shadow-xs md:p-8 lg:p-10'>
      <MembersTable
        data={memberData}
        nameHeader={nameHeader}
        pageCount={pageCount}
        totalCount={totalCount}
        basePath={basePath}
        type={type}
      />
    </div>
  )

  const renderIndividuals = () => (
    <div className='bg-card rounded-3xl border p-6 shadow-xs md:p-8 lg:p-10'>
      <IndividualMemberTable
        data={mMembers as IndividualMember[]}
        pageCount={mPageCount}
        totalCount={mTotalCount}
        userRole={user.role}
        parentOrgId={currentOrg.id}
        type={type}
      />
    </div>
  )

  return (
    <AccessGuard allowedRoles={['root', 'bph', 'bpk']} levelRequirement={2}>
      <div className='flex min-h-screen flex-col space-y-12 px-4 py-8 md:px-6 md:py-10 lg:px-8'>
        <div className='flex items-center gap-6'>
          {slug && slug.length > 0 && (
            <Link
              href={
                slug.length === 1
                  ? '/dashboard/members'
                  : `/dashboard/members/${slug.slice(0, -1).join('/')}`
              }
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon' }),
                'hover:bg-primary hover:text-primary-foreground size-11 shrink-0 rounded-2xl transition-all'
              )}
            >
              <HugeiconsIcon
                icon={ArrowLeft02Icon}
                strokeWidth={2}
                className='size-5'
              />
            </Link>
          )}
          <div className='flex items-center gap-5'>
            <div className='bg-primary/10 text-primary ring-primary/5 flex size-14 items-center justify-center rounded-2xl ring-4'>
              <HugeiconsIcon
                icon={Database01Icon}
                strokeWidth={2}
                className='size-8'
              />
            </div>
            <div>
              <h1 className='font-heading text-3xl font-extrabold tracking-tight sm:text-4xl'>
                {pageTitle}
              </h1>
              <p className='text-muted-foreground max-w-2xl leading-relaxed'>
                {subTitle}
              </p>
            </div>
          </div>
        </div>

        <div className='space-y-10'>
          {overallAggregate && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
              <MemberSectionCards data={overallAggregate} type={type} />
            </div>
          )}


          {showSummary && showIndividuals ? (
            <Tabs value={activeTab} className='space-y-8'>
              <TabsList className='bg-background w-full justify-start rounded-none border-b p-0'>
                <TabsTrigger
                  value='members'
                  className='data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-semibold shadow-none transition-none data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                  render={<Link href={`${basePath}?tab=members`} />}
                >
                  Ringkasan Struktur
                </TabsTrigger>
                <TabsTrigger
                  value='individuals'
                  className='data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pt-2 pb-3 font-semibold shadow-none transition-none data-[state=active]:bg-transparent data-[state=active]:shadow-none'
                  render={<Link href={`${basePath}?tab=individuals${type ? `&type=${type}` : ''}`} />}
                >
                  Daftar Kader
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value='members'
                className='m-0 border-none p-0 outline-none'
              >
                {renderSummary()}
              </TabsContent>

              <TabsContent
                value='individuals'
                className='m-0 border-none p-0 outline-none'
              >
                {renderIndividuals()}
              </TabsContent>
            </Tabs>
          ) : (
            <div className='space-y-12'>
              {showSummary && renderSummary()}
              {showIndividuals && renderIndividuals()}
            </div>
          )}
        </div>
      </div>
    </AccessGuard>
  )
}

export default MembersPage
