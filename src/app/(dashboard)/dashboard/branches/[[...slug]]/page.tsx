import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  getCachedOrganization,
  getCachedOrganizations,
  getCachedOrganizationCount
} from '../../_data/organizations'
import { Database01Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { BranchesTable } from '../_components/branches-table'
import { type Organization } from '../_components/branches-table/columns'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { buttonVariants } from '~/components/shadcn/ui/button'

interface PageProps {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const BranchesPage = async ({ params, searchParams }: PageProps) => {
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
  if (currentOrg.type === 'pk') {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>
          Halaman ini tidak tersedia untuk Pengurus Komisariat.
        </p>
      </div>
    )
  }

  // UI Customization based on Org Type
  let pageTitle = 'Daftar Wilayah'
  let subTitle = `Menampilkan wilayah di bawah ${currentOrg.name}.`
  let nameHeader = 'Nama Organisasi'
  let addButtonLabel = 'Wilayah'

  if (currentOrg.type === 'pp') {
    pageTitle = 'Daftar Pengurus Wilayah dan Daerah LN'
    subTitle =
      'Menampilkan daftar wilayah dan pengurus daerah luar negeri yang berada langsung di bawah naungan pusat.'
    nameHeader = 'PW/PDLN'
    addButtonLabel = 'PW/PDLN'
  } else if (currentOrg.type === 'pw') {
    pageTitle = 'Daftar Pengurus Daerah dan Komisariat'
    subTitle = `Daftar pengurus daerah dan komisariat yang berada di wilayah ${currentOrg.name}.`
    nameHeader = 'PD/PK'
    addButtonLabel = 'PD/PK'
  } else if (currentOrg.type === 'pd') {
    pageTitle = 'Daftar Pengurus Komisariat'
    subTitle = `Seluruh komisariat yang aktif berada di bawah naungan daerah ${currentOrg.name}.`
    nameHeader = 'PK'
    addButtonLabel = 'PK'
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

  const filters = {
    parentId: [currentOrg.id],
    name: query,
    limit,
    offset,
    orderBy
  }
  const [organizations, totalCount] = await Promise.all([
    getCachedOrganizations(filters),
    getCachedOrganizationCount(filters)
  ])
  const pageCount = Math.ceil(totalCount / limit)

  const basePath =
    slug && slug.length > 0
      ? `/dashboard/branches/${slug.join('/')}`
      : '/dashboard/branches'

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        {slug && slug.length > 0 && (
          <Link
            href={
              slug.length === 1
                ? '/dashboard/branches'
                : `/dashboard/branches/${slug.slice(0, -1).join('/')}`
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
              <BranchesTable
                data={organizations}
                nameHeader={nameHeader}
                addButtonLabel={addButtonLabel}
                pageCount={pageCount}
                totalCount={totalCount}
                parentOrg={currentOrg}
                userRole={user.role}
                basePath={basePath}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BranchesPage
