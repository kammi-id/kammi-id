'use server'

import { readUserCredential } from '~/db/query/user'
import { createSession } from '~/lib/auth/api'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '~/db/db'
import { user as userTable } from '~/db/schema/user.sql'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

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
      values: { username: typeof rawFormData.username === 'string' ? rawFormData.username : '' }
    }
  }

  const { username, password } = validatedFields.data

  const [user] = await readUserCredential(username)

  if (!user) {
    return { error: 'Username atau password salah.' }
  }

  const isPasswordValid = await Bun.password.verify(password, user.passwordHash)

  if (!isPasswordValid) {
    return { error: 'Username atau password salah.' }
  }

  const [dbUser] = await db!
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.name, username))
    .limit(1)

  if (!dbUser) {
    return { error: 'Terjadi kesalahan saat memproses login.' }
  }

  const session = await createSession(dbUser.id)

  if (!session) {
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

  redirect('/dashboard')
}

export default loginFormAction
