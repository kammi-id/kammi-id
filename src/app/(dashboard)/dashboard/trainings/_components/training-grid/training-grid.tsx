'use client'

import { EmptyState } from '~/components/shadcn/ui/empty-state'
import { TrainingCard, type TrainingCardData } from './training-card'
import { TrainingGridControls } from './training-grid-controls'
import { TrainingPagination } from './training-pagination'

interface TrainingGridProps {
  data: TrainingCardData[]
  pageCount: number
  totalCount: number
  currentSearch: string
  currentTypes: string[]
}

export const TrainingGrid = ({
  data,
  pageCount,
  totalCount,
  currentSearch,
  currentTypes
}: TrainingGridProps) => {
  return (
    <div className='@container space-y-6'>
      <TrainingGridControls
        currentSearch={currentSearch}
        currentTypes={currentTypes}
      />

      <p className='text-muted-foreground text-sm'>
        Menampilkan{' '}
        <span className='text-foreground font-medium'>{data.length}</span> dari{' '}
        <span className='text-foreground font-medium'>{totalCount}</span> daurah
      </p>

      {data.length > 0 ? (
        <div className='grid grid-cols-1 gap-4 @sm:grid-cols-2 @lg:grid-cols-3'>
          {data.map((training) => (
            <TrainingCard key={training.id} training={training} />
          ))}
        </div>
      ) : (
        <EmptyState
          title='Tidak ada daurah ditemukan'
          description='Coba ubah kata kunci pencarian atau filter yang digunakan.'
        />
      )}

      <TrainingPagination pageCount={pageCount} />
    </div>
  )
}
