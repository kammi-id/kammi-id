'use client'

import * as React from 'react'
import { useStore } from '@nanostores/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '~/components/shadcn/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/shadcn/ui/sheet'
import { DataTable } from '../../_components/data-table'
import { getColumns, type MemberOrganization } from './columns'
import { AddMemberForm } from './add-form'
import { memberSheetStore } from './add-form/store'

interface MembersTableProps {
  data: MemberOrganization[]
  nameHeader: string
  pageCount: number
  totalCount: number
  basePath: string
  userRole: string
  parentOrgId: string
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
