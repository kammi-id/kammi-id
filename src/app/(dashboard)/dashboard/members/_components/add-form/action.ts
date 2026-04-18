'use server'

import { z } from 'zod'
import { revalidatePath, updateTag } from 'next/cache'
import { createMember } from '~/db/query/member'
import { generateRegisterNumber } from '~/lib/utils/member'
import { readActiveSession } from '~/lib/auth/cookies'

const memberSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  gender: z.enum(['ikhwan', 'akhwat']),
  status: z.enum(['ab1', 'ab2', 'ab3']),
  yearOfEntry: z.coerce.number().min(1900).max(new Date().getFullYear()),
  organizationId: z.string().uuid()
})

export type MemberFormState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

export const createMemberAction = async (prevState: MemberFormState, formData: FormData): Promise<MemberFormState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi' }

  const validated = memberSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      message: 'Validasi gagal.'
    }
  }

  try {
    const registerNumber = await generateRegisterNumber(
      validated.data.organizationId,
      validated.data.yearOfEntry
    )

    await createMember({
      ...validated.data,
      registerNumber,
      isAlumn: false,
      isSuspended: false,
      isNonActive: false,
      isCertifiedMentor: false,
      isCertifiedInstructor: false
    })

    updateTag('members')
    revalidatePath('/dashboard/members')

    return { success: true, message: 'Kader berhasil ditambahkan!' }
  } catch (error: any) {
    console.error(error)
    return { success: false, message: error.message || 'Gagal menambahkan kader.' }
  }
}
