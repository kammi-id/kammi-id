'use client'

import { useStore } from '@nanostores/react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '~/components/shadcn/ui/sheet'
import { Button } from '~/components/shadcn/ui/button'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { TrainingForm } from './form'
import { useRouter } from 'next/navigation'
import { addTrainingSheetStore } from './store'

interface AddTrainingModalProps {
  organizations: { id: string; name: string; type: string }[]
  userRole: string
}

export const AddTrainingModal = ({
  organizations,
  userRole
}: AddTrainingModalProps) => {
  const router = useRouter()
  const isOpen = useStore(addTrainingSheetStore)
  const canManage = userRole === 'root' || userRole === 'bpk'

  if (!canManage) return null

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => addTrainingSheetStore.set(open)}
    >
      <SheetTrigger
        render={
          <Button className='gap-2'>
            <HugeiconsIcon icon={Add01Icon} className='size-4' />
            Tambah Dauroh
          </Button>
        }
      />
      <SheetContent className='sm:max-w-[425px]'>
        <SheetHeader>
          <SheetTitle>Tambah Dauroh Baru</SheetTitle>
        </SheetHeader>
        <TrainingForm
          organizations={organizations}
          onSuccess={() => {
            router.refresh()
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
