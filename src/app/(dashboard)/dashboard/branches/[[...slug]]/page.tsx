import { AccessGuard } from '~/components/access-guard'
import { notFound, redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  getCachedOrganizations,
  getCachedOrganizationCount
} from '../../_data/organizations'
import { Globe02Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { BranchesGrid } from '../_components/branches-grid'
import {
  type Organization,
  type StrukturRow
} from '../_components/struktur-row'
import {
  canManageKestrukturan,
  isLegalChildType,
  requireKestrukturanReadAccess,
  type StrukturJenjang
} from '~/lib/auth/kestrukturan'
import { strukturKemampuan } from '~/lib/struktur/kemampuan'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { buttonVariants } from '~/components/shadcn/ui/button'
import {
  BranchDetailView,
  readAuthorizedBranchDetail
} from '../_components/branch-detail'

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

  if (slug?.length) {
    const detail = await readAuthorizedBranchDetail(slug)
    if (!detail) notFound()

    return (
      <AccessGuard allowedRoles={['root', 'bph', 'bpw']}>
        <BranchDetailView detail={detail} />
      </AccessGuard>
    )
  }

  const currentOrg: Organization | undefined = user.connectedOrganization

  if (!currentOrg) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>Wilayah tidak ditemukan.</p>
      </div>
    )
  }
  // Cakupan ditegakkan pada slug yang diterima halaman ini, lewat gate yang
  // sudah ada — bukan gate baru. Slug di luar Cakupan dijawab persis seperti
  // slug yang tidak pernah ada (spec §1.4), jadi jawabannya tidak bocor bahwa
  // Struktur itu ada.
  const scope = await requireKestrukturanReadAccess(currentOrg.id)
  if (!scope) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>Wilayah tidak ditemukan.</p>
      </div>
    )
  }

  // UI Customization based on Org Type
  let pageTitle = 'Daftar Wilayah'
  let subTitle = `Menampilkan wilayah di bawah ${currentOrg.name}.`
  let addButtonLabel = 'Wilayah'

  if (currentOrg.type === 'pp') {
    pageTitle = 'Daftar Pengurus Wilayah dan Daerah LN'
    subTitle =
      'Menampilkan daftar wilayah dan pengurus daerah luar negeri yang berada langsung di bawah naungan pusat.'
    addButtonLabel = 'PW/PDLN'
  } else if (currentOrg.type === 'pw') {
    pageTitle = 'Daftar Pengurus Daerah dan Komisariat'
    subTitle = `Daftar pengurus daerah dan komisariat yang berada di wilayah ${currentOrg.name}.`
    addButtonLabel = 'PD/PK'
  } else if (currentOrg.type === 'pd') {
    pageTitle = 'Daftar Pengurus Komisariat'
    subTitle = `Seluruh komisariat yang aktif berada di bawah naungan daerah ${currentOrg.name}.`
    addButtonLabel = 'PK'
  } else if (currentOrg.type === 'pk') {
    pageTitle = 'Struktur Anak'
    subTitle = `${currentOrg.name} tidak memiliki Struktur Anak.`
    addButtonLabel = 'Struktur Anak'
  }

  // Parse searchParams for server-side fetching
  const query = typeof sParams.q === 'string' ? sParams.q : undefined
  const page =
    typeof sParams.page === 'string' ? Math.max(1, parseInt(sParams.page)) : 1
  const limit = typeof sParams.size === 'string' ? parseInt(sParams.size) : 12
  const offset = (page - 1) * limit

  let orderBy:
    | { column: keyof Organization; direction: 'asc' | 'desc' }[]
    | undefined
  if (typeof sParams.sort === 'string') {
    const [col, dir] = sParams.sort.split('.')
    if (col && (dir === 'asc' || dir === 'desc')) {
      if (currentOrg && Object.prototype.hasOwnProperty.call(currentOrg, col)) {
        orderBy = [{ column: col as keyof Organization, direction: dir }]
      }
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

  // **Kemampuan dihitung sekali di server, per baris** (spec §8). Kartu, kolom
  // tabel, dan item sheet merender afordansi dari bendera ini dan tidak pernah
  // menurunkannya sendiri dari `role` — yang persis kebocoran yang dulu membuat
  // pensil Edit tidak di-gate sama sekali.
  //
  // Nol query tambahan: matriksnya fungsi murni, dan tiap baris di sini sudah
  // pasti di dalam Cakupan karena ia anak dari Struktur yang gate di atas
  // loloskan.
  const jenjangAkun = (user.connectedOrganization?.type ??
    null) as StrukturJenjang | null
  // Peran dan Struktur terhubung dibaca dari `scope` yang gate kembalikan, bukan
  // dirakit ulang dari sesi di sini — AGENTS.md melarang menurunkan pasangan itu
  // di call site. Jenjang Akun bukan bagian dari `AccessScope`, jadi ia satu-
  // satunya yang masih datang dari sesi.
  const actor = {
    role: scope.role,
    jenjangAkun,
    connectedOrganizationId: scope.connectedOrganizationId
  }
  const rows: StrukturRow[] = organizations.map((org) => ({
    ...org,
    kemampuan: strukturKemampuan(actor, org)
  }))

  const canAdd = (['pw', 'pdln', 'pd', 'pk'] as const).some(
    (childType) =>
      isLegalChildType(currentOrg.type, childType) &&
      canManageKestrukturan(scope.role, jenjangAkun, childType, 'buat')
  )

  const basePath =
    slug && slug.length > 0
      ? `/dashboard/branches/${slug.join('/')}`
      : '/dashboard/branches'

  return (
    <AccessGuard allowedRoles={['root', 'bph', 'bpw']}>
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
          <div className='bg-primary/10 text-primary ring-primary/5 flex size-14 shrink-0 items-center justify-center rounded-full ring-4'>
            <HugeiconsIcon
              icon={Globe02Icon}
              strokeWidth={2}
              className='size-7'
            />
          </div>
          <div>
            <h1 className='font-heading text-3xl font-bold tracking-tight'>
              {pageTitle}
            </h1>
            <p className='text-muted-foreground leading-relaxed'>{subTitle}</p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8'>
          <div className='bg-card border-border rounded-lg border p-6 shadow-sm md:p-8 lg:p-10'>
            <div className='space-y-8'>
              <div className='space-y-6'>
                <BranchesGrid
                  data={rows}
                  basePath={basePath}
                  pageCount={pageCount}
                  totalCount={totalCount}
                  addButtonLabel={addButtonLabel}
                  canAdd={canAdd}
                  parentOrg={currentOrg}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  )
}

export default BranchesPage
