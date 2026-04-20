'use client'

import * as React from 'react'
import { DataTable } from '../../../_components/data-table'
import { getColumns, type MemberOrganization } from './columns'

interface MembersTableProps {
  data: MemberOrganization[]
  nameHeader: string
  pageCount: number
  totalCount: number
  basePath: string
}

/**
 * MembersTable component displays a summarized table of member counts
 * across different organizational levels.
 *
 * @param props - Component properties including data, headers, and pagination info.
 * @returns A DataTable configured for member summary data.
 */
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
