'use server'

import { z } from 'zod'
import { revalidatePath, updateTag } from 'next/cache'
import { createMember, updateMember } from '~/db/query/member'
import { generateRegisterNumber } from '~/lib/utils/member'
import { readActiveSession } from '~/lib/auth/cookies'
import { regionApi } from '~/lib/api/region'
import { fetchAllowedOrgIds } from '~/db/query/organization'

const booleanSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true
    if (val.toLowerCase() === 'false') return false
  }
  return val
}, z.boolean())

const memberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nama wajib diisi.'),
  gender: z.enum(['ikhwan', 'akhwat']),
  status: z.enum(['ab1', 'ab2', 'ab3']),
  yearOfEntry: z.coerce.number().min(1998).max(new Date().getFullYear()),
  organizationId: z.string().uuid(),
  phone: z.string().optional().nullable(),
  addressProvince: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressDistrict: z.string().optional().nullable(),
  addressSubdistrict: z.string().optional().nullable(),
  addressProvinceCode: z.string().optional().nullable(),
  addressCityCode: z.string().optional().nullable(),
  addressDistrictCode: z.string().optional().nullable(),
  addressSubdistrictCode: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  isAlumn: booleanSchema.default(false),
  isSuspended: booleanSchema.default(false),
  isNonActive: booleanSchema.default(false),
  isCertifiedMentor: booleanSchema.default(false),
  isCertifiedInstructor: booleanSchema.default(false)
})

export type MemberFormState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
  values?: Record<string, unknown>
}

export const createMemberAction = async (
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi' }

  const rawData = Object.fromEntries(formData.entries())
  const validated = memberSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      message: 'Validasi gagal.',
      values: rawData
    }
  }

  // Access Validation
  const { user } = session
  if (!user) return { success: false, message: 'Pengguna tidak ditemukan' }

  const allowedOrgIds = await fetchAllowedOrgIds(user)
  if (!allowedOrgIds.includes(validated.data.organizationId)) {
    return {
      success: false,
      message:
        'Antum tidak memiliki otoritas untuk menambahkan kader di wilayah ini.'
    }
  }

  const mutationRoles = ['root', 'bph', 'bpk', 'bpw']
  if (!mutationRoles.includes(user.role)) {
    return {
      success: false,
      message: 'Role antum tidak diizinkan untuk melakukan mutasi data.'
    }
  }

  try {
    const registerNumber = await generateRegisterNumber(
      validated.data.organizationId,
      validated.data.yearOfEntry
    )

    await createMember({
      ...validated.data,
      registerNumber
    })

    updateTag('members')
    revalidatePath('/dashboard/members')
    revalidatePath('/dashboard/alumni')
    revalidatePath('/dashboard/pemandu')
    revalidatePath('/dashboard/instruktur')

    return { success: true, message: 'Kader berhasil ditambahkan!' }
  } catch (error: unknown) {
    console.error(error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Gagal menambahkan kader.',
      values: rawData
    }
  }
}

export const updateMemberAction = async (
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi' }

  const rawData = Object.fromEntries(formData.entries())
  const validated = memberSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      message: 'Validasi gagal.',
      values: rawData
    }
  }

  const { id, ...data } = validated.data
  if (!id) return { success: false, message: 'ID Kader tidak ditemukan.' }

  // Access Validation
  const { user } = session
  if (!user) return { success: false, message: 'Pengguna tidak ditemukan' }

  const allowedOrgIds = await fetchAllowedOrgIds(user)
  if (!allowedOrgIds.includes(data.organizationId)) {
    return {
      success: false,
      message:
        'Antum tidak memiliki otoritas untuk memperbarui kader di wilayah ini.'
    }
  }

  const mutationRoles = ['root', 'bph', 'bpk', 'bpw']
  if (!mutationRoles.includes(user.role)) {
    return {
      success: false,
      message: 'Role antum tidak diizinkan untuk melakukan mutasi data.'
    }
  }

  try {
    await updateMember(data, id)

    updateTag('members')
    revalidatePath('/dashboard/members')
    revalidatePath('/dashboard/alumni')
    revalidatePath('/dashboard/pemandu')
    revalidatePath('/dashboard/instruktur')

    return { success: true, message: 'Data kader berhasil diperbarui!' }
  } catch (error: unknown) {
    console.error(error)
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui data kader.',
      values: rawData
    }
  }
}

export const fetchProvincesAction = async () => {
  try {
    const data = await regionApi.getProvinces()
    return { data, success: true }
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'Gagal mengambil data',
      success: false
    }
  }
}

export const fetchCitiesAction = async (provinceCode: string) => {
  try {
    const data = await regionApi.getCities(provinceCode)
    return { data, success: true }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : 'Gagal mengambil data kota',
      success: false
    }
  }
}

export const fetchDistrictsAction = async (cityCode: string) => {
  try {
    const data = await regionApi.getDistricts(cityCode)
    return { data, success: true }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Gagal mengambil data kecamatan',
      success: false
    }
  }
}

export const fetchVillagesAction = async (districtCode: string) => {
  try {
    const data = await regionApi.getVillages(districtCode)
    return { data, success: true }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : 'Gagal mengambil data desa',
      success: false
    }
  }
}
