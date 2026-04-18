'use server'

import { cookies } from 'next/headers'
import { revalidatePath, updateTag } from 'next/cache'
import { validateSession } from '~/lib/auth/api'
import { updateUser, readUser, readUserCredential } from '~/db/query/user'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.').optional(),
  displayName: z.string().min(1, 'Nama tampilan wajib diisi.')
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi.'),
  newPassword: z.string().min(8, 'Kata sandi baru minimal harus 8 karakter.'),
  confirmPassword: z.string().min(1, 'Mohon konfirmasi kata sandi baru Anda.')
})

export type ProfileFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export type PasswordFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export const updateProfileAction = async (
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> => {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('kammi_id_session')?.value

  if (!sessionToken) {
    return { error: 'Tidak terautentikasi' }
  }

  const session = await validateSession(sessionToken)
  if (!session) {
    return { error: 'Tidak terautentikasi' }
  }

  const rawFormData = Object.fromEntries(formData.entries())
  const validatedFields = profileSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    return {
      fieldErrors: validatedFields.error.flatten().fieldErrors as Record<
        string,
        string[]
      >
    }
  }

  const { name, displayName } = validatedFields.data

  try {
    await updateUser({ name, displayName }, session.userId)
    updateTag('user')
    revalidatePath('/dashboard/user/account')
    return { success: true }
  } catch (e: any) {
    console.error(e)
    if (e.message?.includes('unique constraint')) {
      return { error: 'Nama pengguna sudah digunakan.' }
    }
    return { error: 'Gagal memperbarui profil.' }
  }
}

export const updatePasswordAction = async (
  _prevState: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> => {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('kammi_id_session')?.value

  if (!sessionToken) {
    return { error: 'Tidak terautentikasi' }
  }

  const session = await validateSession(sessionToken)
  if (!session) {
    return { error: 'Tidak terautentikasi' }
  }

  const rawFormData = Object.fromEntries(formData.entries())
  const validatedFields = passwordSchema.safeParse(rawFormData)

  if (!validatedFields.success) {
    return {
      fieldErrors: validatedFields.error.flatten().fieldErrors as Record<
        string,
        string[]
      >
    }
  }

  const { currentPassword, newPassword, confirmPassword } = validatedFields.data

  if (newPassword !== confirmPassword) {
    return { error: 'Kata sandi baru dan konfirmasi tidak cocok.' }
  }

  try {
    const [user] = await readUser({ id: [session.userId] })
    if (!user) {
      return { error: 'Pengguna tidak ditemukan.' }
    }

    // We need the password hash. readUser (via withUserCTE) explicitly omits it.
    // We must use a direct query or a specific credential reader.
    // Let's use readUserCredential but it needs name.
    // We have user.name now.
    const [credentials] = await readUserCredential(user.name)
    if (!credentials) {
      return { error: 'Gagal mengambil kredensial kata sandi.' }
    }

    const isPasswordValid = await Bun.password.verify(
      currentPassword,
      credentials.passwordHash
    )
    if (!isPasswordValid) {
      return { error: 'Kata sandi saat ini salah.' }
    }

    const newPasswordHash = await Bun.password.hash(newPassword)
    await updateUser({ passwordHash: newPasswordHash }, session.userId)

    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: 'Gagal memperbarui kata sandi.' }
  }
}
