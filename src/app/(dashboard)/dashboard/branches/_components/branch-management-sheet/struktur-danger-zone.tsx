'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button, buttonVariants } from '~/components/shadcn/ui/button'
import { cn } from '~/lib/shadcn/utils'
import {
  deactivateStrukturAction,
  reactivateStrukturAction
} from '../struktur-keadaan'
import { deleteStrukturAction } from '../delete-struktur'
import { moveActiveChildrenToParentAction } from '../move-parent'
import { StrukturConfirmDialog } from './struktur-confirm-dialog'
import { type StrukturSheetInfo } from './action'
import { type StrukturRow } from '../struktur-row'

interface StrukturDangerZoneProps {
  org: StrukturRow
  info: StrukturSheetInfo | null
  basePath: string
  onDone: () => void
  onOpenMove: () => void
}

type OpenDialog = 'nonaktifkan' | 'aktifkan' | 'hapus' | 'pindah-massal' | null

/**
 * Tier 3 of the sheet (spec §8.2).
 *
 * **Hapus and Nonaktifkan are told apart by order and explanation, not by
 * colour.** Nonaktifkan comes first because it is the one used more often, each
 * carries one sentence of consequence beside its button, and both wear the same
 * gate.
 *
 * A prerequisite that is not met **disables the button and prints the reason as
 * a whole sentence** — never a tooltip on a dead menu item, which is hard to
 * reach by keyboard and impossible by touch. And every refusal that leads back
 * to a move carries **the door itself**, not a mention of one: whoever hits a
 * dead end has to find the way out on the same screen.
 */
export const StrukturDangerZone = ({
  org,
  info,
  basePath,
  onDone,
  onOpenMove
}: StrukturDangerZoneProps) => {
  const [open, setOpen] = React.useState<OpenDialog>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const { kemampuan } = org
  const showsAnything =
    kemampuan.nonaktifkan || kemampuan.aktifkan || kemampuan.hapus
  if (!showsAnything) return null

  const run =
    (
      action: (confirmCode: string) => Promise<{
        success: boolean
        message: string
      }>
    ) =>
    (confirmCode: string) => {
      setError(null)
      startTransition(async () => {
        const result = await action(confirmCode)
        if (!result.success) {
          setError(result.message)
          return
        }
        toast.success(result.message)
        setOpen(null)
        onDone()
      })
    }

  const close = (next: boolean) => {
    if (!next) {
      setOpen(null)
      setError(null)
    }
  }

  const childJenjang = info?.childJenjang ?? 'Struktur'
  const deactivationRefusal = info?.nonaktifkan.refusal ?? null
  const reactivationRefusal = info?.aktifkan.refusal ?? null
  const deletionRefusal = info?.hapus.refusal ?? null
  const activeChildren = info?.nonaktifkan.activeChildren ?? []
  // Bendera dari server, bukan `parentName` yang kebetulan ada: pintasan ini
  // dijanjikan tidak pernah bisa gagal, dan hanya server yang bisa memeriksanya.
  const bulkMoveTo = info?.bulkMoveTo ?? null

  return (
    <section className='border-destructive/30 space-y-4 rounded-lg border p-4'>
      <h3 className='font-heading text-destructive text-sm font-semibold'>
        Zona Berbahaya
      </h3>

      {kemampuan.nonaktifkan && (
        <div className='space-y-2'>
          <div className='flex items-start justify-between gap-3'>
            <p className='text-muted-foreground text-sm'>
              Akun kepengurusannya berhenti bisa dipakai dan situs publiknya
              mati. Bisa diaktifkan kembali kapan saja.
            </p>
            <Button
              variant='outline'
              size='sm'
              className='shrink-0'
              disabled={!info || !!deactivationRefusal}
              onClick={() => setOpen('nonaktifkan')}
            >
              Nonaktifkan
            </Button>
          </div>

          {deactivationRefusal && (
            <div className='bg-muted/60 space-y-2 rounded-md p-3'>
              <p className='text-foreground text-sm'>{deactivationRefusal}</p>
              {activeChildren.length > 0 && (
                <div className='flex flex-wrap items-center gap-2'>
                  {bulkMoveTo && (
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={() => setOpen('pindah-massal')}
                    >
                      Pindahkan semua {childJenjang} Aktif ke {bulkMoveTo}
                    </Button>
                  )}
                  <Link
                    href={`${basePath}/${org.slug}`}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'sm' })
                    )}
                  >
                    Pindahkan satu per satu
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {kemampuan.aktifkan && (
        <div className='space-y-2'>
          <div className='flex items-start justify-between gap-3'>
            <p className='text-muted-foreground text-sm'>
              Akun kepengurusan dan situs publiknya hidup kembali.
            </p>
            <Button
              variant='outline'
              size='sm'
              className='shrink-0'
              disabled={!info || !!reactivationRefusal}
              onClick={() => setOpen('aktifkan')}
            >
              Aktifkan
            </Button>
          </div>

          {reactivationRefusal && (
            <div className='bg-muted/60 space-y-2 rounded-md p-3'>
              <p className='text-foreground text-sm'>{reactivationRefusal}</p>
              {kemampuan.pindah && (
                <Button variant='secondary' size='sm' onClick={onOpenMove}>
                  Pindahkan {org.name} ke induk yang aktif
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {kemampuan.hapus && (
        <div className='space-y-2'>
          <div className='flex items-start justify-between gap-3'>
            <p className='text-muted-foreground text-sm'>
              Struktur ini hilang dari seluruh permukaan, seolah barisnya tidak
              pernah ada. Hanya Root dan BPW PP yang bisa memulihkannya.
            </p>
            <Button
              variant='destructive'
              size='sm'
              className='shrink-0'
              disabled={!info || !!deletionRefusal}
              onClick={() => setOpen('hapus')}
            >
              Hapus
            </Button>
          </div>

          {deletionRefusal && (
            <div className='bg-muted/60 rounded-md p-3'>
              <p className='text-foreground text-sm'>{deletionRefusal}</p>
            </div>
          )}
        </div>
      )}

      <StrukturConfirmDialog
        open={open === 'nonaktifkan'}
        onOpenChange={close}
        title={`Nonaktifkan ${org.name}?`}
        code={org.code}
        confirmLabel='Ya, nonaktifkan'
        isPending={isPending}
        error={error}
        onConfirm={run((confirmCode) =>
          deactivateStrukturAction(org.id, confirmCode)
        )}
      >
        <ul className='text-muted-foreground list-disc space-y-2 pl-4 text-sm'>
          <li>
            Empat Akun kepengurusannya berhenti bisa dipakai.{' '}
            <strong>Akun Kader tetap hidup.</strong>
          </li>
          <li>
            Situs publiknya mati — artikelnya ikut 404, bukan sekadar hilang
            dari daftar.
          </li>
          <li>
            <strong>Sistem tidak memberi tahu mereka.</strong> Login yang
            ditolak berbunyi &ldquo;Username atau password salah&rdquo;, sama
            persis dengan password yang salah. Antum wajib memberi tahu orangnya
            di luar sistem.
          </li>
        </ul>
      </StrukturConfirmDialog>

      <StrukturConfirmDialog
        open={open === 'aktifkan'}
        onOpenChange={close}
        title={`Aktifkan kembali ${org.name}?`}
        code={org.code}
        confirmLabel='Ya, aktifkan'
        variant='default'
        isPending={isPending}
        error={error}
        onConfirm={run((confirmCode) =>
          reactivateStrukturAction(org.id, confirmCode)
        )}
      >
        <p className='text-muted-foreground text-sm'>
          Akun kepengurusan dan situs publiknya hidup kembali. Struktur di
          bawahnya tidak ikut diaktifkan — masing-masing diaktifkan sendiri.
        </p>
      </StrukturConfirmDialog>

      <StrukturConfirmDialog
        open={open === 'hapus'}
        onOpenChange={close}
        title={`Hapus ${org.name}?`}
        code={org.code}
        confirmLabel='Ya, hapus'
        isPending={isPending}
        error={error}
        onConfirm={run((confirmCode) =>
          deleteStrukturAction(org.id, confirmCode)
        )}
      >
        <p className='text-muted-foreground text-sm'>
          Penghapusan untuk catatan yang keliru, bukan untuk pensiun: Struktur
          ini akan hilang dari seluruh permukaan seolah barisnya tidak pernah
          ada. Hanya Root dan BPW PP yang bisa memulihkannya.
        </p>
      </StrukturConfirmDialog>

      <StrukturConfirmDialog
        open={open === 'pindah-massal'}
        onOpenChange={close}
        title={`Pindahkan semua ${childJenjang} Aktif ke ${bulkMoveTo ?? ''}`}
        code={org.code}
        confirmLabel='Ya, pindahkan semua'
        variant='default'
        isPending={isPending}
        error={error}
        onConfirm={run((confirmCode) =>
          moveActiveChildrenToParentAction(org.id, confirmCode)
        )}
      >
        <div className='text-muted-foreground space-y-3 text-sm'>
          <p>
            {activeChildren.length} {childJenjang} Aktif dititipkan langsung di
            bawah {bulkMoveTo}, supaya {org.name} bisa dinonaktifkan hari ini.
            Penempatan yang benar bisa dikerjakan satu per satu kemudian.
          </p>
          <p>
            Kader yang didaftarkan <strong>sesudah</strong> ini mendapat Nomor
            Induk dengan kode induk yang baru. Kader yang sudah terdaftar tidak
            berubah sama sekali.
          </p>
          <p>
            Satu aksi, satu gerbang: yang diketik adalah kode {org.name}, sekali
            — bukan kode tiap {childJenjang}.
          </p>
        </div>
      </StrukturConfirmDialog>
    </section>
  )
}
