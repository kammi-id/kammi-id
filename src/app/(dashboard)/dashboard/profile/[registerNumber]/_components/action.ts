'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { updateMember } from '~/db/query/member'
import { readActiveSession } from '~/lib/auth/cookies'

export type ProfileEditState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const booleanField = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val === 'true') return true
    if (val === 'false') return false
  }
  return val
}, z.boolean())

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  gender: z.enum(['ikhwan', 'akhwat']),
  status: z.enum(['ab1', 'ab2', 'ab3']),
  yearOfEntry: z.coerce.number().min(1998).max(new Date().getFullYear()),
  phone: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  addressProvince: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressDistrict: z.string().optional().nullable(),
  addressSubdistrict: z.string().optional().nullable(),
  addressProvinceCode: z.string().optional().nullable(),
  addressCityCode: z.string().optional().nullable(),
  addressDistrictCode: z.string().optional().nullable(),
  addressSubdistrictCode: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  isAlumn: booleanField.default(false),
  isSuspended: booleanField.default(false),
  isNonActive: booleanField.default(false),
  isCertifiedMentor: booleanField.default(false),
  isCertifiedInstructor: booleanField.default(false)
})

const canEditMember = (
  session: { user: { role: string; connectedMember?: { id: string } | null } },
  memberId: string
): boolean => {
  const { role, connectedMember } = session.user
  if (role === 'root' || role === 'bpk') return true
  if (role === 'member' && connectedMember?.id === memberId) return true
  return false
}

export const updateMemberProfileAction = async (
  memberId: string,
  prevState: ProfileEditState,
  formData: FormData
): Promise<ProfileEditState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEditMember(session, memberId)) {
    return { success: false, message: 'Akses ditolak.' }
  }

  const raw = Object.fromEntries(formData.entries())
  const parsed = profileSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    }
  }

  await updateMember(parsed.data, memberId)
  revalidatePath(`/dashboard/profile`)

  return { success: true, message: 'Data berhasil diperbarui.' }
}

export const updateMemberPhotoAction = async (
  memberId: string,
  photoPath: string
): Promise<void> => {
  const session = await readActiveSession()
  if (!session) throw new Error('Tidak terautentikasi.')
  if (!canEditMember(session, memberId)) throw new Error('Akses ditolak.')

  await updateMember({ photo: photoPath }, memberId)
  revalidatePath(`/dashboard/profile`)
}
