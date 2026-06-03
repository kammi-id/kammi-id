'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Field, FieldLabel, FieldError } from '~/components/shadcn/ui/field'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '~/components/shadcn/ui/sheet'
import { SectionDivider } from '../section-divider'
import { saveCareerAction, deleteCareerAction } from './action'
import { useProfileEdit } from '../profile-edit-context'
import type { MemberCareer } from '~/db/query/career'

const yearDisplay = (yearStart: number, yearEnd: number | null) =>
  yearEnd ? `${yearStart}–${yearEnd}` : `${yearStart}–sekarang`

interface CareerSheetFormProps {
  memberId: string
  entry: MemberCareer | null
  onClose: () => void
}

const CareerSheetForm = ({ memberId, entry, onClose }: CareerSheetFormProps) => {
  const boundAction = saveCareerAction.bind(null, memberId)
  const [state, formAction, isPending] = useActionState(boundAction, {})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Data berhasil disimpan.')
      onClose()
    } else if (state.message && !state.errors) {
      toast.error(state.message ?? 'Terjadi kesalahan.')
    }
  }, [state, onClose])

  const handleDelete = async () => {
    if (!entry) return
    setIsDeleting(true)
    const result = await deleteCareerAction(memberId, entry.id)
    setIsDeleting(false)
    if (result.success) {
      toast.success(result.message ?? 'Data dihapus.')
      onClose()
    } else {
      toast.error(result.message ?? 'Gagal menghapus data.')
    }
  }

  return (
    <form action={formAction} className='flex flex-col gap-4 p-4'>
      {entry && <input type='hidden' name='id' value={entry.id} />}

      <Field>
        <FieldLabel htmlFor='profession' className='font-geist-mono text-xs tracking-wide uppercase'>
          Profesi
        </FieldLabel>
        <Input
          id='profession'
          name='profession'
          placeholder='Contoh: Software Engineer'
          defaultValue={entry?.profession ?? ''}
          required
        />
        <FieldError errors={state.errors?.profession?.map((m) => ({ message: m }))} />
      </Field>

      <Field>
        <FieldLabel htmlFor='company' className='font-geist-mono text-xs tracking-wide uppercase'>
          Perusahaan / Institusi
        </FieldLabel>
        <Input
          id='company'
          name='company'
          placeholder='Contoh: PT. Maju Bersama'
          defaultValue={entry?.company ?? ''}
          required
        />
        <FieldError errors={state.errors?.company?.map((m) => ({ message: m }))} />
      </Field>

      <div className='flex gap-3'>
        <Field className='flex-1'>
          <FieldLabel htmlFor='yearStart' className='font-geist-mono text-xs tracking-wide uppercase'>
            Tahun Mulai
          </FieldLabel>
          <Input
            id='yearStart'
            name='yearStart'
            type='number'
            min='1900'
            max={new Date().getFullYear()}
            defaultValue={entry?.yearStart ?? ''}
            required
          />
          <FieldError errors={state.errors?.yearStart?.map((m) => ({ message: m }))} />
        </Field>

        <Field className='flex-1'>
          <FieldLabel htmlFor='yearEnd' className='font-geist-mono text-xs tracking-wide uppercase'>
            Tahun Selesai
          </FieldLabel>
          <Input
            id='yearEnd'
            name='yearEnd'
            type='number'
            min='1900'
            max={new Date().getFullYear() + 10}
            defaultValue={entry?.yearEnd ?? ''}
            placeholder='Masih berjalan'
          />
          <FieldError errors={state.errors?.yearEnd?.map((m) => ({ message: m }))} />
        </Field>
      </div>

      <SheetFooter className='mt-2 flex-col gap-2 sm:flex-col'>
        <Button type='submit' disabled={isPending} className='w-full'>
          {isPending ? 'Menyimpan...' : entry ? 'Simpan Perubahan' : 'Tambah'}
        </Button>

        {entry && (
          <div className='border-t pt-3'>
            {!confirmDelete ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-destructive hover:text-destructive w-full'
                onClick={() => setConfirmDelete(true)}
              >
                Hapus Data Ini
              </Button>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground flex-1 text-xs'>Yakin ingin menghapus?</span>
                <Button type='button' variant='destructive' size='sm' onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
                <Button type='button' variant='outline' size='sm' onClick={() => setConfirmDelete(false)}>
                  Batal
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetFooter>
    </form>
  )
}

export const CareerSection = () => {
  const { member, careerHistory, canEdit, isEditing } = useProfileEdit()
  const [open, setOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MemberCareer | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const handleAdd = () => {
    setEditingEntry(null)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  const handleEdit = (entry: MemberCareer) => {
    setEditingEntry(entry)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  return (
    <section>
      <div className='flex items-center justify-between'>
        <SectionDivider title='Riwayat Karir' count={careerHistory.length} />
        {canEdit && isEditing && (
          <Button variant='ghost' size='sm' type='button' onClick={handleAdd} className='mt-5'>
            <HugeiconsIcon icon={Add01Icon} className='mr-1 size-3.5' />
            Tambah
          </Button>
        )}
      </div>

      {careerHistory.length === 0 ? (
        <div className='py-4'>
          <p className='text-muted-foreground text-sm'>Belum ada riwayat karir.</p>
          {!canEdit && (
            <p className='text-muted-foreground/60 mt-1 text-xs'>Data ini dikelola oleh pengurus yang berwenang.</p>
          )}
          {canEdit && !isEditing && (
            <p className='text-muted-foreground/60 mt-1 text-xs'>Klik <span className='font-medium'>Edit Profil</span> untuk menambahkan.</p>
          )}
        </div>
      ) : (
        <div className='relative'>
          <div className='pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 rounded-r-lg bg-gradient-to-l from-[oklch(0.967_0.001_286.375/0.8)] to-transparent' aria-hidden='true' />
          <div className='border-border overflow-x-auto rounded-lg border' role='region' aria-label='Riwayat karir'>
          <table className='w-full min-w-[400px] text-sm'>
            <thead>
              <tr className='border-border border-b'>
                {['Profesi', 'Perusahaan', 'Tahun'].map((h) => (
                  <th key={h} scope='col' className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'>
                    {h}
                  </th>
                ))}
                {canEdit && isEditing && <th scope='col' className='px-4 py-2.5' />}
              </tr>
            </thead>
            <tbody className='divide-border/60 divide-y'>
              {careerHistory.map((entry) => (
                <tr key={entry.id} className='hover:bg-muted/30 transition-colors'>
                  <td className='text-foreground px-4 py-3 font-medium'>{entry.profession}</td>
                  <td className='text-foreground/80 px-4 py-3 text-sm'>{entry.company}</td>
                  <td className='text-muted-foreground px-4 py-3 text-sm'>{yearDisplay(entry.yearStart, entry.yearEnd)}</td>
                  {canEdit && isEditing && (
                    <td className='px-4 py-3 text-right'>
                      <Button variant='ghost' size='sm' type='button' onClick={() => handleEdit(entry)} aria-label='Edit riwayat karir'>
                        <HugeiconsIcon icon={PencilEdit01Icon} className='size-3.5' />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader className='px-4 pt-4'>
            <SheetTitle>{editingEntry ? 'Edit Riwayat Karir' : 'Tambah Riwayat Karir'}</SheetTitle>
          </SheetHeader>
          <CareerSheetForm key={sheetKey} memberId={member.id} entry={editingEntry} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </section>
  )
}
