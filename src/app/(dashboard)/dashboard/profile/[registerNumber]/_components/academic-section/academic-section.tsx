'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PencilEdit01Icon, Tick01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Field, FieldLabel, FieldError } from '~/components/shadcn/ui/field'
import { Checkbox } from '~/components/shadcn/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem
} from '~/components/shadcn/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '~/components/shadcn/ui/sheet'
import { UniversityCombobox } from '../university-combobox'
import { SectionDivider } from '../section-divider'
import { saveAcademicAction, deleteAcademicAction } from './action'
import { useProfileEdit } from '../profile-edit-context'
import type { MemberAcademic } from '~/db/query/academic'
import type { UniversityItem } from '~/lib/api/university'

const degreeLabels: Record<string, string> = {
  d1: 'Diploma 1 (D1)',
  d2: 'Diploma 2 (D2)',
  d3: 'Diploma 3 (D3)',
  d4: 'Diploma 4 / Sarjana Terapan (D4)',
  s1: 'Sarjana (S1)',
  s2: 'Magister (S2)',
  s3: 'Doktor (S3)',
  profesi: 'Profesi / Spesialis'
}

const yearDisplay = (yearStart: number, yearEnd: number | null) =>
  yearEnd ? `${yearStart}–${yearEnd}` : `${yearStart}–sekarang`

interface AcademicSheetFormProps {
  memberId: string
  entry: MemberAcademic | null
  onClose: () => void
}

const AcademicSheetForm = ({ memberId, entry, onClose }: AcademicSheetFormProps) => {
  const boundAction = saveAcademicAction.bind(null, memberId)
  const [state, formAction, isPending] = useActionState(boundAction, {})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDegree, setSelectedDegree] = useState<string>(entry?.degree ?? 's1')
  const [yearEnd, setYearEnd] = useState(entry?.yearEnd?.toString() ?? '')
  const [isGraduated, setIsGraduated] = useState(entry?.isGraduated ?? false)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Data berhasil disimpan.')
      onClose()
    } else if (state.message && !state.errors) {
      toast.error(state.message ?? 'Terjadi kesalahan.')
    }
  }, [state, onClose])

  const handleYearEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setYearEnd(val)
    setIsGraduated(val.trim() !== '')
  }

  const handleDelete = async () => {
    if (!entry) return
    setIsDeleting(true)
    const result = await deleteAcademicAction(memberId, entry.id)
    setIsDeleting(false)
    if (result.success) {
      toast.success(result.message ?? 'Data dihapus.')
      onClose()
    } else {
      toast.error(result.message ?? 'Gagal menghapus data.')
    }
  }

  const defaultInstitutionData =
    entry?.institutionData ? (entry.institutionData as UniversityItem) : null

  return (
    <form action={formAction} className='flex flex-col gap-4 p-4'>
      {entry && <input type='hidden' name='id' value={entry.id} />}

      <Field>
        <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
          Jenjang
        </FieldLabel>
        <Select value={selectedDegree} onValueChange={(value) => setSelectedDegree(value as string)}>
          <SelectTrigger>
            <span className={selectedDegree ? '' : 'text-muted-foreground'}>
              {selectedDegree ? degreeLabels[selectedDegree] : 'Pilih jenjang'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(degreeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type='hidden' name='degree' value={selectedDegree} />
        <FieldError errors={state.errors?.degree?.map((m) => ({ message: m }))} />
      </Field>

      <Field>
        <FieldLabel htmlFor='studyProgram' className='font-geist-mono text-xs tracking-wide uppercase'>
          Program Studi
        </FieldLabel>
        <Input
          id='studyProgram'
          name='studyProgram'
          placeholder='Contoh: Teknik Informatika'
          defaultValue={entry?.studyProgram ?? ''}
          required
        />
        <FieldError errors={state.errors?.studyProgram?.map((m) => ({ message: m }))} />
      </Field>

      <Field>
        <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
          Institusi
        </FieldLabel>
        <UniversityCombobox
          nameField='institutionName'
          dataField='institutionData'
          defaultInstitutionName={entry?.institutionName ?? ''}
          defaultInstitutionData={defaultInstitutionData}
        />
        <FieldError errors={state.errors?.institutionName?.map((m) => ({ message: m }))} />
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
            value={yearEnd}
            onChange={handleYearEndChange}
            placeholder='Masih berjalan'
          />
          <FieldError errors={state.errors?.yearEnd?.map((m) => ({ message: m }))} />
        </Field>
      </div>

      <Field>
        <label className='flex cursor-pointer items-center gap-2'>
          <Checkbox
            checked={isGraduated}
            onCheckedChange={(checked) => setIsGraduated(checked === true)}
          />
          <input type='hidden' name='isGraduated' value={isGraduated ? 'true' : 'false'} />
          <span className='text-sm'>Lulus</span>
        </label>
      </Field>

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
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setConfirmDelete(false)}
                >
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

export const AcademicSection = () => {
  const { member, academicHistory, canEdit, isEditing } = useProfileEdit()
  const [open, setOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MemberAcademic | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const handleAdd = () => {
    setEditingEntry(null)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  const handleEdit = (entry: MemberAcademic) => {
    setEditingEntry(entry)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  const handleClose = () => setOpen(false)

  return (
    <section>
      <div className='flex items-center justify-between'>
        <SectionDivider title='Riwayat Akademik' count={academicHistory.length} />
        {canEdit && isEditing && (
          <Button variant='ghost' size='sm' type='button' onClick={handleAdd} className='mt-5'>
            <HugeiconsIcon icon={Add01Icon} className='mr-1 size-3.5' />
            Tambah
          </Button>
        )}
      </div>

      {academicHistory.length === 0 ? (
        <div className='py-4'>
          <p className='text-muted-foreground text-sm'>Belum ada riwayat akademik.</p>
          {!canEdit && (
            <p className='text-muted-foreground/60 mt-1 text-xs'>Data ini dikelola oleh pengurus yang berwenang.</p>
          )}
          {canEdit && !isEditing && (
            <p className='text-muted-foreground/60 mt-1 text-xs'>Klik <span className='font-medium'>Edit Profil</span> untuk menambahkan.</p>
          )}
        </div>
      ) : (
        <div className='relative'>
          {/* Scroll fade indicator */}
          <div className='pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 rounded-r-lg bg-gradient-to-l from-[oklch(0.967_0.001_286.375/0.8)] to-transparent' aria-hidden='true' />
          <div
            className='border-border overflow-x-auto rounded-lg border'
            role='region'
            aria-label='Riwayat akademik'
          >
          <table className='w-full min-w-[520px] text-sm'>
            <thead>
              <tr className='border-border border-b'>
                {['Jenjang', 'Program Studi', 'Institusi', 'Tahun', 'Lulus'].map((h) => (
                  <th
                    key={h}
                    scope='col'
                    className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase first:pl-4'
                  >
                    {h}
                  </th>
                ))}
                {canEdit && isEditing && <th scope='col' className='px-4 py-2.5' />}
              </tr>
            </thead>
            <tbody className='divide-border/60 divide-y'>
              {academicHistory.map((entry) => (
                <tr key={entry.id} className='hover:bg-muted/30 transition-colors'>
                  <td className='text-muted-foreground font-geist-mono px-4 py-3 text-xs'>
                    {entry.degree.toUpperCase()}
                  </td>
                  <td className='text-foreground px-4 py-3 font-medium'>{entry.studyProgram}</td>
                  <td className='text-foreground/80 px-4 py-3 text-sm'>{entry.institutionName}</td>
                  <td className='text-muted-foreground px-4 py-3 text-sm'>
                    {yearDisplay(entry.yearStart, entry.yearEnd)}
                  </td>
                  <td className='px-4 py-3 text-center'>
                    {entry.isGraduated ? (
                      <HugeiconsIcon icon={Tick01Icon} className='size-4 text-[var(--status-training-pass)] mx-auto' />
                    ) : (
                      <HugeiconsIcon icon={Cancel01Icon} className='size-4 text-[var(--status-training-fail)] mx-auto' />
                    )}
                  </td>
                  {canEdit && isEditing && (
                    <td className='px-4 py-3 text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        type='button'
                        onClick={() => handleEdit(entry)}
                        aria-label='Edit riwayat akademik'
                      >
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
            <SheetTitle>
              {editingEntry ? 'Edit Riwayat Akademik' : 'Tambah Riwayat Akademik'}
            </SheetTitle>
          </SheetHeader>
          <AcademicSheetForm
            key={sheetKey}
            memberId={member.id}
            entry={editingEntry}
            onClose={handleClose}
          />
        </SheetContent>
      </Sheet>
    </section>
  )
}
