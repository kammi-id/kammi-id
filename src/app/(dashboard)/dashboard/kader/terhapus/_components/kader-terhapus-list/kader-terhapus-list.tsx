'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/shadcn/ui/table'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/shadcn/ui/alert-dialog'
import { restoreMemberAction } from './action'
import {
  hardDeleteMemberAction,
  HardDeleteMemberDialog
} from '../hard-delete-member'

export type DeletedKaderRow = {
  id: string
  name: string
  registerNumber: string
  organizationName: string
  deletedAt: string
  /**
   * Alasan Hapus Selamanya belum bisa ditekan, dihitung di server lewat
   * prasyarat ADR 0021. `null` berarti tombolnya menyala.
   */
  hardDeleteRefusal: string | null
}

/**
 * `/dashboard/kader/terhapus` — Lapis 2 (ADR 0021), **mengikuti Cakupan**.
 * Beda dari `StrukturTerhapusList`: setiap baris di sini sudah disaring
 * Cakupan si pemanggil di server, jadi seorang BPK PD hanya pernah melihat
 * Kader Terhapus miliknya sendiri.
 *
 * `canHardDelete` datang dari server (`requireMemberHardDeleteAccess`) dan
 * menyembunyikan tombol Hapus Selamanya seluruhnya untuk BPK non-PP —
 * berbeda dari `hardDeleteRefusal`, yang menonaktifkannya untuk yang
 * berwenang tapi belum memenuhi prasyarat.
 */
export const KaderTerhapusList = ({
  rows,
  canHardDelete
}: {
  rows: DeletedKaderRow[]
  canHardDelete: boolean
}) => {
  const router = useRouter()
  const [target, setTarget] = React.useState<DeletedKaderRow | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const [hardDeleteTarget, setHardDeleteTarget] =
    React.useState<DeletedKaderRow | null>(null)
  const [hardDeleteError, setHardDeleteError] = React.useState<string | null>(
    null
  )
  const [isHardDeletePending, startHardDeleteTransition] = React.useTransition()

  const handleRestore = () => {
    if (!target) return
    startTransition(async () => {
      const result = await restoreMemberAction(target.id)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      setTarget(null)
      router.refresh()
    })
  }

  const handleHardDelete = (
    confirmSentence: string,
    confirmRegisterNumber: string
  ) => {
    if (!hardDeleteTarget) return
    setHardDeleteError(null)
    startHardDeleteTransition(async () => {
      const result = await hardDeleteMemberAction(
        hardDeleteTarget.id,
        confirmSentence,
        confirmRegisterNumber
      )
      if (!result.success) {
        setHardDeleteError(result.message)
        return
      }
      toast.success(result.message)
      setHardDeleteTarget(null)
      router.refresh()
    })
  }

  if (rows.length === 0) {
    return (
      <div className='border-border rounded-lg border border-dashed p-10 text-center'>
        <p className='text-foreground font-medium'>
          Tidak ada Kader yang terhapus.
        </p>
        <p className='text-muted-foreground mx-auto mt-1 max-w-prose text-sm'>
          Penghapusan hanya untuk catatan yang keliru, dan catatan yang keliru
          memang jarang. Kosong di sini berarti semuanya beres.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIA</TableHead>
              <TableHead>Struktur</TableHead>
              <TableHead>Dihapus pada</TableHead>
              <TableHead className='text-right'>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='font-medium'>{row.name}</TableCell>
                <TableCell className='font-geist-mono text-sm'>
                  {row.registerNumber}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {row.organizationName}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {new Date(row.deletedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex flex-col items-end gap-1.5'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setTarget(row)}
                      >
                        Pulihkan
                      </Button>
                      {canHardDelete && (
                        <Button
                          variant='destructive'
                          size='sm'
                          disabled={!!row.hardDeleteRefusal}
                          onClick={() => setHardDeleteTarget(row)}
                        >
                          Hapus Selamanya
                        </Button>
                      )}
                    </div>
                    {canHardDelete && row.hardDeleteRefusal && (
                      <p className='text-muted-foreground max-w-2xs text-right text-xs text-balance'>
                        {row.hardDeleteRefusal}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan {target?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.name} kembali muncul di Data Kader beserta Akun
              login-nya, dengan NIA yang sama persis.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button disabled={isPending} onClick={handleRestore}>
              {isPending && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className='animate-spin'
                  data-icon='inline-start'
                />
              )}
              Pulihkan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {canHardDelete && (
        <HardDeleteMemberDialog
          open={hardDeleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) {
              setHardDeleteTarget(null)
              setHardDeleteError(null)
            }
          }}
          member={hardDeleteTarget}
          isPending={isHardDeletePending}
          error={hardDeleteError}
          onConfirm={handleHardDelete}
        />
      )}
    </>
  )
}
