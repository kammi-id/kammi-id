'use server'

import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { readAccessScope } from '~/lib/auth/access-scope'
import { requireKekaderanAccess } from '~/lib/auth/kekaderan'
import {
  getCachedOrganization,
  getCachedOrganizations,
  getCachedOrganizationCount,
  getCachedOrganizationsByMemberTotal,
  type OrganizationKeysetCursor
} from '~/app/(dashboard)/dashboard/_data/organizations'
import { fetchAllowedOrgIds } from '~/db/query/organization'
import {
  getCachedMemberAggregates,
  getCachedDescendantMembers
} from '~/app/(dashboard)/dashboard/_data/members'
import { MembersTable } from '../members-table'
import { IndividualMemberTable } from '../individual-table'
import { MemberSectionCards } from '../member-section-cards'
import { MembersGrid, deriveMemberTotalFilters } from '../members-grid'
import { type Organization } from '~/app/(dashboard)/dashboard/_data/organizations'
import { AccessGuard } from '~/components/access-guard'

import { MembersPageHeader } from '../members-page-header'
import {
  getMembersPageLabels,
  parseMembersSearchParams
} from '../members-page-utils'
import { BulkUploadDialog } from '../bulk-upload'

interface MembersPageContentProps {
  params: { slug?: string[] }
  searchParams: { [key: string]: string | string[] | undefined }
  type: 'alumni' | 'pemandu' | 'instruktur' | 'perangkat' | undefined
  showHeader?: boolean
  pageType?: string
  noPadding?: boolean
}

export const MembersPageContent = async ({
  params,
  searchParams,
  type,
  showHeader = true,
  pageType,
  noPadding = false
}: MembersPageContentProps) => {
  const { slug } = params
  const sParams = searchParams

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

  const typeParam = typeof sParams.type === 'string' ? sParams.type : undefined
  const activeType = type || typeParam

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

  const userForScope = await readAccessScope()
  if (!userForScope) {
    redirect('/login')
  }

  // Slug datang dari URL. Sebelum halaman menyebut apa pun tentang Struktur itu
  // — judulnya, daftar anaknya, remah rotinya — pastikan ia ada di dalam
  // Cakupan Akun; di luar itu halaman tidak mengakui keberadaannya. Slug kosong
  // jatuh ke Struktur Akun sendiri, jadi tidak ada yang bisa bocor, dan
  // penolakan perannya tetap urusan AccessGuard di bawah.
  if (slug && slug.length > 0) {
    const allowed = await requireKekaderanAccess(currentOrg.id)
    if (!allowed) notFound()
  }

  if (
    (activeType === 'instruktur' || activeType === 'pemandu') &&
    currentOrg.type === 'pk'
  ) {
    notFound()
  }

  const { pageTitle, subTitle, nameHeader } = getMembersPageLabels(
    currentOrg,
    activeType
  )
  const { summary, individuals } = parseMembersSearchParams(sParams)

  const isSpecialView = ['pemandu', 'instruktur', 'perangkat'].includes(
    activeType || ''
  )
  const showSummary =
    activeType === 'alumni' || !activeType
      ? ['pp', 'pw', 'pd', 'pdln'].includes(currentOrg.type)
      : ['pp', 'pw', 'pd', 'pdln'].includes(currentOrg.type) &&
        currentOrg.type !== 'pd'

  const showIndividuals = true

  const individualsHeading =
    activeType === 'alumni'
      ? 'Daftar Alumni'
      : activeType === 'perangkat'
        ? 'Daftar Perangkat'
        : 'Daftar Kader'

  const summaryHeading =
    currentOrg.type === 'pp'
      ? 'Ringkasan per Wilayah'
      : currentOrg.type === 'pw'
        ? 'Ringkasan per Daerah'
        : currentOrg.type === 'pd' || currentOrg.type === 'pdln'
          ? 'Ringkasan per Komisariat'
          : 'Ringkasan'

  // Satu sumber untuk "Kader mana yang dihitung `total`" — dipakai baik oleh
  // batch pertama di sini maupun tiap "Muat lagi" lewat action.ts, supaya
  // urutan keyset dan agregat currentOrg sendiri (di bawah) tidak pernah
  // menghitung himpunan Kader yang berbeda.
  const memberTotalFilters = deriveMemberTotalFilters(activeType)

  // "Menampilkan X dari Y organisasi" tidak butuh urutan — cuma jumlah baris
  // yang cocok dengan pencarian/filter, jadi tetap lewat countOrganization
  // biasa, terpisah dari keyset yang mengurus urutan + cursor di bawah.
  const orgCountFilters = {
    parentId: [currentOrg.id],
    name: summary.query,
    type: summary.orgType
  }

  const mFilters = {
    user: userForScope,
    name: individuals.mQuery,
    limit: individuals.mLimit,
    offset: individuals.mOffset,
    sort: individuals.sort,
    order: individuals.order as 'asc' | 'desc',
    status: individuals.status as ('ab1' | 'ab2' | 'ab3')[] | undefined,
    gender: individuals.gender as 'ikhwan' | 'akhwat' | undefined,
    isCertifiedMentor:
      type === 'pemandu' || pageType === 'pemandu' ? true : undefined,
    isCertifiedInstructor:
      type === 'instruktur' || pageType === 'instruktur' ? true : undefined,
    isAlumn:
      type === 'alumni'
        ? true
        : type === 'pemandu' ||
            type === 'instruktur' ||
            type === 'perangkat' ||
            !type
          ? false
          : undefined
  }

  // Keyset (tiket 06): `limit + 1` supaya batch pertama sudah tahu apakah
  // "Muat lagi" punya sesuatu untuk dimuat, tanpa query hitung terpisah —
  // pola yang sama dipakai action.ts untuk tiap batch sesudahnya.
  const summaryPromise: Promise<
    [Awaited<ReturnType<typeof getCachedOrganizationsByMemberTotal>>, number]
  > = showSummary
    ? Promise.all([
        getCachedOrganizationsByMemberTotal(
          {
            parentId: currentOrg.id,
            name: summary.query,
            type: summary.orgType,
            ...memberTotalFilters
          },
          { limit: summary.limit + 1 }
        ),
        getCachedOrganizationCount(orgCountFilters)
      ])
    : Promise.resolve([[], 0] as [
        Awaited<ReturnType<typeof getCachedOrganizationsByMemberTotal>>,
        number
      ])

  const aggregatesPromise = getCachedMemberAggregates({
    user: userForScope,
    organizationId: currentOrg.id,
    ...memberTotalFilters
  })

  const individualsPromise: Promise<
    [import('~/db/query/member').Member[], number]
  > = showIndividuals
    ? getCachedDescendantMembers(currentOrg.id, mFilters)
    : Promise.resolve([[], 0] as [import('~/db/query/member').Member[], number])

  const [
    [orgRowsWithProbe, totalCount],
    [mMembers, mTotalCount],
    memberAggregates
  ] = await Promise.all([summaryPromise, individualsPromise, aggregatesPromise])

  // Batch pertama Daftar Struktur — keyset, bukan offset (tiket 06). Baris
  // ke-(limit+1), kalau ada, cuma penanda "masih ada lagi"; ia dibuang, tak
  // pernah dirender.
  const initialHasMore = orgRowsWithProbe.length > summary.limit
  const organizations = initialHasMore
    ? orgRowsWithProbe.slice(0, summary.limit)
    : orgRowsWithProbe
  const lastOrgRow = organizations[organizations.length - 1]
  const initialCursor: OrganizationKeysetCursor | null = lastOrgRow
    ? { total: lastOrgRow.total, id: lastOrgRow.id }
    : null

  // Calculate tier summaries. `org.total` datang langsung dari keyset di
  // atas — sudah agregat rekursif yang sama persis yang menentukan
  // urutannya, jadi tidak perlu dicari lagi lewat memberAggregates.
  const tierSummaries = ['pp', 'pw', 'pd', 'pdln', 'pk'].map((type) => {
    const orgsOfType = organizations.filter((o) => o.type === type)
    const totalMembers = orgsOfType.reduce((acc, org) => acc + org.total, 0)
    return {
      type,
      count: orgsOfType.length,
      totalMembers
    }
  })

  // Fetch all allowed organizations for the member form
  const allActiveOrgs = await getCachedOrganizations({ isNonActive: false })
  const allowedOrgIds = await fetchAllowedOrgIds(userForScope)
  const allowedOrganizations = allActiveOrgs.filter((org) =>
    allowedOrgIds.includes(org.id)
  )

  const pageCount = Math.ceil(totalCount / summary.limit)
  const mPageCount = Math.ceil(mTotalCount / individuals.mLimit)

  const overallAggregate = memberAggregates.find(
    (a) => a.organizationId === currentOrg.id
  )

  const typePath =
    activeType === 'pemandu'
      ? 'pemandu'
      : activeType === 'instruktur'
        ? 'instruktur'
        : activeType === 'alumni'
          ? 'alumni'
          : activeType === 'perangkat'
            ? 'perangkat'
            : 'kader'
  const basePath =
    slug && slug.length > 0
      ? `/dashboard/${typePath}/${slug.join('/')}`
      : `/dashboard/${typePath}`

  // ab1/ab2/ab3/ikhwan/akhwat/total sudah melekat di tiap baris lewat
  // keyset di atas — dihitung dengan `memberTotalFilters` yang sama, jadi
  // tidak perlu dicocokkan lagi lewat memberAggregates seperti sebelumnya.
  const memberData = organizations.map((org) => ({
    ...org,
    organizationId: org.id,
    pemandu: 0,
    instruktur: 0
  }))

  const renderSummary = () => (
    <div className='bg-card rounded-xl border p-6 shadow-xs'>
      <MembersTable
        data={memberData}
        nameHeader={nameHeader}
        pageCount={pageCount}
        totalCount={totalCount}
        basePath={basePath}
        type={activeType}
      />
    </div>
  )

  const renderIndividuals = () => (
    <div className='bg-card rounded-xl border p-6 shadow-xs'>
      <IndividualMemberTable
        data={mMembers}
        pageCount={mPageCount}
        totalCount={mTotalCount}
        userRole={user.role}
        parentOrgId={currentOrg.id}
        type={activeType}
        organizations={allowedOrganizations.map((org) => ({
          id: org.id,
          name: org.name,
          type: org.type,
          parentId: org.parentId
        }))}
      />
    </div>
  )

  return (
    <AccessGuard allowedRoles={['root', 'bph', 'bpk']} levelRequirement={4}>
      <div
        className={`flex min-h-screen flex-col space-y-10 ${noPadding ? '' : 'px-4 py-6 md:px-6 md:py-8 lg:px-8'}`}
      >
        {showHeader && (
          <MembersPageHeader
            slug={slug}
            pageTitle={pageTitle}
            subTitle={subTitle}
            typePath={typePath}
          />
        )}
        {user.role === 'bpk' && currentOrg && (
          <div className='flex justify-end'>
            <BulkUploadDialog organizationId={currentOrg.id} />
          </div>
        )}

        <div className='space-y-10'>
          {overallAggregate && !isSpecialView && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
              <MemberSectionCards data={overallAggregate} type={activeType} />
            </div>
          )}

          {showIndividuals && (
            <section aria-label={individualsHeading} className='space-y-3'>
              <h2 className='font-heading text-foreground text-base font-semibold'>
                {individualsHeading}
              </h2>
              <div className='bg-card rounded-xl border p-4 shadow-xs'>
                <IndividualMemberTable
                  data={mMembers}
                  pageCount={mPageCount}
                  totalCount={mTotalCount}
                  userRole={user.role}
                  parentOrgId={currentOrg.id}
                  type={activeType}
                  orgType={currentOrg.type}
                  organizations={allowedOrganizations.map((org) => ({
                    id: org.id,
                    name: org.name,
                    type: org.type,
                    parentId: org.parentId
                  }))}
                />
              </div>
            </section>
          )}
          {showSummary && (
            <section aria-label={summaryHeading} className='space-y-3'>
              <h2 className='font-heading text-foreground text-base font-semibold'>
                {summaryHeading}
              </h2>
              <MembersGrid
                // Kunci diturunkan dari identitas query (Struktur, rute, kata
                // kunci, filter jenis) — bukan sekadar `currentOrg.id`. Grid
                // menyimpan batch yang sudah dimuat di state internal
                // (`useState`), yang menurut React tidak otomatis mengikuti
                // prop `data` baru saat searchParams berubah pada rute yang
                // sama. Kunci yang berubah memaksa remount bersih persis saat
                // pencarian/filter berubah; kunci yang tetap sama (navigasi
                // ke detail Kader lalu kembali) membiarkan Activity Next.js
                // memulihkan state + posisi gulir apa adanya (tiket 06).
                key={`${currentOrg.id}-${activeType ?? ''}-${summary.query ?? ''}-${(summary.orgType ?? []).join(',')}`}
                data={memberData}
                basePath={basePath}
                organizationId={currentOrg.id}
                totalCount={totalCount}
                batchSize={summary.limit}
                initialCursor={initialCursor}
                initialHasMore={initialHasMore}
                type={activeType}
                currentSearch={summary.query ?? ''}
                currentOrgTypes={summary.orgType ?? []}
                parentOrgType={currentOrg.type}
              />
            </section>
          )}
        </div>
      </div>
    </AccessGuard>
  )
}
