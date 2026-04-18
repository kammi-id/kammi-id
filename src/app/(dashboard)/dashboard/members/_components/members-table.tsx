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
  basePath,
  userRole,
  parentOrgId
}: MembersTableProps) => {
  const columns = getColumns(nameHeader, basePath)
  const isOpen = useStore(memberSheetStore)
  const canAdd = userRole === 'bpw' || userRole === 'root' || userRole === 'bph' || userRole === 'bpk'

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey='name'
        pageCount={pageCount}
        totalCount={totalCount}
        actionElement={
          canAdd && (
            <Button size='sm' className='h-8 gap-2' onClick={() => memberSheetStore.set(true)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className='size-4' />
              Tambah Kader
            </Button>
          )
        }
      />
      <Sheet open={isOpen} onOpenChange={memberSheetStore.set}>
        <SheetContent className='sm:max-w-[450px]'>
          <SheetHeader>
            <SheetTitle>Tambah Data Kader</SheetTitle>
            <SheetDescription>Masukkan informasi dasar kader baru untuk pendaftaran.</SheetDescription>
          </SheetHeader>
          <div className='py-6'>
            <AddMemberForm organizationId={parentOrgId} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
