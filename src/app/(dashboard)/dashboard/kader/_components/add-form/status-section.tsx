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

  // ADR-0001: seorang Kader berada pada tepat satu Keadaan. Ketiga Switch di
  // bawah karena itu bukan tiga saklar bebas — ia satu pilihan yang dieja
  // sebagai tiga boolean, dengan Aktif diwakili ketiganya padam. Bentuk yang
  // sama sudah dipakai `profile-sidebar`; keduanya harus berperilaku identik.
  type Keadaan = 'alumn' | 'nonActive' | 'suspended' | null
  const keadaan: Keadaan = isSuspended
    ? 'suspended'
    : isNonActive
      ? 'nonActive'
      : isAlumn
        ? 'alumn'
        : null

  const pilihKeadaan = (dipilih: Exclude<Keadaan, null>) => {
    // Menekan Switch yang sedang menyala berarti kembali ke Aktif.
    const berikutnya: Keadaan = keadaan === dipilih ? null : dipilih
    setIsAlumn(berikutnya === 'alumn')
    setIsNonActive(berikutnya === 'nonActive')
    setIsSuspended(berikutnya === 'suspended')
    handleInputChange()
  }

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
              checked={keadaan === 'alumn'}
              onCheckedChange={() => pilihKeadaan('alumn')}
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
              checked={keadaan === 'nonActive'}
              onCheckedChange={() => pilihKeadaan('nonActive')}
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
              checked={keadaan === 'suspended'}
              onCheckedChange={() => pilihKeadaan('suspended')}
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
