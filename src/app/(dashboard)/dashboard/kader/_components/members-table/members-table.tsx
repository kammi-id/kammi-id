'use client'

import * as React from 'react'
import { DataTable } from '../../../_components/data-table'
import { getColumns, type MemberOrganization } from './columns'
import { InlineQuickAddRow } from './inline-quick-add-row'

interface MembersTableProps {
  data: MemberOrganization[]
  nameHeader: string
  pageCount: number
  totalCount: number
  basePath: string
  type?: string
}

export const MembersTable = ({
  data,
  nameHeader,
  pageCount,
  totalCount,
  basePath,
  type
}: MembersTableProps) => {
  const columns = getColumns(nameHeader, basePath, type)

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey='name'
      pageCount={pageCount}
      totalCount={totalCount}
    />
  )
}
