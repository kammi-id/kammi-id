import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  getCachedOrganization,
  getCachedOrganizations,
  getCachedOrganizationCount
} from '../../_data/organizations'
import { getCachedMemberAggregates } from '../../_data/members'
import { Database01Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { MembersTable } from '../_components/members-table'
import { type Organization } from '../../_data/organizations'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { buttonVariants } from '~/components/shadcn/ui/button'

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
  const allowedRoles = ['bph', 'bpk', 'bpw', 'root']
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>
          Antum tidak memiliki akses ke halaman ini.
        </p>
      </div>
    )
  }

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

  // UI Customization based on Org Type
  let pageTitle = `Data Kader ${currentOrg.name}`
  let subTitle = `Menampilkan jumlah anggota di bawah ${currentOrg.name}.`
  let nameHeader = 'Nama Organisasi'

  if (currentOrg.type === 'pp') {
    pageTitle = 'Data Kader se-Indonesia'
    subTitle = 'Menampilkan statistik anggota dari seluruh wilayah dan daerah luar negeri.'
    nameHeader = 'PW/PDLN'
  } else if (currentOrg.type === 'pw') {
    subTitle = `Statistik anggota di wilayah ${currentOrg.name}.`
    nameHeader = 'PD/PK'
  } else if (currentOrg.type === 'pd') {
    subTitle = `Statistik anggota di daerah ${currentOrg.name}.`
    nameHeader = 'PK'
  }

  // Parse searchParams for server-side fetching
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

  // Fetch organizations that belong to this parent
  const orgFilters = {
    parentId: [currentOrg.id],
    name: query,
    limit,
    offset,
    orderBy
  }
  const [organizations, totalCount] = await Promise.all([
    getCachedOrganizations(orgFilters),
    getCachedOrganizationCount(orgFilters)
  ])
  const pageCount = Math.ceil(totalCount / limit)

  // Fetch member aggregates for these organizations
  const memberAggregates = await getCachedMemberAggregates(currentOrg.id)

  const basePath = slug && slug.length > 0 
    ? `/dashboard/members/${slug.join('/')}` 
    : '/dashboard/members'

  // Map aggregates to organizations
  const memberData = organizations.map(org => {
    const agg = memberAggregates.find(a => a.organizationId === org.id)
    return {
      ...org,
      organizationId: org.id,
      ab1: agg?.ab1 || 0,
      ab2: agg?.ab2 || 0,
      ab3: agg?.ab3 || 0,
      ikhwan: agg?.ikhwan || 0,
      akhwat: agg?.akhwat || 0,
      total: agg?.total || 0,
    }
  })

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        {slug && slug.length > 0 && (
          <Link
            href={
              slug.length === 1
                ? '/dashboard/members'
                : `/dashboard/members/${slug.slice(0, -1).join('/')}`
            }
            className={cn(
              buttonVariants({ variant: 'outline', size: 'icon' }),
              'size-10 shrink-0 rounded-xl'
            )}
          >
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              strokeWidth={2}
              className='size-5'
            />
          </Link>
        )}
        <div className='bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl'>
          <HugeiconsIcon
            icon={Database01Icon}
            strokeWidth={2}
            className='size-7'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            {pageTitle}
          </h1>
          <p className='text-muted-foreground'>{subTitle}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-8'>
        <div className='bg-card rounded-[2.5rem] border p-8 md:p-10'>
          <div className='space-y-8'>
            <div className='space-y-6'>
              <MembersTable
                data={memberData}
                nameHeader={nameHeader}
                pageCount={pageCount}
                totalCount={totalCount}
                basePath={basePath}
                userRole={user.role}
                parentOrgId={currentOrg.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MembersPage
