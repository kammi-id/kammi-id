'use server'

import { readUserCredential } from '~/db/query/user'
import { createSession } from '~/lib/auth/api'
import { mayHoldSession } from '~/lib/auth/keadaan-akun'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'auth'])

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.')
})

export type LoginFormState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  issues?: Array<{ message: string; path: PropertyKey[] }>
  values?: { username?: string }
}

const loginFormAction = async (
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> => {
  const rawFormData = Object.fromEntries(formData.entries())
  const validatedFields = loginSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    return {
      fieldErrors: validatedFields.error.flatten().fieldErrors,
      issues: validatedFields.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path
      })),
      values: {
        username:
          typeof rawFormData.username === 'string' ? rawFormData.username : ''
      }
    }
  }

  const { username, password } = validatedFields.data

  const [user] = await readUserCredential(username)

  if (!user) {
    logger.warning('Percobaan login gagal: username tidak ditemukan', {
      input: redact({ username })
    })
    return { error: 'Username atau password salah.' }
  }

  const isPasswordValid = await Bun.password.verify(password, user.passwordHash)

  if (!isPasswordValid) {
    logger.warning('Percobaan login gagal: password salah', {
      input: redact({ username })
    })
    return { error: 'Username atau password salah.' }
  }

  // Keadaan Akun, spec §5. Login is the one door that does not pass through
  // `validateSession`, so the gate is asked again here — without it the cookie
  // would be set and the very next request would throw it away, which is a
  // redirect loop rather than a refusal.
  //
  // **The message is identical to a genuinely wrong password**, for a Struktur
  // Non-Aktif and a Struktur Terhapus alike. That is the user's decision
  // (spec §5.5), taken over an agent's proposal to distinguish Non-Aktif, and
  // it is not to be reopened. The cost is carried elsewhere: whoever
  // deactivates a Struktur must tell its officers **outside the system**.
  if (!mayHoldSession(user.role, user.strukturState)) {
    logger.warning('Percobaan login gagal: Struktur tidak aktif', {
      input: redact({ username })
    })
    return { error: 'Username atau password salah.' }
  }

  const session = await createSession(user.id)

  if (!session) {
    logger.error('Gagal membuat sesi login', { userId: user.id })
    return { error: 'Gagal membuat sesi login.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('kammi_id_session', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 3 // 3 hari
  })

  logger.info('Login berhasil', { userId: user.id, username })

  redirect('/dashboard')
}

export default loginFormAction
