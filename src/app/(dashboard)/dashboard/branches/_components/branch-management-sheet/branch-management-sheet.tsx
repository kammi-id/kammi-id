'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/shadcn/ui/sheet'
import { Button } from '~/components/shadcn/ui/button'
import { Separator } from '~/components/shadcn/ui/separator'
import { Skeleton } from '~/components/shadcn/ui/skeleton'
import { AddOrganizationForm } from '../add-form'
import { type Organization, type StrukturRow } from '../struktur-row'
import { readStrukturSheetInfoAction, type StrukturSheetInfo } from './action'
import { StrukturDangerZone } from './struktur-danger-zone'
import { StrukturMoveDialog } from './struktur-move-dialog'

interface BranchManagementSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editData: StrukturRow | null
  addButtonLabel: string
  parentOrg: Organization
  basePath: string
}

/**
 * Every action over one Struktur lives here, in three tiers (spec §8.2). **The
 * card gains no buttons at all** — three action icons crowded onto a card would
 * make the most destructive one the smallest touch target, and a prerequisite
 * only fits as a whole sentence in a panel this wide.
 *
 * ```
 *  1  Form: nama, slug, logo
 *  ─────────────────────────────
 *  2  Pemindahan   [ Pindahkan induk ]   ← netral, bisa dibalik
 *  ─────────────────────────────
 *  3  Zona Berbahaya
 * ```
 *
 * Pemindahan sits in a tier of its own **above** the Zona Berbahaya: it
 * destroys nothing and is undone by the very same action, so it is not a
 * neighbour of Hapus and Nonaktifkan — even though its gate is just as heavy.
 */
export const BranchManagementSheet = ({
  isOpen,
  onOpenChange,
  editData,
  addButtonLabel,
  parentOrg,
  basePath
}: BranchManagementSheetProps) => {
  const router = useRouter()
  const [info, setInfo] = React.useState<StrukturSheetInfo | null>(null)
  const [isMoveOpen, setIsMoveOpen] = React.useState(false)
  const editId = editData?.id ?? null

  // Kader and Daurah counts are read when the sheet opens for **one** Struktur,
  // not for twelve cards at once. That is the whole data argument for putting
  // the actions here (spec §8.2).
  React.useEffect(() => {
    if (!isOpen || !editId) {
      setInfo(null)
      return
    }
    let cancelled = false
    readStrukturSheetInfoAction(editId).then((result) => {
      if (!cancelled) setInfo(result)
    })
    return () => {
      cancelled = true
    }
  }, [isOpen, editId])

  const handleDone = () => {
    onOpenChange(false)
    router.refresh()
  }

  const kemampuan = editData?.kemampuan

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='overflow-y-auto sm:max-w-[480px]'>
        <SheetHeader>
          <SheetTitle>
            {editData ? `Kelola ${editData.name}` : `Tambah ${addButtonLabel}`}
          </SheetTitle>
          <SheetDescription>
            {editData
              ? 'Perbarui identitasnya, pindahkan induknya, atau ubah keadaannya.'
              : `Isi data organisasi baru untuk menambahkan wilayah ke dalam sistem.`}
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-6 py-6'>
          {(!editData || kemampuan?.sunting) && (
            <AddOrganizationForm
              key={editData?.id || 'new-org'}
              parentOrg={parentOrg}
              editData={editData}
              onClose={() => onOpenChange(false)}
            />
          )}

          {editData && kemampuan?.pindah && (
            <>
              <Separator />
              <section className='space-y-3 px-6'>
                <div>
                  <h3 className='font-heading text-sm font-semibold'>
                    Pemindahan
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    Menempatkan {editData.name} di bawah induk lain. Tidak
                    merusak apa pun, dan dibalik dengan aksi yang sama.
                  </p>
                </div>
                {info ? (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsMoveOpen(true)}
                  >
                    Pindahkan induk
                  </Button>
                ) : (
                  <Skeleton className='h-8 w-40' />
                )}
              </section>
            </>
          )}

          {editData && (
            <>
              <Separator />
              <div className='px-6'>
                <StrukturDangerZone
                  org={editData}
                  info={info}
                  basePath={basePath}
                  onDone={handleDone}
                  onOpenMove={() => setIsMoveOpen(true)}
                />
              </div>
            </>
          )}
        </div>

        {editData && info && (
          <StrukturMoveDialog
            open={isMoveOpen}
            onOpenChange={setIsMoveOpen}
            org={editData}
            candidates={info.pindah.candidates}
            pwLabel={info.pindah.pwLabel}
            onMoved={handleDone}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
