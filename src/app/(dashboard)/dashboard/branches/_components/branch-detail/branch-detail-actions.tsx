'use client'

import { Edit01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState } from 'react'
import { Button } from '~/components/shadcn/ui/button'
import { BranchManagementSheet } from '../branch-management-sheet'
import { type Organization, type StrukturRow } from '../struktur-row'

type BranchDetailActionsProps = {
  org: StrukturRow
  parent: Organization
  basePath: string
}

export const BranchDetailActions = ({
  org,
  parent,
  basePath
}: BranchDetailActionsProps) => {
  const [open, setOpen] = useState(false)
  const hasAction = Object.values(org.kemampuan).some(Boolean)

  if (!hasAction) return null

  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        <HugeiconsIcon
          icon={Edit01Icon}
          strokeWidth={2}
          data-icon='inline-start'
        />
        Kelola Struktur
      </Button>
      <BranchManagementSheet
        isOpen={open}
        onOpenChange={setOpen}
        editData={org}
        addButtonLabel='Struktur'
        parentOrg={parent}
        basePath={basePath}
      />
    </>
  )
}
