'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Key01Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '~/components/shadcn/ui/dialog'
import { appendCredentials, type CredentialEntry } from '~/components/credential-store/store'
import { regenerateCredentialAction } from './action'

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type='button'
      onClick={handleCopy}
      className='text-muted-foreground hover:text-foreground ml-auto shrink-0 transition-colors'
      aria-label={copied ? 'Tersalin' : 'Salin ke clipboard'}
    >
      <span className='font-geist-mono text-xs'>{copied ? 'Tersalin!' : 'Salin'}</span>
    </button>
  )
}

interface ResetPasswordButtonProps {
  memberId: string
  organizationId: string
}

export const ResetPasswordButton = ({
  memberId,
  organizationId
}: ResetPasswordButtonProps) => {
  const [isPending, startTransition] = useTransition()
  const [newCredential, setNewCredential] = useState<{
    registerNumber: string
    password: string
  } | null>(null)

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await regenerateCredentialAction(memberId)
      if (result.success && result.data) {
        const entry: CredentialEntry = {
          memberId: result.data.memberId,
          name: result.data.name,
          registerNumber: result.data.registerNumber,
          password: result.data.password,
          organizationId,
          createdAt: new Date().toISOString()
        }
        appendCredentials(organizationId, [entry])
        setNewCredential({
          registerNumber: result.data.registerNumber,
          password: result.data.password
        })
        toast.success(result.message)
      } else {
        toast.error(result.message ?? 'Gagal mereset password', {
          description: 'Coba lagi atau hubungi administrator jika masalah berlanjut.',
        })
      }
    })
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant='outline' size='sm' disabled={isPending} />}>
          {isPending ? (
            <HugeiconsIcon icon={Loading03Icon} className='mr-2 size-3.5 animate-spin' />
          ) : (
            <HugeiconsIcon icon={Key01Icon} className='mr-2 size-3.5' />
          )}
          Reset Password
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password kader ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Password lama kader ini akan langsung tidak berlaku dan diganti
              dengan yang baru. Password baru akan tersimpan di Credential Panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              Ya, Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {newCredential && (
        <Dialog open onOpenChange={() => setNewCredential(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Password Baru</DialogTitle>
            </DialogHeader>
            <div className='space-y-3 rounded-lg border p-4'>
              <div>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-muted-foreground text-xs'>NIK (Username)</p>
                  <CopyButton value={newCredential.registerNumber} />
                </div>
                <p className='font-geist-mono text-sm font-medium'>{newCredential.registerNumber}</p>
              </div>
              <div>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-muted-foreground text-xs'>Password Baru</p>
                  <CopyButton value={newCredential.password} />
                </div>
                <p className='font-geist-mono text-sm font-medium'>{newCredential.password}</p>
              </div>
              <p className='text-muted-foreground text-xs'>
                Credential ini juga sudah tersimpan di Credential Panel.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
