import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Perangkat Pengkaderan | KAMMI.id',
  description: 'Daftar pemandu dan instruktur kaderisasi KAMMI.'
}

import { MembersPageContent } from '../../kader/_components/members-page-content'
import { AccessGuard } from '~/components/access-guard/access-guard'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '~/components/shadcn/ui/tabs'
import { MembersPageHeader } from '../../kader/_components/members-page-header/members-page-header'
import { SpecialistSummaryCards } from '../../kader/_components/specialist-summary-cards'
import { getCachedOrganization } from '../../_data/organizations'
import { getCachedMemberAggregates } from '../../_data/members'
import { readActiveSession } from '~/lib/auth/cookies'
import { redirect } from 'next/navigation'

async function Page({
  params,
  searchParams
}: {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { slug } = resolvedParams
  let currentOrg
  if (!slug || slug.length === 0) {
    currentOrg = session.user?.connectedOrganization
  } else {
    currentOrg = await getCachedOrganization(slug[slug.length - 1])
  }

  if (!currentOrg) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>Wilayah tidak ditemukan.</p>
      </div>
    )
  }

  // Fetch counts for the summary cards
  const [pemanduAgg, instrukturAgg] = await Promise.all([
    getCachedMemberAggregates({
      organizationId: currentOrg.id,
      isCertifiedMentor: true,
      isAlumn: false
    }),
    getCachedMemberAggregates({
      organizationId: currentOrg.id,
      isCertifiedInstructor: true,
      isAlumn: false
    })
  ])

  const pemanduCount =
    pemanduAgg.find((a) => a.organizationId === currentOrg.id)?.total || 0
  const instrukturCount =
    instrukturAgg.find((a) => a.organizationId === currentOrg.id)?.total || 0

  return (
    <AccessGuard allowedRoles={['root', 'bpk']}>
      <SpecialistsWrapper
        params={resolvedParams}
        searchParams={resolvedSearchParams}
        pemanduCount={pemanduCount}
        instrukturCount={instrukturCount}
      />
    </AccessGuard>
  )
}

function SpecialistsWrapper({
  params,
  searchParams,
  pemanduCount,
  instrukturCount
}: {
  params: { slug?: string[] }
  searchParams: { [key: string]: string | string[] | undefined }
  pemanduCount: number
  instrukturCount: number
}) {
  return (
    <div className='space-y-10 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      <MembersPageHeader
        slug={params.slug}
        pageTitle='Perangkat Pengkaderan'
        subTitle='Manajemen perangkat pengkaderan untuk membantu rekrutmen dan pengembangan kader'
        typePath='perangkat'
      />

      <div className='space-y-10'>
        <SpecialistSummaryCards
          pemanduCount={pemanduCount}
          instrukturCount={instrukturCount}
        />

        <div>
          <Tabs
            defaultValue={
              (typeof searchParams.type === 'string'
                ? searchParams.type
                : 'pemandu') as 'pemandu' | 'instruktur'
            }
            className='space-y-6'
          >
            <div className='flex items-center justify-between'>
              <TabsList className='grid w-full max-w-[400px] grid-cols-2'>
                <TabsTrigger value='pemandu'>Pemandu</TabsTrigger>
                <TabsTrigger value='instruktur'>Instruktur</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value='pemandu'
              className='mt-0 focus-visible:outline-none'
            >
              <MembersPageContent
                params={params}
                searchParams={searchParams}
                type='perangkat'
                pageType='pemandu'
                showHeader={false}
                noPadding
              />
            </TabsContent>

            <TabsContent
              value='instruktur'
              className='mt-0 focus-visible:outline-none'
            >
              <MembersPageContent
                params={params}
                searchParams={searchParams}
                type='perangkat'
                pageType='instruktur'
                showHeader={false}
                noPadding
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Page
