'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Textarea } from '~/components/shadcn/ui/textarea'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveActionsAction, type SettingsActionState } from '../action'
import type { ActionsSettings } from '~/db/query/site-settings'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon, StarIcon } from '@hugeicons/core-free-icons'

type Program = ActionsSettings['programs'][number]
type Props = { initialData: ActionsSettings }

export const ActionsForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveActionsAction, {})
  const [programs, setPrograms] = useState<Program[]>(initialData.programs)
  const [heading, setHeading] = useState(initialData.heading)
  const [subheading, setSubheading] = useState(initialData.subheading)

  useEffect(() => {
    if (state.success) toast.success('Pengaturan aksi berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.heading !== undefined) setHeading(state.values.heading)
      if (state.values.subheading !== undefined) setSubheading(state.values.subheading)
    }
  }, [state.values, state.success])

  const fe = state.fieldErrors ?? {}

  const updateProgram = (
    i: number,
    field: keyof Program,
    value: string | boolean
  ) => {
    setPrograms((prev) => {
      const next = prev.map((p, idx) =>
        idx === i ? { ...p, [field]: value } : p
      )
      if (field === 'featured' && value === true) {
        return next.map((p, idx) => (idx !== i ? { ...p, featured: false } : p))
      }
      return next
    })
  }

  const addProgram = () => {
    setPrograms((prev) => [
      ...prev,
      {
        id: `program-${Date.now()}`,
        label: '',
        sublabel: '',
        description: '',
        imageUrl: '',
        featured: false
      }
    ])
  }

  const removeProgram = (i: number) => {
    setPrograms((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <form
      action={(fd) => {
        fd.set('heading', heading)
        fd.set('subheading', subheading)
        fd.set('programs', JSON.stringify(programs))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='heading'>Judul Seksi</FieldLabel>
            <FieldContent>
              <Input
                id='heading'
                name='heading'
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder='Aksi Nyata KAMMI Untuk Indonesia'
              />
            </FieldContent>
            <FieldError errors={fe.heading?.map((m) => ({ message: m }))} />
          </Field>
          <Field>
            <FieldLabel htmlFor='subheading'>Subjudul Seksi</FieldLabel>
            <FieldContent>
              <Input
                id='subheading'
                name='subheading'
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                placeholder='Manifestasi intelektualitas...'
              />
            </FieldContent>
          </Field>
        </div>

        <div className='space-y-3'>
          <p className='text-foreground text-sm font-medium'>
            Program Aksi{' '}
            <span className='text-muted-foreground font-normal'>
              (bintang = ditampilkan besar)
            </span>
          </p>
          {programs.map((program, i) => (
            <div
              key={program.id}
              className={`rounded-2xl border p-4 ${program.featured ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}`}
            >
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() =>
                      updateProgram(i, 'featured', !program.featured)
                    }
                    className={`flex size-7 items-center justify-center rounded-lg transition-colors ${program.featured ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    aria-label={
                      program.featured ? 'Hapus featured' : 'Jadikan featured'
                    }
                    title={
                      program.featured
                        ? 'Featured (klik untuk hapus)'
                        : 'Jadikan featured'
                    }
                  >
                    <HugeiconsIcon
                      icon={StarIcon}
                      className='size-4'
                      strokeWidth={2}
                    />
                  </button>
                  <span className='text-muted-foreground font-mono text-xs'>
                    Program {i + 1}
                  </span>
                  {program.featured && (
                    <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 font-mono text-xs font-semibold'>
                      Featured
                    </span>
                  )}
                </div>
                {programs.length > 1 && (
                  <button
                    type='button'
                    onClick={() => removeProgram(i)}
                    className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-7 items-center justify-center rounded-lg transition-colors'
                    aria-label={`Hapus program ${i + 1}`}
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
                  label='Foto Program'
                  value={program.imageUrl}
                  onChange={(path) => updateProgram(i, 'imageUrl', path)}
                  folder='site-settings/actions'
                />

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor={`prog-label-${i}`}>
                      Label Program
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={`prog-label-${i}`}
                        value={program.label}
                        onChange={(e) =>
                          updateProgram(i, 'label', e.target.value)
                        }
                        placeholder='Community Service Action'
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`prog-sublabel-${i}`}>
                      Sub-label
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={`prog-sublabel-${i}`}
                        value={program.sublabel}
                        onChange={(e) =>
                          updateProgram(i, 'sublabel', e.target.value)
                        }
                        placeholder='Ekspedisi Bakti Nusantara 2024'
                      />
                    </FieldContent>
                  </Field>
                  <Field className='sm:col-span-2'>
                    <FieldLabel htmlFor={`prog-desc-${i}`}>
                      Deskripsi
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id={`prog-desc-${i}`}
                        value={program.description}
                        onChange={(e) =>
                          updateProgram(i, 'description', e.target.value)
                        }
                        rows={2}
                        placeholder='Deskripsi singkat program...'
                      />
                    </FieldContent>
                  </Field>
                </div>
              </div>
            </div>
          ))}

          <button
            type='button'
            onClick={addProgram}
            className='border-border text-muted-foreground hover:border-primary/40 hover:text-primary flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-3 text-sm transition-colors'
          >
            <HugeiconsIcon
              icon={Add01Icon}
              className='size-4'
              strokeWidth={2}
            />
            Tambah Program
          </button>
        </div>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Aksi'}
        </Button>
      </div>
    </form>
  )
}
