'use server'

import { revalidatePath, updateTag } from 'next/cache'
import {
  createMember,
  updateMember,
  readMember,
  mutateMember
} from '~/db/query/member'
import { generateRegisterNumber } from '~/lib/utils/member'
import { readActiveSession } from '~/lib/auth/cookies'
import { requireMemberMutationAccess } from '~/lib/auth/kekaderan'
import { regionApi } from '~/lib/api/region'
import { fetchAllowedOrgIds } from '~/db/query/organization'
import { db } from '~/db/db'
import { and, or, ilike, sql } from 'drizzle-orm'
import { withMemberCTE } from '~/db/query/cte/member'
import { getLogger, redact } from '~/lib/logger'
import { memberSchema } from './schema'

const logger = getLogger(['app', 'action', 'member'])

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
  if (!session) {
    return { success: false, message: 'Tidak terautentikasi' }
  }

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

  const { user } = session
  if (!user) {
    return { success: false, message: 'Pengguna tidak ditemukan' }
  }

  const allowedOrgIds = await fetchAllowedOrgIds(user)

  if (!allowedOrgIds.includes(validated.data.organizationId)) {
    return {
      success: false,
      message:
        'Antum tidak memiliki otoritas untuk menambahkan kader di wilayah ini.'
    }
  }

  const mutationRoles = ['root', 'bpk']
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

    updateTag('kader')
    revalidatePath('/dashboard/kader')
    revalidatePath('/dashboard/alumni')
    revalidatePath('/dashboard/pemandu')
    revalidatePath('/dashboard/instruktur')

    logger.info('Kader ditambahkan', {
      actorId: user.id,
      actorRole: user.role,
      registerNumber,
      organizationId: validated.data.organizationId
    })

    return { success: true, message: 'Kader berhasil ditambahkan!' }
  } catch (error: unknown) {
    logger.error('Gagal menambahkan kader: {error}', {
      error,
      actorId: user.id,
      organizationId: validated.data.organizationId,
      input: redact(rawData)
    })
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

  // ... existing code ...
  const mutationRoles = ['root', 'bpk']
  if (!mutationRoles.includes(user.role)) {
    return {
      success: false,
      message: 'Role antum tidak diizinkan untuk melakukan mutasi data.'
    }
  }
  // ... existing code ...

  try {
    const [existing] = await readMember({ id: [id] })
    if (!existing) return { success: false, message: 'Kader tidak ditemukan.' }

    // Struktur crosses a Cakupan boundary — a stricter, Root/BPK-PP-only gate
    // than the general field-edit check above (ADR 0020 §4). Everything else
    // in this same save still only needs the looser `mutationRoles` check.
    const isMutation = existing.organizationId !== data.organizationId
    if (isMutation) {
      const denial = await requireMemberMutationAccess()
      if (denial) return { success: false, message: denial }
    }

    const { organizationId: _organizationId, ...fieldsWithoutOrg } = data

    // One transaction, not two sequential calls: an unrelated field edit in
    // this same save and its organizationId change must commit — or roll
    // back — together, never one without the other.
    await db.transaction(async (tx) => {
      await updateMember(fieldsWithoutOrg, id, tx)
      if (isMutation) {
        await mutateMember(id, data.organizationId, user.id, tx)
      }
    })

    updateTag('kader')
    revalidatePath('/dashboard/kader')
    revalidatePath('/dashboard/alumni')
    revalidatePath('/dashboard/pemandu')
    revalidatePath('/dashboard/instruktur')
    revalidatePath('/dashboard/profile')

    logger.info('Data kader diperbarui', {
      actorId: user.id,
      actorRole: user.role,
      memberId: id,
      organizationId: data.organizationId,
      mutated: isMutation
    })

    return { success: true, message: 'Data kader berhasil diperbarui!' }
  } catch (error: unknown) {
    logger.error('Gagal memperbarui data kader: {error}', {
      error,
      actorId: user.id,
      memberId: id,
      input: redact(rawData)
    })
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

export const searchMembersAction = async (query: string) => {
  try {
    const session = await readActiveSession()
    if (!session)
      return { data: [], success: false, message: 'Tidak terautentikasi' }

    // We need to search by Name OR RegisterNumber OR Phone
    // readMember uses AND, so we'll use a custom query for OR
    const results = await db
      .with(withMemberCTE)
      .select()
      .from(withMemberCTE)
      .where(
        and(
          sql`${withMemberCTE.status} IN ('ab2', 'ab3')`,
          sql`${withMemberCTE.isSuspended} = false`,
          sql`${withMemberCTE.isNonActive} = false`,
          or(
            ilike(withMemberCTE.name, `%${query}%`),
            ilike(withMemberCTE.registerNumber, `%${query}%`),
            ilike(withMemberCTE.phone, `%${query}%`)
          )
        )
      )
      .limit(10)

    return { data: results, success: true }
  } catch (error: unknown) {
    return {
      data: [],
      success: false,
      message: error instanceof Error ? error.message : 'Gagal mencari kader'
    }
  }
}
