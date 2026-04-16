'use client'

import * as React from 'react'
import { cn } from '~/lib/shadcn/utils'
import { Button } from '~/components/shadcn/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError
} from '~/components/shadcn/ui/field'
import { Input } from '~/components/shadcn/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '~/components/shadcn/ui/input-group'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  LayoutBottomIcon,
  ViewIcon,
  ViewOffIcon,
  Loading03Icon
} from '@hugeicons/core-free-icons'
import loginFormAction from './action'
import { toast } from 'sonner'

import Image from 'next/image'
import logo from '~/assets/logo.png'

const LoginForm = ({
  className,
  message,
  ...props
}: React.ComponentProps<'div'> & { message?: string }) => {
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, action, isPending] = React.useActionState(loginFormAction, {})

  React.useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state.error])

  React.useEffect(() => {
    if (message === 'logout_success') {
      toast.success('Antum berhasil keluar.')
    }
  }, [message])

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form action={action}>
        <FieldGroup>
          <div className='flex flex-col items-center gap-2 text-center'>
            <a
              href='#'
              className='flex flex-col items-center gap-2 font-medium'
            >
              <div className='flex items-center justify-center rounded-md'>
                <Image
                  src={logo}
                  alt='KAMMI.id'
                  width={64}
                  height={64}
                  className='size-16 object-contain'
                />
              </div>
              <span className='sr-only'>KAMMI.id</span>
            </a>
            <h1 className='text-xl font-bold'>Selamat Datang di KAMMI.id</h1>
          </div>

          <Field data-invalid={!!state.fieldErrors?.username || undefined}>
            <FieldLabel htmlFor='username'>Username</FieldLabel>
            <Input
              id='username'
              name='username'
              placeholder='Contoh: bpk-kalteng, bph-kota-jogja, bph-uny'
              required
              aria-invalid={!!state.fieldErrors?.username || undefined}
            />
            <FieldError
              errors={state.fieldErrors?.username?.map((m) => ({ message: m }))}
            />
          </Field>

          <Field data-invalid={!!state.fieldErrors?.password || undefined}>
            <div className='flex items-center'>
              <FieldLabel htmlFor='password'>Password</FieldLabel>
              <a
                href='#'
                className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
              >
                Lupa password?
              </a>
            </div>
            <InputGroup>
              <InputGroupInput
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Masukkan password antum.'
                required
                aria-invalid={!!state.fieldErrors?.password || undefined}
              />
              <InputGroupAddon align='inline-end'>
                <InputGroupButton
                  type='button'
                  size='icon-xs'
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                  }
                >
                  <HugeiconsIcon
                    icon={showPassword ? ViewOffIcon : ViewIcon}
                    strokeWidth={2}
                  />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldError
              errors={state.fieldErrors?.password?.map((m) => ({ message: m }))}
            />
          </Field>

          <Field>
            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className='animate-spin'
                  data-icon='inline-start'
                />
              )}
              {isPending ? 'Memproses...' : 'Masuk'}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className='px-6 text-center'>
        Dengan mengeklik Masuk, Anda menyetujui{' '}
        <a href='#'>Syarat dan Ketentuan</a> dan{' '}
        <a href='#'>Kebijakan Privasi</a> KAMMI.id.
      </FieldDescription>
    </div>
  )
}

export default LoginForm
