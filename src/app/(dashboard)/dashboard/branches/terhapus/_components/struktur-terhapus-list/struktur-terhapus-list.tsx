'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import { Skeleton } from '~/components/shadcn/ui/skeleton'
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
import { StrukturJenjangBadge } from '~/app/(dashboard)/dashboard/branches/_components/struktur-badges'
import { StrukturConfirmDialog } from '~/components/struktur-confirm-dialog'
import {
  readRestoreInfoAction,
  restoreStrukturAction,
  type RestoreInfo
} from './action'
import { hardDeleteStrukturAction } from '../hard-delete-struktur'

export type DeletedStrukturRow = {
  id: string
  name: string
  code: string
  type: string
  /** The induk it was under — it is what states the restore order. */
  parentName: string | null
  /**
   * Alasan Hapus Selamanya belum bisa ditekan, dihitung di server lewat
   * prasyarat ADR 0019 — jauh lebih ketat dari sekadar nol anak/Kader yang
   * terlihat di baris ini. `null` berarti tombolnya menyala.
   */
  hardDeleteRefusal: string | null
}

const rowAnchor = (id: string) => `struktur-terhapus-${id}`

/**
 * The one surface that does the opposite of the read invariant (spec §7), for
 * Root and BPW PP.
 *
 * **Keadaan is the surface itself.** Everything on this page is Terhapus, so
 * Terhapus and Non-Aktif never appear side by side and no new visual language
 * is needed to tell them apart.
 */
export const StrukturTerhapusList = ({
  rows
}: {
  rows: DeletedStrukturRow[]
}) => {
  const router = useRouter()
  const [target, setTarget] = React.useState<DeletedStrukturRow | null>(null)
  const [info, setInfo] = React.useState<RestoreInfo | null>(null)
  const [slug, setSlug] = React.useState('')
  const [slugError, setSlugError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()
  const slugId = React.useId()

  const [hardDeleteTarget, setHardDeleteTarget] =
    React.useState<DeletedStrukturRow | null>(null)
  const [hardDeleteError, setHardDeleteError] = React.useState<string | null>(
    null
  )
  const [isHardDeletePending, startHardDeleteTransition] = React.useTransition()

  const handleHardDelete = (confirmCode: string) => {
    if (!hardDeleteTarget) return
    setHardDeleteError(null)
    startHardDeleteTransition(async () => {
      const result = await hardDeleteStrukturAction(
        hardDeleteTarget.id,
        confirmCode
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

  // Cek saat dibuka, lalu eskalasi jadi form (spec §8.4). Yang dibeli:
  // pelakunya melihat masalahnya sebelum menekan, bukan sesudah.
  React.useEffect(() => {
    if (!target) {
      setInfo(null)
      setSlug('')
      setSlugError(null)
      return
    }
    let cancelled = false
    readRestoreInfoAction(target.id).then((result) => {
      if (cancelled) return
      setInfo(result)
      setSlug(result?.suggestedSlug ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [target])

  const handleRestore = () => {
    if (!target || !info) return
    setSlugError(null)
    startTransition(async () => {
      const result = await restoreStrukturAction(
        target.id,
        info.slugTakenBy ? slug : undefined
      )
      if (!result.success) {
        if (result.slugError) setSlugError(result.slugError)
        else toast.error(result.message)
        return
      }
      toast.success(result.message)
      setTarget(null)
      router.refresh()
    })
  }

  const jumpToParent = (parentId: string) => {
    setTarget(null)
    document
      .getElementById(rowAnchor(parentId))
      ?.scrollIntoView({ block: 'center' })
  }

  if (rows.length === 0) {
    // Nol Struktur Terhapus adalah keadaan normal dan sehat, bukan kegagalan —
    // dan keadaan kosongnya berbunyi begitu (spec §8.4).
    return (
      <div className='border-border rounded-lg border border-dashed p-10 text-center'>
        <p className='text-foreground font-medium'>
          Tidak ada Struktur yang terhapus.
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
              <TableHead>Kode</TableHead>
              <TableHead>Jenjang</TableHead>
              <TableHead>Induk lama</TableHead>
              <TableHead className='text-right'>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} id={rowAnchor(row.id)}>
                <TableCell className='font-medium'>{row.name}</TableCell>
                <TableCell className='font-geist-mono text-sm'>
                  {row.code}
                </TableCell>
                <TableCell>
                  <StrukturJenjangBadge type={row.type} />
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {row.parentName ?? '—'}
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
                      <Button
                        variant='destructive'
                        size='sm'
                        disabled={!!row.hardDeleteRefusal}
                        onClick={() => setHardDeleteTarget(row)}
                      >
                        Hapus Selamanya
                      </Button>
                    </div>
                    {row.hardDeleteRefusal && (
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
            <AlertDialogDescription render={<div />}>
              {!info ? (
                <Skeleton className='h-10 w-full' />
              ) : info.refusal ? (
                <div className='space-y-3'>
                  <p className='text-foreground text-sm'>{info.refusal}</p>
                  {info.refusalParentId && (
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => jumpToParent(info.refusalParentId!)}
                    >
                      Buka barisnya di halaman ini
                    </Button>
                  )}
                </div>
              ) : info.slugTakenBy ? (
                <div className='space-y-3'>
                  <p className='text-sm'>
                    Slug lamanya{' '}
                    <span className='font-geist-mono text-foreground'>
                      {info.slug}
                    </span>{' '}
                    sekarang dipakai <strong>{info.slugTakenBy}</strong>. Pilih
                    slug lain untuk melanjutkan.
                  </p>
                  <div className='space-y-2'>
                    <Label htmlFor={slugId}>Slug baru</Label>
                    <Input
                      id={slugId}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      autoComplete='off'
                      aria-invalid={!!slugError || undefined}
                    />
                    {slugError && (
                      <p className='text-destructive text-sm' role='alert'>
                        {slugError}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className='text-sm'>
                  {target?.name} kembali sebagai <strong>Aktif</strong> dan
                  muncul lagi di seluruh permukaan. Struktur di bawahnya tidak
                  ikut dipulihkan — masing-masing dipulihkan sendiri, dari atas
                  ke bawah.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button
              disabled={
                isPending ||
                !info ||
                !!info.refusal ||
                (!!info.slugTakenBy && slug.trim().length === 0)
              }
              onClick={handleRestore}
            >
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

      <StrukturConfirmDialog
        open={hardDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setHardDeleteTarget(null)
            setHardDeleteError(null)
          }
        }}
        title={`Hapus ${hardDeleteTarget?.name} selamanya?`}
        code={hardDeleteTarget?.code ?? ''}
        confirmLabel='Ya, hapus selamanya'
        isPending={isHardDeletePending}
        error={hardDeleteError}
        onConfirm={handleHardDelete}
      >
        <ul className='text-muted-foreground list-disc space-y-2 pl-4 text-sm'>
          <li>
            <strong>
              Tidak seperti Hapus biasa, ini tidak bisa dibatalkan.
            </strong>{' '}
            Barisnya lenyap dari basis data — tidak ada lagi yang bisa
            dipulihkan.
          </li>
          <li>Seluruh Akun kepengurusannya ikut terhapus, bukan cuma mati.</li>
          <li>
            Kodenya,{' '}
            <span className='font-geist-mono'>{hardDeleteTarget?.code}</span>,
            menjadi bebas dipakai Struktur baru.
          </li>
        </ul>
      </StrukturConfirmDialog>
    </>
  )
}
