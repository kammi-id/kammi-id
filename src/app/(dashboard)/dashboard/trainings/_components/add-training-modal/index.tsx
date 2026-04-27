'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/shadcn/ui/dialog'
import { Button } from '~/components/shadcn/ui/button'
import { PlusIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { TrainingForm } from './form'
import { useRouter } from 'next/navigation'

interface AddTrainingModalProps {
  organizations: { id: string; name: string }[]
}

export const AddTrainingModal = ({ organizations }: AddTrainingModalProps) => {
  const router = useRouter()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className='gap-2'>
          <HugeiconsIcon icon={PlusIcon} className='size-4' />
          Tambah Pelatihan
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Tambah Pelatihan Baru</DialogTitle>
        </DialogHeader>
        <TrainingForm
          organizations={organizations}
          onSuccess={() => {
            router.refresh()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
