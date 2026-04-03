'use client'

import {
  type JSX,
  type ComponentPropsWithoutRef as ComponentProps,
  useActionState,
  useState,
  useRef,
  useEffect
} from 'react'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError
} from '~/components/shadcn/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '~/components/shadcn/ui/input-group'
import { Input } from '~/components/shadcn/ui/input'
import { Button } from '~/components/shadcn/ui/button'
import { Spinner } from '~/components/shadcn/ui/spinner'
import Alert from '~/components/common/alert'
import Form from 'next/form'
import { loginAction } from './action'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogIn, Eye, EyeOff, XOctagon } from 'lucide-react'

const LoginForm = ({
  ...props
}: ComponentProps<typeof FieldGroup>): JSX.Element => {
  const [state, action, isPending] = useActionState(loginAction, undefined)
  const [showPassword, setShowPassword] = useState(false)
  const prevPendingRef = useRef(isPending)
  const router = useRouter()

  useEffect(() => {
    if (prevPendingRef.current && !isPending) {
      if (!state?.errors) {
        toast.success('Login berhasil. Selamat datang di KAMMI.id.')
        router.push('/dashboard')
      }
    }

    prevPendingRef.current = isPending
  }, [state, isPending])

  return (
    <Form action={action}>
      {state?.errors && (
        <Alert
          className='mb-6'
          variant='destructive'
          title='Kesalahan'
          icon={<XOctagon className='size-4' />}
        >
          <FieldError
            errors={state?.errors.filter((issue) => issue.path.length === 0)}
          />
        </Alert>
      )}
      <FieldGroup {...props}>
        <Field>
          <FieldLabel htmlFor='name'>Username</FieldLabel>
          <Input
            type='text'
            id='name'
            name='name'
            defaultValue={state?.inputs?.[0]}
            minLength={1}
            autoComplete='username'
            disabled={isPending}
            required
          />
          <FieldError
            errors={state?.errors?.filter((issue) => issue.path[0] === 0)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='password'>Password</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type={showPassword ? 'text' : 'password'}
              id='password'
              name='password'
              minLength={8}
              autoComplete='current-password'
              disabled={isPending}
              required
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className='size-4' />
                ) : (
                  <Eye className='size-4' />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError
            errors={state?.errors?.filter((issue) => issue.path[0] === 1)}
          />
        </Field>
        <Field>
          <Button type='submit' disabled={isPending}>
            {isPending ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <LogIn data-icon='inline-start' />
            )}
            <span>Login</span>
          </Button>
        </Field>
      </FieldGroup>
    </Form>
  )
}

export default LoginForm
