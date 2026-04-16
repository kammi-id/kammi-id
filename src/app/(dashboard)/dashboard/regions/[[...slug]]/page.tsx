import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { readUser } from '~/db/query/user'
import { readOrganization, countOrganization } from '~/db/query/organization'
import { Database01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { RegionsTable } from '../_components/regions-table'
import { type Organization } from '../_components/columns'

interface PageProps {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const RegionsPage = async ({ params, searchParams }: PageProps) => {
  const { slug } = await params
  const sParams = await searchParams

  const session = await readActiveSession()
  if (!session) {
    redirect('/login')
  }

  const [user] = await readUser({ id: [session.userId] })
  if (!user) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>Pengguna tidak ditemukan.</p>
      </div>
    )
  }

  let currentOrg: Organization | undefined

  if (!slug || slug.length === 0) {
    if (user.connectedOrganizationId) {
      const [org] = await readOrganization({
        id: [user.connectedOrganizationId]
      })
      currentOrg = org
    }
  } else {
    const lastSlug = slug[slug.length - 1]
    const [org] = await readOrganization({ slug: lastSlug })
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
    | { column: keyof Organization; direction: 'asc' | 'desc' }
    | undefined
  if (typeof sParams.sort === 'string') {
    const [col, dir] = sParams.sort.split('.')
    if (col && (dir === 'asc' || dir === 'desc')) {
      orderBy = { column: col as keyof Organization, direction: dir }
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
    readOrganization(filters),
    countOrganization(filters)
  ])

  const pageCount = Math.ceil(totalCount / limit)

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
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
              <RegionsTable
                data={organizations}
                nameHeader={nameHeader}
                addButtonLabel={addButtonLabel}
                pageCount={pageCount}
                totalCount={totalCount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegionsPage
