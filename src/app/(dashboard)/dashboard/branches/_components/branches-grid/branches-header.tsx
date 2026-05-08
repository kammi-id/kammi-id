'use client'

import { Organization } from './columns'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'

interface BranchesHeaderProps {
  totalCount: number
  dataCount: number
  addButtonLabel: string
  canManage: boolean
  onAdd: () => void
}

export const BranchesHeader = ({
  totalCount,
  dataCount,
  addButtonLabel,
  canManage,
  onAdd
}: BranchesHeaderProps) => {
  return (
    <div className='flex items-center justify-between'>
      <div className='text-muted-foreground text-sm'>
        Menampilkan{' '}
        <span className='text-foreground font-medium'>{dataCount}</span> dari{' '}
        <span className='text-foreground font-medium'>{totalCount}</span>{' '}
        organisasi
      </div>
      {canManage && (
        <Button size='sm' className='h-8 gap-2' onClick={onAdd}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className='size-4' />
          Tambah {addButtonLabel}
        </Button>
      )}
    </div>
  )
}
