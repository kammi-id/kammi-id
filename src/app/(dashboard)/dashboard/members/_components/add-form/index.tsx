'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { createMemberAction, updateMemberAction, type MemberFormState } from './action'
import { memberSheetStore, memberEditData, closeMemberSheet } from './store'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'

export const AddMemberForm = ({ organizationId }: { organizationId: string }) => {
  const editData = useStore(memberEditData)

  const [state, action, isPending] = useActionState(
    async (prevState: MemberFormState, formData: FormData) => {
      if (editData) {
        return updateMemberAction(prevState, formData)
      }
      return createMemberAction(prevState, formData)
    },
    { success: false } as MemberFormState
  )

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      closeMemberSheet()
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <form action={action} className='space-y-6 p-6'>
      <input type='hidden' name='organizationId' value={organizationId} />
      {editData && <input type='hidden' name='id' value={editData.id} />}

      <FieldGroup>
        <div className='text-sm font-medium mb-4'>Data Diri</div>
        <Field>
          <FieldLabel htmlFor='name'>Nama Lengkap</FieldLabel>
          <Input
            id='name'
            name='name'
            placeholder='Masukkan nama lengkap'
            defaultValue={editData?.name}
            required
          />
          <FieldError errors={state.errors?.name?.map(m => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-2 gap-4'>
          <Field>
            <FieldLabel htmlFor='gender'>Gender</FieldLabel>
            <Select name='gender' defaultValue={editData?.gender ?? 'ikhwan'}>
              <SelectTrigger>
                <SelectValue placeholder='Pilih gender' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ikhwan'>Ikhwan</SelectItem>
                <SelectItem value='akhwat'>Akhwat</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor='status'>Status</FieldLabel>
            <Select name='status' defaultValue={editData?.status ?? 'ab1'}>
              <SelectTrigger>
                <SelectValue placeholder='Pilih status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ab1'>AB1</SelectItem>
                <SelectItem value='ab2'>AB2</SelectItem>
                <SelectItem value='ab3'>AB3</SelectItem>
              </SelectContent>
            </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor='phone'>No. HP / WhatsApp</FieldLabel>
            <Input
              id='phone'
              name='phone'
              placeholder='Contoh: 08123456789'
              defaultValue={editData?.phone ?? ''}
            />
            <FieldError errors={state.errors?.phone?.map(m => ({ message: m }))} />
          </Field>

          <Field>
            <FieldLabel htmlFor='yearOfEntry'>Tahun Masuk</FieldLabel>
            <Input
              id='yearOfEntry'
              name='yearOfEntry'
              type='number'
              min='1998'
              max={new Date().getFullYear()}
              defaultValue={editData?.yearOfEntry ?? new Date().getFullYear()}
              required
            />
            <FieldError errors={state.errors?.yearOfEntry?.map(m => ({ message: m }))} />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <div className='text-sm font-medium mb-4'>Alamat</div>
          {/* Alamat fields will be added here */}
        </FieldGroup>

        <FieldGroup>
          <div className='text-sm font-medium mb-4'>Status & Sertifikasi</div>
          {/* Boolean switches will be added here */}
        </FieldGroup>

        <div className='flex justify-end gap-3 pt-4'>
          <Button type='button' variant='outline' onClick={() => closeMemberSheet()}>
            Batal
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && <HugeiconsIcon icon={Loading03Icon} className='animate-spin mr-2' />}
            {editData ? 'Simpan Perubahan' : 'Simpan Kader'}
          </Button>
        </div>
      </form>
    )
}
