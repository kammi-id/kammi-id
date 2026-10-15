'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { Label } from '~/components/shadcn/ui/label'
import { moveStrukturParentAction } from '../move-parent'
import { StrukturConfirmDialog } from '~/components/struktur-confirm-dialog'
import { type MoveCandidate } from './action'

interface StrukturMoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  org: { id: string; name: string; code: string }
  candidates: MoveCandidate[]
  pwLabel: string | null
  onMoved: () => void
}

/**
 * Moving one Struktur beneath a different induk.
 *
 * Three things this dialog says that nothing else does:
 *
 * - **The PW is stated, never offered.** It is entirely determined by the
 *   Struktur being moved (spec §6.2), and a picker whose answer is always the
 *   same is not flexibility, it is confusion.
 * - **The Nomor Induk consequence**, which nobody would guess: Kader registered
 *   *after* the move take the new induk's code; Kader already registered do not
 *   change at all, because their number is permanent.
 * - **It can be undone at any time.** That single line carries the whole of the
 *   difference between this dialog and its two neighbours in the Zona
 *   Berbahaya, now that all three share one gate.
 */
export const StrukturMoveDialog = ({
  open,
  onOpenChange,
  org,
  candidates,
  pwLabel,
  onMoved
}: StrukturMoveDialogProps) => {
  const [destination, setDestination] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const selectId = React.useId()

  React.useEffect(() => {
    if (!open) {
      setDestination('')
      setError(null)
    }
  }, [open])

  const isEmpty = candidates.length === 0

  const handleConfirm = (confirmCode: string) => {
    setError(null)
    startTransition(async () => {
      const result = await moveStrukturParentAction(
        org.id,
        destination,
        confirmCode
      )
      if (!result.success) {
        setError(result.message)
        return
      }
      toast.success(result.message)
      onOpenChange(false)
      onMoved()
    })
  }

  return (
    <StrukturConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Pindahkan induk ${org.name}`}
      code={org.code}
      confirmLabel='Pindahkan'
      variant='default'
      isPending={isPending}
      error={error}
      blocked={isEmpty || !destination}
      onConfirm={handleConfirm}
    >
      <div className='space-y-4'>
        {pwLabel && (
          <p className='text-foreground text-sm font-medium'>Dalam {pwLabel}</p>
        )}

        {isEmpty ? (
          // Ada tepat satu keadaan kosong yang nyata: PK di bawah PDLN ketika
          // PDLN itu satu-satunya. Ia menyebutkan sebabnya apa adanya, bukan
          // menampilkan pemilih kosong (spec §8.2).
          <p className='text-muted-foreground text-sm'>
            Tidak ada Struktur lain yang bisa menerima {org.name} tanpa mengubah
            Nomor Induk Kader-nya.
          </p>
        ) : (
          <div className='space-y-2'>
            <Label htmlFor={selectId}>Induk baru</Label>
            <Select
              value={destination}
              onValueChange={(value) => value && setDestination(value)}
            >
              <SelectTrigger id={selectId} className='w-full'>
                <SelectValue placeholder={`Pilih induk baru`} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    <span className='flex items-center gap-2'>
                      {candidate.name}
                      <span className='font-geist-mono text-muted-foreground text-xs'>
                        {candidate.code}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <p className='text-muted-foreground text-sm'>
          Kader yang didaftarkan <strong>sesudah</strong> ini mendapat Nomor
          Induk dengan kode induk yang baru. Kader yang sudah terdaftar{' '}
          <strong>tidak berubah sama sekali</strong> — nomornya permanen.
        </p>
        <p className='text-muted-foreground text-sm'>
          Pemindahan dapat dibalik kapan saja dengan aksi yang sama.
        </p>
      </div>
    </StrukturConfirmDialog>
  )
}
