'use client'

import * as React from 'react'
import { DataTable } from '../../../_components/data-table'
import { type IndividualMember } from './types'
import { getColumns } from './columns'
import { useStore } from '@nanostores/react'
import {
  memberSheetStore,
  memberEditData,
  openMemberSheet,
  closeMemberSheet
} from '~/app/(dashboard)/dashboard/members/_components/add-form/store'
import { Button } from '~/components/shadcn/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '~/components/shadcn/ui/sheet'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { AddMemberForm } from '~/app/(dashboard)/dashboard/members/_components/add-form/add-form'

interface IndividualMemberTableProps {
  data: IndividualMember[]
  pageCount: number
  totalCount: number
  userRole: string
  parentOrgId: string
  type?: string
}

/**
 * IndividualMemberTable component displays a detailed table of individual members.
 * It provides functionality to view member details and add new members via a sheet.
 *
 * @param props - Component properties including data, pagination info, and access controls.
 * @returns A DataTable with individual member data and an accompanying member addition sheet.
 */
export const IndividualMemberTable = ({
  data,
  pageCount,
  totalCount,
  userRole,
  parentOrgId,
  type
}: IndividualMemberTableProps) => {
  const isOpen = useStore(memberSheetStore)
  const editData = useStore(memberEditData)
  const canManage = userRole === 'root' || userRole === 'bpk'

  const isEditMode = !!editData

  return (
    <>
      <DataTable
        columns={getColumns(type)}
        data={data}
        searchKey='name'
        pageCount={pageCount}
        totalCount={totalCount}
        queryPrefix='m'
        onRowClick={canManage ? (member) => openMemberSheet(member) : undefined}
        actionElement={
          canManage &&
          type !== 'pemandu' &&
          type !== 'instruktur' && (
            <Button
              size='sm'
              className='h-8 gap-2'
              onClick={() => openMemberSheet(null)}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                className='size-4'
              />
              {type === 'alumni' ? 'Tambah Alumni' : 'Tambah Kader'}
            </Button>
          )
        }
      />
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeMemberSheet()}>
        <SheetContent className='sm:max-w-[450px]'>
          <SheetHeader>
            <SheetTitle>
              {isEditMode ? 'Ubah Data Kader' : 'Tambah Data Kader'}
            </SheetTitle>
            <SheetDescription>
              {isEditMode
                ? 'Perbarui informasi dasar kader untuk memastikan data tetap akurat.'
                : 'Masukkan informasi dasar kader baru untuk pendaftaran.'}
            </SheetDescription>
          </SheetHeader>
          <div className='h-full overflow-hidden'>
            <AddMemberForm organizationId={parentOrgId} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
