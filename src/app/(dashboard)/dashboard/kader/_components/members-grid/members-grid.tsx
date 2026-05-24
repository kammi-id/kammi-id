'use client'

import { type Organization } from '~/app/(dashboard)/dashboard/_data/organizations'
import { MemberBranchCard } from './member-branch-card'
import { MembersPagination } from './members-pagination'
import { EmptyState } from '~/components/shadcn/ui/empty-state'
import {
  MembersGridControls,
  getFilterOptionsForParent
} from './members-grid-controls'

interface MembersGridProps {
  data: (Organization & {
    ab1: number
    ab2: number
    ab3: number
    ikhwan: number
    akhwat: number
    total: number
  })[]
  basePath: string
  pageCount: number
  totalCount: number
  type?: string
  currentSearch?: string
  currentOrgTypes?: string[]
  parentOrgType?: string
}

export const MembersGrid = ({
  data,
  basePath,
  pageCount,
  totalCount,
  type,
  currentSearch = '',
  currentOrgTypes = [],
  parentOrgType
}: MembersGridProps) => {
  const filterOptions = getFilterOptionsForParent(parentOrgType)

  return (
    <div className='space-y-6'>
      <MembersGridControls
        currentSearch={currentSearch}
        currentOrgTypes={currentOrgTypes}
        filterOptions={filterOptions}
      />

      <div className='text-sm text-muted-foreground'>
        Menampilkan{' '}
        <span className='font-medium text-foreground'>{data.length}</span>{' '}
        dari{' '}
        <span className='font-medium text-foreground'>{totalCount}</span>{' '}
        organisasi
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {data.length > 0 ? (
          data.map((org) => (
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

      <MembersPagination pageCount={pageCount} />
    </div>
  )
}
