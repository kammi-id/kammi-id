'use client'

import * as React from 'react'
import { DataTable } from '../../_components/data-table'
import { getColumns, type Organization } from './columns'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/shadcn/ui/sheet'
import { AddOrganizationForm } from './add-form'
import { useStore } from '@nanostores/react'
import { orgSheetStore } from './add-form/store'

interface BranchesTableProps {
  data: Organization[]
  nameHeader: string
  addButtonLabel: string
  pageCount: number
  totalCount: number
  parentOrg: Organization
  userRole: string
}

export const BranchesTable = ({
  data,
  nameHeader,
  addButtonLabel,
  pageCount,
  totalCount,
  parentOrg,
  userRole
}: BranchesTableProps) => {
  const isOpen = useStore(orgSheetStore)
  const [editData, setEditData] = React.useState<Organization | null>(null)
  const canManage = userRole === 'bpw' || userRole === 'root'
  const columns = getColumns(nameHeader, (org) => {
    if (!canManage) return
    setEditData(org)
    orgSheetStore.set(true)
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey='name'
        pageCount={pageCount}
        totalCount={totalCount}
        actionElement={
          canManage && (
            <Button
              size='sm'
              className='h-8 gap-2'
              onClick={() => {
                setEditData(null)
                orgSheetStore.set(true)
              }}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                className='size-4'
              />
              Tambah {addButtonLabel}
            </Button>
          )
        }
      />
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          orgSheetStore.set(open)
          if (!open) setEditData(null)
        }}
      >
        <SheetContent className='sm:max-w-[450px]'>
          <SheetHeader>
            <SheetTitle>
              {editData ? `Edit ${addButtonLabel}` : `Tambah ${addButtonLabel}`}
            </SheetTitle>
            <SheetDescription>
              {editData
                ? `Perbarui data ${addButtonLabel} untuk menjaga informasi tetap akurat.`
                : `Isi data organisasi baru untuk menambahkan wilayah ke dalam sistem.`}
            </SheetDescription>
          </SheetHeader>
          <div className='py-6'>
            <AddOrganizationForm
              key={editData?.id || 'new-org'}
              parentOrg={parentOrg}
              editData={editData}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
