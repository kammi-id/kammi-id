'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/shadcn/ui/alert-dialog'
import { deleteMemberAction } from './action'

interface DeleteMemberButtonProps {
  memberId: string
  registerNumber: string
  name: string
}

export const DeleteMemberButton = ({
  memberId,
  registerNumber,
  name
}: DeleteMemberButtonProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmValue, setConfirmValue] = useState('')

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteMemberAction(memberId, confirmValue)
      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/kader')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) setConfirmValue('')
      }}
    >
      <AlertDialogTrigger
        render={<Button variant='destructive' size='sm' disabled={isPending} />}
      >
        {isPending ? (
          <HugeiconsIcon
            icon={Loading03Icon}
            className='mr-2 size-3.5 animate-spin'
          />
        ) : (
          <HugeiconsIcon icon={Delete02Icon} className='mr-2 size-3.5' />
        )}
        Hapus Anggota
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini akan menghapus data anggota ini dari dashboard dan
            menonaktifkan akun login-nya secara permanen. Untuk melanjutkan,
            ketik nomor anggota{' '}
            <span className='font-geist-mono font-medium'>
              {registerNumber}
            </span>{' '}
            di bawah ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='confirm-register-number'>Nomor Anggota</Label>
          <Input
            id='confirm-register-number'
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={registerNumber}
            autoComplete='off'
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleConfirm}
            disabled={isPending || confirmValue !== registerNumber}
          >
            Ya, Hapus Anggota
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
