'use client'

import * as React from 'react'
import { cn } from '~/lib/shadcn/utils'
import { Input } from '~/components/shadcn/ui/input'
import { Switch } from '~/components/shadcn/ui/switch'
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
import {
  UserIcon,
  Award01Icon
} from '@hugeicons/core-free-icons'
import { getGenderLabel, getStatusLabel } from './utils'

interface PersonalInfoSectionProps {
  editData?: any
  state?: any
  photo: string
  setPhoto: (path: string) => void
  selectedGender: string
  setSelectedGender: (val: string) => void
  selectedStatus: string
  setSelectedStatus: (val: string) => void
  currentYear: number
  handleInputChange: () => void
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
  handleInputChange
}: PersonalInfoSectionProps) => {
  return (
    <FieldGroup>
      <h3 className='font-heading mb-4 text-lg font-semibold'>Data Diri</h3>
      <Field>
        <FieldLabel htmlFor='name'>Nama Lengkap</FieldLabel>
        <Input
          id='name'
          name='name'
          placeholder='Masukkan nama lengkap'
          defaultValue={editData?.name ?? state?.values?.name ?? ''}
          onChange={handleInputChange}
          required
        />
        <FieldError
          errors={state?.errors?.name?.map((m: string) => ({ message: m }))}
        />
      </Field>

      <Field className='mt-4'>
        <ImageUpload
          label='Foto Anggota'
          folder='members'
          value={photo}
          onChange={(path) => {
            setPhoto(path)
            handleInputChange()
          }}
        />
        <input type='hidden' name='photo' value={photo} />
      </Field>

      <div className='mt-4 flex flex-col gap-6'>
        <Field>
          <FieldLabel>Gender</FieldLabel>
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
          <FieldLabel>Status</FieldLabel>
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
          defaultValue={editData?.phone ?? state?.values?.phone ?? ''}
          onChange={handleInputChange}
        />
        <FieldError
          errors={state?.errors?.phone?.map((m: string) => ({ message: m }))}
        />
      </Field>

      <Field className='mt-4'>
        <FieldLabel htmlFor='yearOfEntry'>Tahun Masuk</FieldLabel>
        <Input
          id='yearOfEntry'
          name='yearOfEntry'
          type='number'
          min='1998'
          max={currentYear}
          defaultValue={
            editData?.yearOfEntry ??
            state?.values?.yearOfEntry ??
            currentYear
          }
          onChange={handleInputChange}
          required
        />
        <FieldError
          errors={state?.errors?.yearOfEntry?.map((m: string) => ({ message: m }))}
        />
      </Field>
    </FieldGroup>
  )
}
