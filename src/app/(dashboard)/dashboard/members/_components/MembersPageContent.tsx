'use server'

import React from 'react'
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
import { MembersTable } from './members-table'
import { IndividualMemberTable } from './individual-table'
import { MemberSectionCards } from './member-section-cards'
import { type Organization } from '../_data/organizations'
import { AccessGuard } from '~/components/access-guard'

import { MembersPageHeader } from './members-page-header'
import { MembersPageTabs } from './members-page-tabs'
import {
  getMembersPageLabels,
  parseMembersSearchParams
} from './members-page-utils'

interface MembersPageContentProps {
  params: { slug?: string[] }
  searchParams: { [key: string]: string | string[] | undefined }
  type: 'alumni' | 'pemandu' | 'instruktur' | undefined
}

export const MembersPageContent = async ({
  params,
  searchParams,
  type
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

  if (
    (activeType === 'instruktur' || activeType === 'pemandu') &&
    currentOrg.type === 'pk'
  ) {
    notFound()
  }

  const { pageTitle, subTitle, nameHeader } = getMembersPageLabels(
    activeType,
    currentOrg
  )
  const { summary, individuals } = parseMembersSearchParams(sParams)

  const isSpecialView = activeType === 'pemandu' || activeType === 'instruktur'
  const showSummary =
    activeType === 'alumni' || !activeType
      ? ['pp', 'pw', 'pd', 'pdln'].includes(currentOrg.type)
      : ['pp', 'pw', 'pd', 'pdln'].includes(currentOrg.type) &&
        currentOrg.type !== 'pd'

  const showIndividuals =
    ['pd', 'pdln', 'pk'].includes(currentOrg.type) ||
    (isSpecialView && currentOrg.type === 'pw')

  const orgFilters = {
    parentId: [currentOrg.id],
    name: summary.query,
    limit: summary.limit,
    offset: summary.offset,
    orderBy: summary.orderBy
  }

  const mFilters = {
    name: individuals.mQuery,
    limit: individuals.mLimit,
    offset: individuals.mOffset,
    isCertifiedMentor: activeType === 'pemandu' ? true : undefined,
    isCertifiedInstructor: activeType === 'instruktur' ? true : undefined,
    isAlumn:
      activeType === 'alumni'
        ? true
        : activeType === 'pemandu' || activeType === 'instruktur' || !activeType
          ? false
          : undefined
  }

  const summaryPromise = showSummary
    ? Promise.all([
        getCachedOrganizations(orgFilters),
        getCachedOrganizationCount(orgFilters)
      ])
    : Promise.resolve([[], 0])

  const aggregatesPromise = getCachedMemberAggregates({
    organizationId: currentOrg.id,
    isCertifiedMentor: activeType === 'pemandu' ? true : undefined,
    isCertifiedInstructor: activeType === 'instruktur' ? true : undefined,
    isAlumn:
      activeType === 'alumni'
        ? true
        : activeType === 'pemandu' || activeType === 'instruktur' || !activeType
          ? false
          : undefined
  })

  const individualsPromise = showIndividuals
    ? getCachedDescendantMembers(currentOrg.id, mFilters)
    : Promise.resolve([[], 0])

  const [
    [organizations, totalCount],
    [mMembers, mTotalCount],
    memberAggregates
  ] = await Promise.all([summaryPromise, individualsPromise, aggregatesPromise])

  const pageCount = Math.ceil(totalCount / summary.limit)
  const mPageCount = Math.ceil(mTotalCount / individuals.mLimit)

  const overallAggregate = memberAggregates.find(
    (a) => a.organizationId === currentOrg.id
  )

  const typePath =
    activeType === 'alumni'
      ? 'alumni'
      : activeType === 'pemandu'
        ? 'pemandu'
        : activeType === 'instruktur'
          ? 'instruktur'
          : 'members'
  const basePath =
    slug && slug.length > 0
      ? `/dashboard/${typePath}/${slug.join('/')}`
      : `/dashboard/${typePath}`

  const memberData = organizations.map((org) => {
    const agg = memberAggregates.find((a) => a.organizationId === org.id)
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

  const renderSummary = () => (
    <div className='bg-card rounded-3xl border p-6 shadow-xs md:p-8 lg:p-10'>
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
    <div className='bg-card rounded-3xl border p-6 shadow-xs md:p-8 lg:p-10'>
      <IndividualMemberTable
        data={mMembers}
        pageCount={mPageCount}
        totalCount={mTotalCount}
        userRole={user.role}
        parentOrgId={currentOrg.id}
        type={activeType}
      />
    </div>
  )

  return (
    <AccessGuard allowedRoles={['root', 'bph', 'bpk']} levelRequirement={2}>
      <div className='flex min-h-screen flex-col space-y-12 px-4 py-8 md:px-6 md:py-10 lg:px-8'>
        <MembersPageHeader
          slug={slug}
          pageTitle={pageTitle}
          subTitle={subTitle}
          typePath={typePath}
        />

        <div className='space-y-10'>
          {overallAggregate && (
            <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
              <MemberSectionCards data={overallAggregate} type={activeType} />
            </div>
          )}

          <MembersPageTabs
            activeTab={activeTab}
            basePath={basePath}
            activeType={activeType}
            showSummary={showSummary}
            showIndividuals={showIndividuals}
            renderSummary={renderSummary}
            renderIndividuals={renderIndividuals}
          />
        </div>
      </div>
    </AccessGuard>
  )
}
