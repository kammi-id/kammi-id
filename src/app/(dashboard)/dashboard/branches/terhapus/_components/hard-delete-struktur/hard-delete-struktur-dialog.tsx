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

interface HardDeleteStrukturDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  org: { name: string; code: string } | null
  isPending: boolean
  /** A server refusal, shown in place rather than as a toast that flies away. */
  error?: string | null
  onConfirm: (confirmCode: string, confirmSentence: string) => void
}

/**
 * Dua field, sengaja bukan `StrukturConfirmDialog` yang dipakai tiga
 * pemanggil lain (`~/components/struktur-confirm-dialog`). Hapus Selamanya
 * bertaruh lebih besar dari semua aksi di sana digabung — ireversibel, Akun
 * kepengurusan ikut lenyap — jadi gerbangnya tidak dibagi ke komponen bersama
 * itu: menambah field kedua ke sana akan memaksa ketiga pemanggil lain ikut
 * memikirkan sesuatu yang cuma dibutuhkan aksi ini.
 *
 * Kedua field harus cocok literal sebelum tombolnya menyala: kode Struktur,
 * dan kalimat "Saya ingin menghapus {nama}" apa adanya. Server memvalidasi
 * ulang keduanya secara terpisah (lihat `hardDeleteStrukturAction`) — yang di
 * sini murni friksi yang disengaja di sisi klien, bukan gerbang sungguhan.
 */
export const HardDeleteStrukturDialog = ({
  open,
  onOpenChange,
  org,
  isPending,
  error,
  onConfirm
}: HardDeleteStrukturDialogProps) => {
  const [typedCode, setTypedCode] = React.useState('')
  const [typedSentence, setTypedSentence] = React.useState('')
  const codeId = React.useId()
  const sentenceId = React.useId()
  const errorId = React.useId()

  React.useEffect(() => {
    if (!open) {
      setTypedCode('')
      setTypedSentence('')
    }
  }, [open])

  const expectedSentence = org ? confirmationSentenceFor(org.name) : ''
  const canConfirm =
    !!org &&
    typedCode.trim() === org.code &&
    typedSentence.trim() === expectedSentence

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {org?.name} selamanya?</AlertDialogTitle>
          <AlertDialogDescription render={<div />}>
            <ul className='text-muted-foreground list-disc space-y-2 pl-4 text-sm'>
              <li>
                <strong>
                  Tidak seperti Hapus biasa, ini tidak bisa dibatalkan.
                </strong>{' '}
                Barisnya lenyap dari basis data — tidak ada lagi yang bisa
                dipulihkan.
              </li>
              <li>
                Seluruh Akun kepengurusannya ikut terhapus, bukan cuma mati.
              </li>
              <li>
                Kodenya, <span className='font-geist-mono'>{org?.code}</span>,
                menjadi bebas dipakai Struktur baru.
              </li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor={codeId}>
              Ketik kode struktur{' '}
              <span className='font-geist-mono text-foreground font-medium'>
                {org?.code}
              </span>{' '}
              untuk melanjutkan
            </Label>
            <Input
              id={codeId}
              value={typedCode}
              onChange={(e) => setTypedCode(e.target.value)}
              placeholder={org?.code}
              autoComplete='off'
            />
          </div>

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
            onClick={() => onConfirm(typedCode, typedSentence)}
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
