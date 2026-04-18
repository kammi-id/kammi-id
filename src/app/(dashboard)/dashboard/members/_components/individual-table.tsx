'use client'

import * as React from 'react'
import { DataTable } from '../../_components/data-table'
import { columns, type IndividualMember } from './individual-columns'

interface IndividualTableProps {
  data: IndividualMember[]
  pageCount: number
  totalCount: number
}

export const IndividualTable = ({
  data,
  pageCount,
  totalCount
}: IndividualTableProps) => {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey='name'
      pageCount={pageCount}
      totalCount={totalCount}
      queryPrefix='m'
    />
  )
}
