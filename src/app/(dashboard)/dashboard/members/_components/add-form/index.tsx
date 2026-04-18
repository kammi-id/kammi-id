'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
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
import { createMemberAction, type MemberFormState } from './action'
import { memberSheetStore } from './store'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'

export const AddMemberForm = ({ organizationId }: { organizationId: string }) => {
  const [state, action, isPending] = useActionState(createMemberAction, {})

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      memberSheetStore.set(false)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <form action={action} className='space-y-6 p-6'>
      <input type='hidden' name='organizationId' value={organizationId} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='name'>Nama Lengkap</FieldLabel>
          <Input id='name' name='name' placeholder='Masukkan nama lengkap' required />
          <FieldError errors={state.errors?.name?.map(m => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-2 gap-4'>
          <Field>
            <FieldLabel htmlFor='gender'>Gender</FieldLabel>
            <Select name='gender' defaultValue='ikhwan'>
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
            <Select name='status' defaultValue='ab1'>
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
          <FieldLabel htmlFor='yearOfEntry'>Tahun Masuk</FieldLabel>
          <Input 
            id='yearOfEntry' 
            name='yearOfEntry' 
            type='number' 
            defaultValue={new Date().getFullYear()} 
            required 
          />
          <FieldError errors={state.errors?.yearOfEntry?.map(m => ({ message: m }))} />
        </Field>

        <div className='flex justify-end gap-3 pt-4'>
          <Button type='button' variant='outline' onClick={() => memberSheetStore.set(false)}>
            Batal
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && <HugeiconsIcon icon={Loading03Icon} className='animate-spin mr-2' />}
            Simpan Kader
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
