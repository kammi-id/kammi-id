'use client'

import { useActionState, useEffect } from 'react'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { updatePasswordAction, type PasswordFormState } from './action'
import { toast } from 'sonner'

export const PasswordForm = () => {
  const [state, formAction, isPending] = useActionState(updatePasswordAction, {
    success: false
  })

  useEffect(() => {
    if (state.success) {
      toast.success('Password updated successfully!')
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
          <FieldLabel htmlFor='current-password'>
            Kata Sandi Saat Ini
          </FieldLabel>
          <FieldContent>
            <Input
              id='current-password'
              name='currentPassword'
              type='password'
              placeholder='••••••••'
              required
            />
          </FieldContent>
          <FieldError
            errors={state.fieldErrors?.currentPassword?.map((e) => ({
              message: e
            }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='new-password'>Kata Sandi Baru</FieldLabel>
          <FieldContent>
            <Input
              id='new-password'
              name='newPassword'
              type='password'
              placeholder='••••••••'
              required
            />
          </FieldContent>
          <FieldError
            errors={state.fieldErrors?.newPassword?.map((e) => ({
              message: e
            }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='confirm-password'>
            Konfirmasi Kata Sandi Baru
          </FieldLabel>
          <FieldContent>
            <Input
              id='confirm-password'
              name='confirmPassword'
              type='password'
              placeholder='••••••••'
              required
            />
          </FieldContent>
          <FieldError
            errors={state.fieldErrors?.confirmPassword?.map((e) => ({
              message: e
            }))}
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
          {isPending ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
        </Button>
      </div>
    </form>
  )
}
