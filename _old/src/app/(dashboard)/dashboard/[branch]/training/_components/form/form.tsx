'use client'

import {
  type JSX,
  type ComponentPropsWithoutRef as ComponentProps,
  use,
  useActionState,
  useRef,
  useEffect,
  useState
} from 'react'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError
} from '~/components/shadcn/ui/field'
import { RadioGroup, RadioGroupItem } from '~/components/shadcn/ui/radio-group'
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { Input } from '~/components/shadcn/ui/input'
import { Button } from '~/components/shadcn/ui/button'
import { Spinner } from '~/components/shadcn/ui/spinner'
import Alert from '~/components/common/alert'
import Form from 'next/form'
import { trainingAction } from './action'
import { toast } from 'sonner'
import { Save, XOctagon } from 'lucide-react'
import { setOpenTrainingSheet } from './store'
import type { Organization } from '~/app/(dashboard)/dashboard/_data/organization'
import type { WithError } from '~/lib/helper/with-error'

export type OrganizationLevel = Organization['level']

type TrainingFormProps = {
  organizerId: string
  organizerLevel: OrganizationLevel
  organizerOptionsPromise: WithError<Organization[]>
  defaultValues?: {
    id?: string
    name?: string
    type?: string
    dateStart?: string
    dateEnd?: string
    registrationUntil?: string
  }
} & ComponentProps<typeof FieldGroup>

const TrainingForm = ({
  organizerId,
  organizerLevel: level,
  organizerOptionsPromise,
  defaultValues,
  ...props
}: TrainingFormProps): JSX.Element => {
  const [, organizerOptions = []] = use(organizerOptionsPromise)
  const [state, action, isPending] = useActionState(trainingAction, undefined)
  const prevPendingRef = useRef(isPending)

  const [dateStart, setDateStart] = useState(
    (state?.inputs?.dateStart as string | undefined) ??
      defaultValues?.dateStart ??
      ''
  )

  const [selectedOrganizerId, setSelectedOrganizerId] =
    useState<string>(organizerId)

  const selectedLevel =
    organizerOptions.find((org) => org.id === selectedOrganizerId)?.level ??
    level

  useEffect(() => {
    if (prevPendingRef.current && !isPending) {
      if (!state?.errors) {
        setOpenTrainingSheet(false)
        toast.success(
          defaultValues?.id
            ? 'Dauroh berhasil diperbaharui.'
            : 'Dauroh berhasil ditambahkan.'
        )
      }
    }

    prevPendingRef.current = isPending
  }, [state, isPending])

  const trainingTypeItems = [
    ...(selectedLevel <= 2
      ? [{ value: 'dm3', label: 'Dauroh Marhalah 3' }]
      : []),
    ...(selectedLevel <= 3
      ? [
          { value: 'tfi', label: 'Training For Instructors' },
          { value: 'dpmk', label: 'Dauroh Pemandu Madrasah KAMMI' },
          { value: 'dm2', label: 'Dauroh Marhalah 2' }
        ]
      : []),
    { value: 'dm1', label: 'Dauroh Marhalah 1' },
    { value: 'other', label: 'Dauroh Suplemen/Pelatihan Lainnya' }
  ]

  return (
    <Form action={action}>
      {state?.errors && (
        <Alert
          className='mb-6'
          variant='destructive'
          title='Kesalahan'
          icon={<XOctagon className='size-4' />}
        >
          <FieldError
            errors={state?.errors.filter((issue) => issue.path.length === 0)}
          />
        </Alert>
      )}
      {defaultValues?.id && (
        <input type='hidden' name='id' value={defaultValues.id} />
      )}
      <FieldGroup {...props}>
        <Field>
          <FieldLabel htmlFor='name'>Nama Dauroh</FieldLabel>
          <FieldDescription>
            Masukkan judul kegiatan dauroh yang akan diselenggarakan.
          </FieldDescription>
          <Input
            type='text'
            id='name'
            name='name'
            defaultValue={state?.inputs?.name ?? defaultValues?.name}
            disabled={isPending}
            required
          />
          <FieldError
            errors={state?.errors?.filter((issue) => issue.path[0] === 'name')}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='organizerId'>Penyelenggara</FieldLabel>
          <FieldDescription>
            Penanggungjawab dalam menyelenggarakan dauroh ini.
          </FieldDescription>
          <Combobox
            name='organizerId'
            items={organizerOptions.map((org) => ({
              value: org.id,
              label: org.name
            }))}
            isItemEqualToValue={(a, b) => a.value === b.value}
            defaultValue={{
              value: organizerId,
              label:
                organizerOptions.find((org) => org.id === organizerId)?.name ??
                organizerId
            }}
            onValueChange={(val) => {
              if (val && typeof val === 'object' && 'value' in val) {
                setSelectedOrganizerId(val.value as string)
              } else if (typeof val === 'string') {
                setSelectedOrganizerId(val)
              }
            }}
            disabled={isPending}
            required
          >
            <ComboboxInput
              id='organizerId'
              className='w-full'
              placeholder='Cari penyelenggara...'
            />
            <ComboboxContent>
              <ComboboxEmpty>Tidak ada hasil.</ComboboxEmpty>
              <ComboboxList>
                {(item: { value: string; label: string }) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldError
            errors={state?.errors?.filter(
              (issue) => issue.path[0] === 'organizerId'
            )}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='type'>Jenis</FieldLabel>
          <FieldDescription>
            Kategori dauroh yang tersedia disesuaikan dengan organisasi
            penyelenggara yang Anda pilih.
          </FieldDescription>
          <RadioGroup
            name='type'
            defaultValue='dm1'
            className='grid gap-4 pt-2 sm:grid-cols-2'
            disabled={isPending}
            required
          >
            {trainingTypeItems.map(({ value, label }) => (
              <label
                key={value}
                className='hover:bg-accent hover:text-accent-foreground has-data-checked:border-primary has-data-checked:bg-primary/5 flex cursor-pointer items-center justify-center rounded-lg border p-4 shadow-sm transition-all'
              >
                <RadioGroupItem
                  value={value}
                  id={`type-${value}`}
                  className='sr-only!'
                />
                <span className='text-sm leading-tight font-medium'>
                  {label}
                </span>
              </label>
            ))}
          </RadioGroup>
          <FieldError
            errors={state?.errors?.filter((issue) => issue.path[0] === 'type')}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='dateStart'>Tanggal Mulai</FieldLabel>
          <FieldDescription>
            Tentukan tanggal awal dimulainya kegiatan dauroh.
          </FieldDescription>
          <Input
            type='date'
            id='dateStart'
            name='dateStart'
            defaultValue={
              (state?.inputs?.dateStart as string | undefined) ??
              defaultValues?.dateStart
            }
            onChange={(e) => setDateStart(e.target.value)}
            disabled={isPending}
            required
          />
          <FieldError
            errors={state?.errors?.filter(
              (issue) => issue.path[0] === 'dateStart'
            )}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='dateEnd'>Tanggal Selesai</FieldLabel>
          <FieldDescription>
            Tentukan tanggal berakhirnya tahapan kegiatan dauroh.
          </FieldDescription>
          <Input
            type='date'
            id='dateEnd'
            name='dateEnd'
            defaultValue={
              (state?.inputs?.dateEnd as string | undefined) ??
              defaultValues?.dateEnd ??
              dateStart
            }
            min={dateStart || undefined}
            disabled={isPending}
            required
          />
          <FieldError
            errors={state?.errors?.filter(
              (issue) => issue.path[0] === 'dateEnd'
            )}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='registrationUntil'>
            Batas Pendaftaran (Opsional)
          </FieldLabel>
          <FieldDescription>
            Tentukan hingga tanggal berapa form pendaftaran peserta masih
            dibuka. Kosongkan jika tidak ada batas pendaftaran khusus.
          </FieldDescription>
          <Input
            type='date'
            id='registrationUntil'
            name='registrationUntil'
            defaultValue={
              (state?.inputs?.registrationUntil as string | undefined) ??
              defaultValues?.registrationUntil
            }
            max={dateStart || undefined}
            disabled={isPending}
          />
          <FieldError
            errors={state?.errors?.filter(
              (issue) => issue.path[0] === 'registrationUntil'
            )}
          />
        </Field>
        <Field>
          <Button type='submit' disabled={isPending}>
            {isPending ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <Save data-icon='inline-start' />
            )}
            <span>{defaultValues?.id ? 'Simpan' : 'Tambah'}</span>
          </Button>
        </Field>
      </FieldGroup>
    </Form>
  )
}

export default TrainingForm
