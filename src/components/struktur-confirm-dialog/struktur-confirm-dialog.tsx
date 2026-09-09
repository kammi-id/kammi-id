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

interface StrukturConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** The sentences that have to be read before the button can be pressed. */
  children: React.ReactNode
  /** The `code` that must be typed. Shown mono, per DESIGN.md. */
  code: string
  confirmLabel: string
  variant?: React.ComponentProps<typeof Button>['variant']
  isPending: boolean
  /** A server refusal, shown in place rather than as a toast that flies away. */
  error?: string | null
  /** Blocks the gate itself — an unmet prerequisite, stated above. */
  blocked?: boolean
  onConfirm: (confirmCode: string) => void
}

/**
 * **One gate for every action in the sheet: type the Struktur's `code`**
 * (spec §8.2). Deliberately uniform — Hapus, Nonaktifkan, Pindahkan induk and
 * the bulk shortcut all wear it, so nobody has to judge for themselves which of
 * them is the dangerous one.
 *
 * It follows the repo's existing destructive idiom (`delete-member-button`),
 * with one departure: confirming does **not** close the dialog by itself. A
 * refusal the server raises has to land where the person is still looking.
 */
export const StrukturConfirmDialog = ({
  open,
  onOpenChange,
  title,
  children,
  code,
  confirmLabel,
  variant = 'destructive',
  isPending,
  error,
  blocked = false,
  onConfirm
}: StrukturConfirmDialogProps) => {
  const [typed, setTyped] = React.useState('')
  const inputId = React.useId()
  const errorId = React.useId()

  React.useEffect(() => {
    if (!open) setTyped('')
  }, [open])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription render={<div />}>
            {children}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-2'>
          <Label htmlFor={inputId}>
            Ketik kode struktur{' '}
            <span className='font-geist-mono text-foreground font-medium'>
              {code}
            </span>{' '}
            untuk melanjutkan
          </Label>
          <Input
            id={inputId}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={code}
            autoComplete='off'
            disabled={blocked}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? errorId : undefined}
          />
          {error && (
            <p id={errorId} className='text-destructive text-sm' role='alert'>
              {error}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <Button
            variant={variant}
            disabled={isPending || blocked || typed.trim() !== code}
            onClick={() => onConfirm(typed)}
          >
            {isPending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className='animate-spin'
                data-icon='inline-start'
              />
            )}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
