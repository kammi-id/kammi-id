'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MoreVerticalCircle01Icon,
  Delete02Icon,
  Loading03Icon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/shadcn/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/shadcn/ui/alert-dialog'
import { deleteTrainingAction } from '../action'

interface DeleteTrainingButtonProps {
  trainingId: string
  name: string
  attendantCount: number
  instructorCount: number
}

export const DeleteTrainingButton = ({
  trainingId,
  name,
  attendantCount,
  instructorCount
}: DeleteTrainingButtonProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [alertOpen, setAlertOpen] = useState(false)
  const [confirmValue, setConfirmValue] = useState('')

  const handleMenuItemClick = () => {
    if (attendantCount > 0 || instructorCount > 0) {
      toast.error(
        'Hapus semua peserta dan instruktur terlebih dahulu sebelum menghapus daurah ini.'
      )
      return
    }
    setAlertOpen(true)
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteTrainingAction(trainingId, confirmValue)
      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/trainings')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Menu daurah'
              disabled={isPending}
            />
          }
        >
          {isPending ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              className='size-4 animate-spin'
            />
          ) : (
            <HugeiconsIcon icon={MoreVerticalCircle01Icon} className='size-4' />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem variant='destructive' onClick={handleMenuItemClick}>
            <HugeiconsIcon icon={Delete02Icon} />
            Hapus Daurah
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={alertOpen}
        onOpenChange={(open) => {
          setAlertOpen(open)
          if (!open) setConfirmValue('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data daurah ini secara permanen dan
              tidak dapat dibatalkan. Untuk melanjutkan, ketik nama daurah{' '}
              <span className='font-geist-mono font-medium'>{name}</span> di
              bawah ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='confirm-training-name'>Nama Daurah</Label>
            <Input
              id='confirm-training-name'
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              placeholder={name}
              autoComplete='off'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={handleConfirm}
              disabled={isPending || confirmValue !== name}
            >
              Ya, Hapus Daurah
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
