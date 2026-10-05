'use client'

import { useCallback, useState, useTransition } from 'react'
import { type Organization } from '~/app/(dashboard)/dashboard/_data/organizations'
import { type OrganizationKeysetCursor } from '~/db/query/organization'
import { MemberBranchCard } from './member-branch-card'
import { MembersLoadMore } from './members-load-more'
import { EmptyState } from '~/components/shadcn/ui/empty-state'
import {
  MembersGridControls,
  getFilterOptionsForParent
} from './members-grid-controls'
import { loadMoreOrganizations } from './action'
import { type MemberBranchData } from './types'

interface MembersGridProps {
  data: MemberBranchData[]
  basePath: string
  /** Struktur whose direct children this grid lists — the keyset's `parentId`. */
  organizationId: string
  totalCount: number
  /** Rows requested per batch, both for the first server render and for `Muat lagi`. */
  batchSize: number
  initialCursor: OrganizationKeysetCursor | null
  initialHasMore: boolean
  type?: string
  currentSearch?: string
  currentOrgTypes?: string[]
  parentOrgType?: string
}

export const MembersGrid = ({
  data,
  basePath,
  organizationId,
  totalCount,
  batchSize,
  initialCursor,
  initialHasMore,
  type,
  currentSearch = '',
  currentOrgTypes = [],
  parentOrgType
}: MembersGridProps) => {
  const filterOptions = getFilterOptionsForParent(parentOrgType)

  const [items, setItems] = useState<MemberBranchData[]>(data)
  const [cursor, setCursor] = useState<OrganizationKeysetCursor | null>(
    initialCursor
  )
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleLoadMore = useCallback(() => {
    if (isPending || !hasMore) return

    startTransition(async () => {
      setLoadError(null)
      try {
        const result = await loadMoreOrganizations({
          organizationId,
          activeType: type,
          name: currentSearch || undefined,
          orgType:
            currentOrgTypes.length > 0
              ? (currentOrgTypes as Organization['type'][])
              : undefined,
          limit: batchSize,
          cursor
        })
        setItems((prev) => [...prev, ...result.items])
        setCursor(result.nextCursor)
        setHasMore(result.hasMore)
      } catch {
        setLoadError('Gagal memuat organisasi berikutnya. Coba lagi.')
      }
    })
  }, [
    isPending,
    hasMore,
    organizationId,
    type,
    currentSearch,
    currentOrgTypes,
    batchSize,
    cursor
  ])

  return (
    <div className='@container space-y-6'>
      <MembersGridControls
        currentSearch={currentSearch}
        currentOrgTypes={currentOrgTypes}
        filterOptions={filterOptions}
      />

      <div className='text-muted-foreground text-sm'>
        Menampilkan{' '}
        <span className='text-foreground font-medium'>{items.length}</span> dari{' '}
        <span className='text-foreground font-medium'>{totalCount}</span>{' '}
        organisasi
      </div>

      <div
        role='list'
        aria-label='Daftar organisasi'
        className='grid grid-cols-1 gap-4 @sm:grid-cols-2 @lg:grid-cols-3 @2xl:grid-cols-4'
      >
        {items.length > 0 ? (
          items.map((org) => (
            <MemberBranchCard
              key={org.id}
              org={org}
              basePath={basePath}
              type={type}
            />
          ))
        ) : (
          <div className='col-span-full'>
            <EmptyState
              title='Tidak ada organisasi ditemukan'
              description='Coba ubah kata kunci pencarian atau filter yang digunakan.'
            />
          </div>
        )}
      </div>

      {loadError && (
        <p role='alert' className='text-destructive text-center text-sm'>
          {loadError}
        </p>
      )}

      {items.length > 0 && (
        <MembersLoadMore
          hasMore={hasMore}
          isLoading={isPending}
          onLoadMore={handleLoadMore}
        />
      )}
    </div>
  )
}
