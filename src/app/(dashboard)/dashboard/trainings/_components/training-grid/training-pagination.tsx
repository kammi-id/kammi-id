'use client'

import { Button } from '~/components/shadcn/ui/button'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface TrainingPaginationProps {
  pageCount: number
}

export const TrainingPagination = ({ pageCount }: TrainingPaginationProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = searchParams.get('page') || '1'
  const pageNum = parseInt(currentPage)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  if (pageCount <= 1) return null

  return (
    <div className='flex items-center justify-center gap-2 py-4'>
      <Button
        variant='outline'
        size='sm'
        disabled={pageNum <= 1}
        onClick={() => handlePageChange(pageNum - 1)}
      >
        Sebelumnya
      </Button>
      <span className='text-sm font-medium'>
        Halaman {pageNum} dari {pageCount}
      </span>
      <Button
        variant='outline'
        size='sm'
        disabled={pageNum >= pageCount}
        onClick={() => handlePageChange(pageNum + 1)}
      >
        Selanjutnya
      </Button>
    </div>
  )
}
