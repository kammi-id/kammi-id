'use client'

import * as React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/shadcn/ui/alert-dialog'
import { confirmationSentenceFor } from './schema'

interface HardDeleteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: { name: string; registerNumber: string } | null
  isPending: boolean
  /** A server refusal, shown in place rather than as a toast that flies away. */
  error?: string | null
  onConfirm: (confirmSentence: string, confirmRegisterNumber: string) => void
}

/**
 * Dua field, dua gerbang, gerbang kedua mengetik NIA (ADR 0021) — sengaja
 * berbeda dari `DeleteMemberButton` (Lapis 1), yang cukup satu field. Hapus
 * Selamanya bertaruh lebih besar: ireversibel, dan Akun-nya ikut lenyap
 * lewat cascade. Server memvalidasi ulang keduanya secara terpisah (lihat
 * `hardDeleteMemberAction`) — yang di sini murni friksi yang disengaja di
 * sisi klien, bukan gerbang sungguhan.
 */
export const HardDeleteMemberDialog = ({
  open,
  onOpenChange,
  member,
  isPending,
  error,
  onConfirm
}: HardDeleteMemberDialogProps) => {
  const [typedSentence, setTypedSentence] = React.useState('')
  const [typedRegisterNumber, setTypedRegisterNumber] = React.useState('')
  const sentenceId = React.useId()
  const registerNumberId = React.useId()
  const errorId = React.useId()

  React.useEffect(() => {
    if (!open) {
      setTypedSentence('')
      setTypedRegisterNumber('')
    }
  }, [open])

  const expectedSentence = member ? confirmationSentenceFor(member.name) : ''
  const canConfirm =
    !!member &&
    typedSentence.trim() === expectedSentence &&
    typedRegisterNumber.trim() === member.registerNumber

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {member?.name} selamanya?</AlertDialogTitle>
          <AlertDialogDescription render={<div />}>
            <ul className='text-muted-foreground list-disc space-y-2 pl-4 text-sm'>
              <li>
                <strong>
                  Tidak seperti Hapus biasa, ini tidak bisa dibatalkan.
                </strong>{' '}
                Barisnya lenyap dari basis data — tidak ada lagi yang bisa
                dipulihkan.
              </li>
              <li>Akun login-nya ikut terhapus, bukan cuma mati.</li>
              <li>
                NIA-nya,{' '}
                <span className='font-geist-mono'>
                  {member?.registerNumber}
                </span>
                , tidak pernah terbit ulang untuk siapa pun.
              </li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor={sentenceId}>
              Ketik{' '}
              <span className='text-foreground font-medium'>
                &ldquo;{expectedSentence}&rdquo;
              </span>{' '}
              untuk melanjutkan
            </Label>
            <Input
              id={sentenceId}
              value={typedSentence}
              onChange={(e) => setTypedSentence(e.target.value)}
              placeholder={expectedSentence}
              autoComplete='off'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor={registerNumberId}>
              Ketik NIA{' '}
              <span className='font-geist-mono text-foreground font-medium'>
                {member?.registerNumber}
              </span>{' '}
              untuk melanjutkan
            </Label>
            <Input
              id={registerNumberId}
              value={typedRegisterNumber}
              onChange={(e) => setTypedRegisterNumber(e.target.value)}
              placeholder={member?.registerNumber}
              autoComplete='off'
              aria-invalid={!!error || undefined}
              aria-describedby={error ? errorId : undefined}
            />
            {error && (
              <p id={errorId} className='text-destructive text-sm' role='alert'>
                {error}
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <Button
            variant='destructive'
            disabled={isPending || !canConfirm}
            onClick={() => onConfirm(typedSentence, typedRegisterNumber)}
          >
            {isPending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className='animate-spin'
                data-icon='inline-start'
              />
            )}
            Ya, hapus selamanya
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
