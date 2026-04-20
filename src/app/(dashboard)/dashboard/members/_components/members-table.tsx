'use client'

import * as React from 'react'
import { DataTable } from '../../_components/data-table'
import { getColumns, type MemberOrganization } from './columns'

interface MembersTableProps {
  data: MemberOrganization[]
  nameHeader: string
  pageCount: number
  totalCount: number
  basePath: string
}

export const MembersTable = ({
  data,
  nameHeader,
  pageCount,
  totalCount,
  basePath
}: MembersTableProps) => {
  const columns = getColumns(nameHeader, basePath)

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
