'use client'

import * as React from 'react'
import { Switch } from '~/components/shadcn/ui/switch'
import { Field, FieldGroup, FieldLabel } from '~/components/shadcn/ui/field'

interface StatusSectionProps {
  selectedStatus: string
  isCertifiedMentor: boolean
  setIsCertifiedMentor: (val: boolean) => void
  isCertifiedInstructor: boolean
  setIsCertifiedInstructor: (val: boolean) => void
  isAlumn: boolean
  setIsAlumn: (val: boolean) => void
  isNonActive: boolean
  setIsNonActive: (val: boolean) => void
  isSuspended: boolean
  setIsSuspended: (val: boolean) => void
  handleInputChange: () => void
}

export const StatusSection = ({
  selectedStatus,
  isCertifiedMentor,
  setIsCertifiedMentor,
  isCertifiedInstructor,
  setIsCertifiedInstructor,
  isAlumn,
  setIsAlumn,
  isNonActive,
  setIsNonActive,
  isSuspended,
  setIsSuspended,
  handleInputChange
}: StatusSectionProps) => {
  const isAb1 = selectedStatus === 'ab1'

  React.useEffect(() => {
    if (isAb1 && isCertifiedMentor) setIsCertifiedMentor(false)
    if (isAb1 && isCertifiedInstructor) setIsCertifiedInstructor(false)
  }, [isAb1, isCertifiedMentor, isCertifiedInstructor])

  return (
    <FieldGroup>
      <h3 className='font-heading mb-4 text-lg font-semibold'>
        Status & Sertifikasi
      </h3>
      <div className='flex flex-col gap-4'>
        <Field orientation='horizontal' className='justify-between gap-4'>
          <FieldLabel htmlFor='isCertifiedMentor'>Pemandu</FieldLabel>
          <div className='flex items-center gap-2'>
            <Switch
              id='isCertifiedMentor'
              checked={isCertifiedMentor}
              disabled={isAb1}
              onCheckedChange={(val) => {
                setIsCertifiedMentor(val)
                handleInputChange()
              }}
            />
            <input
              type='hidden'
              name='isCertifiedMentor'
              value={isCertifiedMentor ? 'true' : 'false'}
            />
          </div>
        </Field>
        <Field orientation='horizontal' className='justify-between gap-4'>
          <FieldLabel htmlFor='isCertifiedInstructor'>Instruktur</FieldLabel>
          <div className='flex items-center gap-2'>
            <Switch
              id='isCertifiedInstructor'
              checked={isCertifiedInstructor}
              disabled={isAb1}
              onCheckedChange={(val) => {
                setIsCertifiedInstructor(val)
                handleInputChange()
              }}
            />
            <input
              type='hidden'
              name='isCertifiedInstructor'
              value={isCertifiedInstructor ? 'true' : 'false'}
            />
          </div>
        </Field>

        <div className='my-2' />

        <Field orientation='horizontal' className='justify-between gap-4'>
          <FieldLabel htmlFor='isAlumn'>Alumni</FieldLabel>
          <div className='flex items-center gap-2'>
            <Switch
              id='isAlumn'
              checked={isAlumn}
              onCheckedChange={(val) => {
                setIsAlumn(val)
                handleInputChange()
              }}
            />
            <input
              type='hidden'
              name='isAlumn'
              value={isAlumn ? 'true' : 'false'}
            />
          </div>
        </Field>
        <Field orientation='horizontal' className='justify-between gap-4'>
          <FieldLabel htmlFor='isNonActive'>Non-Aktif</FieldLabel>
          <div className='flex items-center gap-2'>
            <Switch
              id='isNonActive'
              checked={isNonActive}
              onCheckedChange={(val) => {
                setIsNonActive(val)
                handleInputChange()
              }}
            />
            <input
              type='hidden'
              name='isNonActive'
              value={isNonActive ? 'true' : 'false'}
            />
          </div>
        </Field>
        <Field orientation='horizontal' className='justify-between gap-4'>
          <FieldLabel htmlFor='isSuspended'>Skorsing</FieldLabel>
          <div className='flex items-center gap-2'>
            <Switch
              id='isSuspended'
              checked={isSuspended}
              onCheckedChange={(val) => {
                setIsSuspended(val)
                handleInputChange()
              }}
            />
            <input
              type='hidden'
              name='isSuspended'
              value={isSuspended ? 'true' : 'false'}
            />
          </div>
        </Field>
      </div>
    </FieldGroup>
  )
}
