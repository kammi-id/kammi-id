'use client'

import { Organization } from '../branches-table/columns'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/shadcn/ui/sheet'
import { AddOrganizationForm } from '../add-form'

interface BranchManagementSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editData: Organization | null
  addButtonLabel: string
  parentOrg: Organization
}

export const BranchManagementSheet = ({
  isOpen,
  onOpenChange,
  editData,
  addButtonLabel,
  parentOrg
}: BranchManagementSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
            onClose={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
