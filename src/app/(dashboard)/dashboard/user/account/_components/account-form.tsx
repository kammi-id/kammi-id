'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { UserCircle02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { updateProfileAction, type ProfileFormState } from './action'
import { toast } from 'sonner'

interface AccountFormProps {
  initialData: {
    name: string
    displayName: string
  }
}

export const AccountForm = ({ initialData }: AccountFormProps) => {
  const [state, formAction, isPending] = useActionState(updateProfileAction, {
    success: false
  })

  const [name, setName] = useState(initialData.name)
  const [displayName, setDisplayName] = useState(initialData.displayName)

  useEffect(() => {
    setName(initialData.name)
    setDisplayName(initialData.displayName)
  }, [initialData])

  useEffect(() => {
    if (state.success) {
      toast.success('Profile updated successfully!')
    }
    if (state.error) {
      toast.error(state.error)
    }
    if (state.fieldErrors) {
      Object.entries(state.fieldErrors).forEach(([field, errors]) => {
        errors.forEach((error) => {
          toast.error(`${field}: ${error}`)
        })
      })
    }
  }, [state])

  return (
    <form action={formAction} className='space-y-6'>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='display-name'>Nama Tampilan</FieldLabel>
          <FieldContent>
            <Input
              id='display-name'
              name='displayName'
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder='Contoh: Budi'
              required
            />
          </FieldContent>
          <FieldError
            errors={state.fieldErrors?.displayName?.map((e) => ({
              message: e
            }))}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor='name'>Nama Pengguna</FieldLabel>
          <FieldContent>
            <Input
              id='name'
              name='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='contoh_user'
              disabled
            />
          </FieldContent>
          <FieldError
            errors={state.fieldErrors?.name?.map((e) => ({ message: e }))}
          />
        </Field>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button
          type='submit'
          size='lg'
          className='rounded-full px-8'
          disabled={isPending}
        >
          {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  )
}
