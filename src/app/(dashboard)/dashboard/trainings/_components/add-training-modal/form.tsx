'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxGroup,
  ComboboxList,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { RadioGroup, RadioGroupItem } from '~/components/shadcn/ui/radio-group'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { createTrainingAction, searchMasterCandidatesAction } from './action'
import type { EligibleMember } from '~/db/query/training'
import { toast } from 'sonner'
import { closeAddTrainingSheet } from './store'
import { cn } from '~/lib/shadcn/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { Award01Icon } from '@hugeicons/core-free-icons'
import * as React from 'react'

const TRAINING_TYPE_LABELS: Record<string, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dpmk: 'DPMK',
  tfi: 'TFI',
  dm3: 'DM 3',
  other: 'Lainnya'
}

interface TrainingFormProps {
  organizations: { id: string; name: string; type: string }[]
  onSuccess: () => void
}

export const TrainingForm = ({
  organizations,
  onSuccess
}: TrainingFormProps) => {
  const [state, formAction, isPending] = useActionState(createTrainingAction, {
    success: false,
    message: '',
    errors: {}
  })

  const [orgId, setOrgId] = useState(organizations[0]?.id || '')
  const [type, setType] = useState('dm1')
  const [orgSearchQuery, setOrgSearchQuery] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [masterId, setMasterId] = useState('')
  const [masterName, setMasterName] = useState('')
  const [masterQuery, setMasterQuery] = useState('')
  const [masterResults, setMasterResults] = useState<EligibleMember[]>([])
  const [masterLoading, setMasterLoading] = useState(false)
  const [name, setName] = useState('')
  const [registrationDeadline, setRegistrationDeadline] = useState('')
  const masterDebounceRef = React.useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onSuccess()
      closeAddTrainingSheet()
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, onSuccess])

  useEffect(() => {
    if (masterDebounceRef.current) clearTimeout(masterDebounceRef.current)
    masterDebounceRef.current = setTimeout(async () => {
      if (masterQuery.length < 2) {
        setMasterResults([])
        return
      }
      setMasterLoading(true)
      try {
        const res = await searchMasterCandidatesAction(masterQuery)
        if (res.success) setMasterResults(res.data)
      } finally {
        setMasterLoading(false)
      }
    }, 300)
  }, [masterQuery])

  useEffect(() => {
    if (state.values && !state.success) {
      if (state.values.name) setName(state.values.name)
      if (state.values.registrationDeadline)
        setRegistrationDeadline(state.values.registrationDeadline)
    }
  }, [state.values, state.success])

  const selectedOrg = organizations.find((org) => org.id === orgId)
  const selectedOrgType = selectedOrg?.type

  const filteredOrgs = React.useMemo(
    () =>
      organizations.filter((org) =>
        org.name.toLowerCase().includes(orgSearchQuery.toLowerCase())
      ),
    [organizations, orgSearchQuery]
  )

  const availableTypes = React.useMemo(() => {
    if (!selectedOrgType) return Object.keys(TRAINING_TYPE_LABELS)

    if (selectedOrgType === 'pk') {
      return ['dm1', 'other']
    }
    if (selectedOrgType === 'pd' || selectedOrgType === 'pdln') {
      return ['dm1', 'dm2', 'dpmk', 'tfi', 'other']
    }
    // PW or PP
    return Object.keys(TRAINING_TYPE_LABELS)
  }, [selectedOrgType])

  useEffect(() => {
    if (availableTypes.length > 0 && !availableTypes.includes(type)) {
      setType(availableTypes[0])
    }
    // type intentionally omitted — only sync when availableTypes changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTypes])

  return (
    <form
      action={formAction}
      className='flex h-full max-h-[calc(100vh-120px)] flex-col'
    >
      <div className='flex-1 space-y-6 overflow-y-auto p-6'>
        <FieldGroup>
          <h3 className='font-heading mb-4 text-lg font-semibold'>
            Informasi Daurah
          </h3>

          <Field>
            <FieldLabel htmlFor='organizationId'>Penyelenggara</FieldLabel>
            <input type='hidden' name='organizationId' value={orgId || ''} />
            <Combobox
              value={orgId || ''}
              onValueChange={(val) => setOrgId(val ?? '')}
            >
              <ComboboxInput
                placeholder='Pilih Penyelenggara'
                value={(selectedOrg?.name ?? orgSearchQuery) || ''}
                onChange={(e) => setOrgSearchQuery(e.target.value)}
              />
              <ComboboxContent>
                <ComboboxList>
                  {filteredOrgs.length === 0 ? (
                    <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
                  ) : (
                    <ComboboxGroup>
                      {filteredOrgs.map((org) => (
                        <ComboboxItem key={org.id} value={org.id}>
                          {org.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxGroup>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError
              errors={state.errors?.organizationId?.map((m) => ({
                message: m
              }))}
            />
          </Field>

          <Field className='mt-4'>
            <FieldLabel>Tipe Daurah</FieldLabel>
            <input type='hidden' name='type' value={type} />
            <RadioGroup
              value={type}
              onValueChange={setType}
              className='grid grid-cols-2 gap-3'
            >
              {availableTypes.map((val) => {
                const label = TRAINING_TYPE_LABELS[val]
                return (
                  <label
                    key={val}
                    htmlFor={`type-${val}`}
                    className={cn(
                      'flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 font-semibold transition-all',
                      type === val
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/20 bg-background hover:border-primary/50'
                    )}
                  >
                    <HugeiconsIcon
                      icon={Award01Icon}
                      strokeWidth={2}
                      className='size-4'
                    />
                    {label}
                    <RadioGroupItem
                      value={val}
                      id={`type-${val}`}
                      className='sr-only'
                    />
                  </label>
                )
              })}
            </RadioGroup>
            <FieldError
              errors={state.errors?.type?.map((m) => ({ message: m }))}
            />
          </Field>

          <Field className='mt-4'>
            <FieldLabel htmlFor='name'>Nama Daurah</FieldLabel>
            <Input
              id='name'
              name='name'
              placeholder='Contoh: DM 1 Nasional'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FieldError
              errors={state.errors?.name?.map((m) => ({ message: m }))}
            />
          </Field>

          <div className='mt-4 grid grid-cols-2 gap-4'>
            <Field>
              <FieldLabel htmlFor='startDate'>Tanggal Mulai</FieldLabel>
              <Input
                id='startDate'
                name='startDate'
                type='date'
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value
                  setStartDate(val)
                  if (endDate < val) setEndDate(val)
                }}
                required
              />
              <FieldError
                errors={state.errors?.startDate?.map((m) => ({ message: m }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='endDate'>Tanggal Selesai</FieldLabel>
              <Input
                id='endDate'
                name='endDate'
                type='date'
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              <FieldError
                errors={state.errors?.endDate?.map((m) => ({ message: m }))}
              />
            </Field>
          </div>

          <Field className='mt-4'>
            <FieldLabel htmlFor='registrationDeadline'>
              Deadline Pendaftaran (Opsional)
            </FieldLabel>
            <Input
              id='registrationDeadline'
              name='registrationDeadline'
              type='date'
              max={startDate}
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
            />
            <FieldError
              errors={state.errors?.registrationDeadline?.map((m) => ({
                message: m
              }))}
            />
          </Field>

          <Field className='mt-4'>
            <FieldLabel>Master of Training</FieldLabel>
            <input type='hidden' name='masterId' value={masterId} />
            <Combobox
              value={masterId}
              onValueChange={(val) => {
                const selected = masterResults.find((m) => m.id === val)
                if (selected) {
                  setMasterId(selected.id)
                  setMasterName(selected.name)
                  setMasterQuery(selected.name)
                } else if (!val) {
                  setMasterId('')
                  setMasterName('')
                  setMasterQuery('')
                }
              }}
            >
              <ComboboxInput
                placeholder='Cari instruktur bersertifikat...'
                value={masterName || masterQuery}
                onChange={(e) => {
                  setMasterQuery(e.target.value)
                  if (!e.target.value) {
                    setMasterId('')
                    setMasterName('')
                  }
                }}
              />
              <ComboboxContent>
                <ComboboxList>
                  {masterLoading ? (
                    <div className='text-muted-foreground p-4 text-center text-xs'>
                      Mencari...
                    </div>
                  ) : masterResults.length === 0 && masterQuery.length >= 2 ? (
                    <ComboboxEmpty>Instruktur tidak ditemukan.</ComboboxEmpty>
                  ) : (
                    <ComboboxGroup>
                      {masterResults.map((m) => (
                        <ComboboxItem key={m.id} value={m.id}>
                          <div className='flex flex-col'>
                            <span className='font-medium'>{m.name}</span>
                            <span className='text-muted-foreground text-[10px]'>
                              {m.registerNumber}
                            </span>
                          </div>
                        </ComboboxItem>
                      ))}
                    </ComboboxGroup>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError
              errors={state.errors?.masterId?.map((m) => ({ message: m }))}
            />
            <FieldDescription>
              Hanya kader yang sudah lulus dan bersertifikat sebagai instruktur
              daurah yang bisa dipilih.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </div>

      <div className='bg-background sticky bottom-0 flex justify-end gap-3 border-t p-6'>
        <Button
          type='button'
          variant='outline'
          onClick={() => closeAddTrainingSheet()}
        >
          Batal
        </Button>
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Daurah'}
        </Button>
      </div>
    </form>
  )
}
