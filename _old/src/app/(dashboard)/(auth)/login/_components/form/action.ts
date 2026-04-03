'use server'

import { verifyUser } from '~/db/query/user'
import { createSession } from '~/lib/auth/session'
import { cookies } from 'next/headers'
import z from 'zod'

const loginActionSchema: z.ZodType<Parameters<typeof verifyUser>> = z.tuple([
  z.string().min(1, 'Username wajib diisi.'),
  z.string().min(1, 'Masukkan password Anda.')
])

type LoginActionState =
  | {
      errors: z.core.$ZodIssue[]
      inputs: z.infer<typeof loginActionSchema>
      success?: undefined
    }
  | {
      errors?: undefined
      inputs?: undefined
      success: true
    }

export const loginAction = async (
  _state: LoginActionState | undefined,
  formData: FormData
): Promise<LoginActionState> => {
  const inputs = [
    formData.get('name') as string,
    formData.get('password') as string
  ] as NonNullable<LoginActionState['inputs']>

  const validatedInputs = loginActionSchema.safeParse(inputs)
  if (!validatedInputs.success) {
    return {
      errors: validatedInputs.error.issues,
      inputs
    }
  }

  const [verificationError, sessionUser] = await verifyUser(
    ...validatedInputs.data
  )
  if (verificationError) {
    return {
      errors: [
        {
          code: 'custom',
          path: [],
          message: verificationError.message
        }
      ],
      inputs
    }
  }

  const [sessionError, session] = await createSession(sessionUser.id)
  if (sessionError) {
    return {
      errors: [
        {
          code: 'custom',
          path: [],
          message: sessionError.message
        }
      ],
      inputs
    }
  }

  const cookieStore = await cookies()
  cookieStore.set('kammi-id-session', session.token, {
    path: '/',
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  return {
    success: true
  }
}
