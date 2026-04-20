'use client'

import * as React from 'react'
import { DataTable } from '../../_components/data-table'
import { columns, type IndividualMember } from './individual-columns'
import { openMemberSheet, memberSheetStore, closeMemberSheet } from './add-form/store'
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
import { ScrollArea } from '~/components/shadcn/ui/scroll-area'
import { AddMemberForm } from './add-form'

interface IndividualMemberTableProps {
  data: IndividualMember[]
  pageCount: number
  totalCount: number
  userRole: string
  parentOrgId: string
}

export const IndividualMemberTable = ({
  data,
  pageCount,
  totalCount,
  userRole,
  parentOrgId
}: IndividualMemberTableProps) => {
  const isOpen = useStore(memberSheetStore)
  const canManage = userRole === 'root' || userRole === 'bpk'

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey='name'
        pageCount={pageCount}
        totalCount={totalCount}
        queryPrefix='m'
        onRowClick={canManage ? (member) => openMemberSheet(member) : undefined}
        actionElement={
          canManage && (
            <Button size='sm' className='h-8 gap-2' onClick={() => openMemberSheet(null)}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className='size-4' />
              Tambah Kader
            </Button>
          )
        }
      />
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeMemberSheet()}>
        <SheetContent className='sm:max-w-[450px]'>
          <SheetHeader>
            <SheetTitle>Tambah Data Kader</SheetTitle>
            <SheetDescription>Masukkan informasi dasar kader baru untuk pendaftaran.</SheetDescription>
          </SheetHeader>
          <div className='h-full overflow-hidden'>
            <AddMemberForm organizationId={parentOrgId} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
