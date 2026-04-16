'use client'

import { DataTable } from '../../_components/data-table'
import { getColumns, type Organization } from './columns'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'

interface RegionsTableProps {
  data: Organization[]
  nameHeader: string
  addButtonLabel: string
  pageCount: number
  totalCount: number
}

export const RegionsTable = ({
  data,
  nameHeader,
  addButtonLabel,
  pageCount,
  totalCount
}: RegionsTableProps) => {
  const columns = getColumns(nameHeader)

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey='name'
      pageCount={pageCount}
      totalCount={totalCount}
      actionElement={
        <Button size='sm' className='h-8 gap-2'>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className='size-4' />
          Tambah {addButtonLabel}
        </Button>
      }
    />
  )
}
