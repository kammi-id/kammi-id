'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveLeadershipAction, type SettingsActionState } from '../action'
import type { LeadershipSettings } from '~/db/query/site-settings'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'

type Leader = LeadershipSettings['leaders'][number]
type Props = { initialData: LeadershipSettings }

export const LeadershipForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveLeadershipAction, {})
  const [leaders, setLeaders] = useState<Leader[]>(initialData.leaders)
  const [periodLabel, setPeriodLabel] = useState(initialData.periodLabel)
  const [heading, setHeading] = useState(initialData.heading)

  const { isDirty, markClean } = useUnsavedChanges({ leaders, periodLabel, heading })

  useEffect(() => {
    if (state.success) {
      toast.success('Pengaturan kepemimpinan berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.periodLabel !== undefined)
        setPeriodLabel(state.values.periodLabel)
      if (state.values.heading !== undefined) setHeading(state.values.heading)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  const updateLeader = (i: number, field: keyof Leader, value: string) => {
    setLeaders((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    )
  }

  const addLeader = () => {
    setLeaders((prev) => [...prev, { name: '', role: '', photoUrl: '' }])
  }

  const removeLeader = (i: number) => {
    setLeaders((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <form
      action={(fd) => {
        fd.set('leaders', JSON.stringify(leaders))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='periodLabel'>Label Periode</FieldLabel>
            <FieldContent>
              <Input
                id='periodLabel'
                name='periodLabel'
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder='Masa Jabatan KAMMI'
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor='heading'>Judul Seksi</FieldLabel>
            <FieldContent>
              <Input
                id='heading'
                name='heading'
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder='Mengenal Pengurus Pusat KAMMI'
              />
            </FieldContent>
            <FieldError errors={fe.heading?.map((m) => ({ message: m }))} />
          </Field>
        </div>

        <div className='space-y-3'>
          <p className='text-foreground text-sm font-medium'>Daftar Pengurus</p>
          {leaders.map((leader, i) => (
            <div
              key={i}
              className='border-border bg-muted/30 rounded-2xl border p-4'
            >
              <div className='mb-4 flex items-center justify-between'>
                <span className='text-muted-foreground font-mono text-xs'>
                  Pengurus {i + 1}
                </span>
                {leaders.length > 1 && (
                  <button
                    type='button'
                    onClick={() => removeLeader(i)}
                    className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-9 items-center justify-center rounded-lg transition-colors'
                    aria-label={`Hapus pengurus ${i + 1}`}
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      className='size-4'
                      strokeWidth={2}
                    />
                  </button>
                )}
              </div>

              <div className='space-y-4'>
                <ImageUpload
                  label='Foto Pengurus'
                  value={leader.photoUrl}
                  onChange={(path) => updateLeader(i, 'photoUrl', path)}
                  folder='site-settings/leadership'
                />

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor={`leader-name-${i}`}>Nama</FieldLabel>
                    <FieldContent>
                      <Input
                        id={`leader-name-${i}`}
                        value={leader.name}
                        onChange={(e) =>
                          updateLeader(i, 'name', e.target.value)
                        }
                        placeholder='Nama Lengkap'
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`leader-role-${i}`}>
                      Jabatan
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={`leader-role-${i}`}
                        value={leader.role}
                        onChange={(e) =>
                          updateLeader(i, 'role', e.target.value)
                        }
                        placeholder='Ketua Umum'
                      />
                    </FieldContent>
                  </Field>
                </div>
              </div>
            </div>
          ))}

          <button
            type='button'
            onClick={addLeader}
            className='border-border text-muted-foreground hover:border-primary/40 hover:text-primary flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-3 text-sm transition-colors'
          >
            <HugeiconsIcon
              icon={Add01Icon}
              className='size-4'
              strokeWidth={2}
            />
            Tambah Pengurus
          </button>
        </div>
      </FieldGroup>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button
          type='submit'
          className='px-6'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Kepemimpinan'}
        </Button>
      </div>
    </form>
  )
}
