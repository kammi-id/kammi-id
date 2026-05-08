'use client'

import { Organization } from '../_data/organizations'
import { MemberBranchCard } from './member-branch-card'
import { MembersPagination } from './members-pagination'
import { EmptyState } from '~/components/shadcn/ui/empty-state'

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
}

export const MembersGrid = ({
  data,
  basePath,
  pageCount,
  totalCount,
  type
}: MembersGridProps) => {
  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>
          Menampilkan{' '}
          <span className='text-foreground font-medium'>{data.length}</span>{' '}
          dari <span className='text-foreground font-medium'>{totalCount}</span>{' '}
          organisasi
        </div>
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
              title='Tidak ada data ditemukan'
              description='Coba gunakan kata kunci pencarian yang berbeda.'
            />
          </div>
        )}
      </div>

      <MembersPagination pageCount={pageCount} />
    </div>
  )
}
