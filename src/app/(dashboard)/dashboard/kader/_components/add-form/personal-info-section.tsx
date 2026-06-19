'use client'

import * as React from 'react'
import { cn } from '~/lib/shadcn/utils'
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldTitle,
  FieldDescription
} from '~/components/shadcn/ui/field'
import { RadioGroup, RadioGroupItem } from '~/components/shadcn/ui/radio-group'
import { ImageUpload } from '~/components/image-upload'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon, Award01Icon } from '@hugeicons/core-free-icons'
import { getGenderLabel, getStatusLabel, getDescendantIds } from './utils'
import type { MemberFormState } from './action'
import type { IndividualMember } from '../individual-table/types'

interface PersonalInfoSectionProps {
  editData?: Partial<IndividualMember>
  state?: MemberFormState
  photo: string
  setPhoto: (path: string) => void
  selectedGender: string
  setSelectedGender: (val: string) => void
  selectedStatus: string
  setSelectedStatus: (val: string) => void
  currentYear: number
  handleInputChange: () => void
  organizations: {
    id: string
    name: string
    type: string
    parentId?: string | null
  }[]
  selectedOrgId: string
  setSelectedOrgId: (val: string) => void
  orgSearchQuery: string
  setOrgSearchQuery: (val: string) => void
}

export const PersonalInfoSection = ({
  editData,
  state,
  photo,
  setPhoto,
  selectedGender,
  setSelectedGender,
  selectedStatus,
  setSelectedStatus,
  currentYear,
  handleInputChange,
  organizations,
  selectedOrgId,
  setSelectedOrgId,
  orgSearchQuery,
  setOrgSearchQuery
}: PersonalInfoSectionProps) => {
  // Filter organizations to only show 'pd' and 'pk' that are descendants of the selectedOrgId
  const filteredOrganizations = React.useMemo(() => {
    const descendants = getDescendantIds(selectedOrgId, organizations)

    return organizations.filter((org) => {
      const isCorrectType = org.type === 'pd' || org.type === 'pk'
      const isDescendant =
        descendants.includes(org.id) || org.id === selectedOrgId
      return isCorrectType && isDescendant
    })
  }, [organizations, selectedOrgId])

  return (
    <FieldGroup>
      <h3 className='font-heading mb-4 text-lg font-semibold'>Data Diri</h3>
      <Field>
        <FieldLabel htmlFor='name'>Nama Lengkap</FieldLabel>
        <Input
          id='name'
          name='name'
          placeholder='Masukkan nama lengkap'
          defaultValue={editData?.name ?? (state?.values?.name as string) ?? ''}
          onChange={handleInputChange}
          required
        />
        <FieldError
          errors={state?.errors?.name?.map((m: string) => ({ message: m }))}
        />
      </Field>

      <div className='mt-4 grid grid-cols-2 gap-4'>
        <Field>
          <FieldLabel htmlFor='birthPlace'>Tempat Lahir</FieldLabel>
          <Input
            id='birthPlace'
            name='birthPlace'
            placeholder='Contoh: Jakarta'
            defaultValue={
              editData?.birthPlace ??
              (state?.values?.birthPlace as string) ??
              ''
            }
            onChange={handleInputChange}
          />
          <FieldError
            errors={state?.errors?.birthPlace?.map((m: string) => ({
              message: m
            }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='birthDate'>Tanggal Lahir</FieldLabel>
          <Input
            id='birthDate'
            name='birthDate'
            type='date'
            defaultValue={
              editData?.birthDate ?? (state?.values?.birthDate as string) ?? ''
            }
            onChange={handleInputChange}
          />
          <FieldError
            errors={state?.errors?.birthDate?.map((m: string) => ({
              message: m
            }))}
          />
        </Field>
      </div>

      <div className='mt-4 flex flex-col gap-6'>
        <Field>
          <FieldLabel>Jenis Kelamin</FieldLabel>
          <RadioGroup
            name='gender'
            value={selectedGender}
            onValueChange={(val) => {
              setSelectedGender(val)
              handleInputChange()
            }}
            className='grid grid-cols-2 gap-3'
          >
            {['ikhwan', 'akhwat'].map((val) => (
              <FieldLabel
                key={val}
                htmlFor={`gender-${val}`}
                className={cn(
                  'cursor-pointer rounded-xl border-2 p-3 transition-all',
                  selectedGender === val
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/20 bg-background hover:border-primary/50'
                )}
              >
                <Field orientation='horizontal'>
                  <FieldContent className='flex-1'>
                    <FieldTitle className='flex items-center justify-center gap-2 text-center font-semibold capitalize'>
                      <HugeiconsIcon
                        icon={UserIcon}
                        strokeWidth={2}
                        className='size-4'
                      />
                      {val}
                    </FieldTitle>
                    <FieldDescription className='text-center text-xs'>
                      {getGenderLabel(val)}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    value={val}
                    id={`gender-${val}`}
                    className='sr-only'
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </Field>

        <Field>
          <FieldLabel>Jenjang</FieldLabel>
          <RadioGroup
            name='status'
            value={selectedStatus}
            onValueChange={(val) => {
              setSelectedStatus(val)
              handleInputChange()
            }}
            className='grid grid-cols-3 gap-2'
          >
            {['ab1', 'ab2', 'ab3'].map((val) => (
              <FieldLabel
                key={val}
                htmlFor={`status-${val}`}
                className={cn(
                  'cursor-pointer rounded-xl border-2 p-2 transition-all',
                  selectedStatus === val
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/20 bg-background hover:border-primary/50'
                )}
              >
                <Field orientation='horizontal'>
                  <FieldContent className='flex-1'>
                    <FieldTitle className='flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase'>
                      <HugeiconsIcon
                        icon={Award01Icon}
                        strokeWidth={2}
                        className='size-3'
                      />
                      {val}
                    </FieldTitle>
                    <FieldDescription className='text-center text-[10px] leading-tight'>
                      {getStatusLabel(val)}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    value={val}
                    id={`status-${val}`}
                    className='sr-only'
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </Field>
      </div>

      <Field className='mt-6'>
        <FieldLabel htmlFor='phone'>No. HP / WhatsApp</FieldLabel>
        <Input
          id='phone'
          name='phone'
          placeholder='Contoh: 08123456789'
          defaultValue={
            editData?.phone ??
            (state?.values?.phone as string | undefined) ??
            ''
          }
          onChange={handleInputChange}
        />
        <FieldError
          errors={state?.errors?.phone?.map((m: string) => ({ message: m }))}
        />
      </Field>

      <Field className='mt-4'>
        <FieldLabel htmlFor='yearOfEntry'>Tahun Masuk KAMMI</FieldLabel>
        <Input
          id='yearOfEntry'
          name='yearOfEntry'
          type='number'
          min='1998'
          max={currentYear}
          defaultValue={
            editData?.yearOfEntry ??
            (state?.values?.yearOfEntry as number | string | undefined) ??
            currentYear
          }
          onChange={handleInputChange}
          required
        />
        <FieldError
          errors={state?.errors?.yearOfEntry?.map((m: string) => ({
            message: m
          }))}
        />
      </Field>

      <Field className='mt-4'>
        <ImageUpload
          label='Foto Anggota'
          folder='kader'
          value={photo}
          onChange={(path) => {
            setPhoto(path)
            handleInputChange()
          }}
        />
        <input type='hidden' name='photo' value={photo} />
      </Field>

      <Field className='mt-4'>
        <FieldLabel htmlFor='organizationId'>Organisasi</FieldLabel>
        <input
          type='hidden'
          name='organizationId'
          value={selectedOrgId ?? ''}
        />
        <Combobox
          value={selectedOrgId}
          onValueChange={(val) => {
            setSelectedOrgId(val ?? '')
            handleInputChange()
          }}
        >
          <ComboboxInput
            placeholder='Pilih Organisasi'
            value={
              organizations.find((org) => org.id === selectedOrgId)?.name ??
              orgSearchQuery ??
              ''
            }
            onChange={(e) => setOrgSearchQuery(e.target.value)}
          />
          <ComboboxContent>
            <ComboboxList>
              {filteredOrganizations.length === 0 ? (
                <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
              ) : (
                <ComboboxGroup>
                  {filteredOrganizations
                    .filter((org) =>
                      org.name
                        .toLowerCase()
                        .includes(orgSearchQuery.toLowerCase())
                    )
                    .map((org) => (
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
          errors={state?.errors?.organizationId?.map((m: string) => ({
            message: m
          }))}
        />
      </Field>
    </FieldGroup>
  )
}
