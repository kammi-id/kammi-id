'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { updateOrganization } from '~/db/query/organization'
import { requireOwnStrukturEditAccess } from '~/lib/auth/kestrukturan'
import { isSlugConflict } from '~/lib/struktur/slug-conflict'
import { getLogger, redact } from '~/lib/logger'
import { organizationProfileSchema } from './schema'

const logger = getLogger(['app', 'action', 'organization'])

export type OrganizationProfileState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
  values?: Record<string, string>
}

/**
 * BPH editing the identity of **its own** Struktur.
 *
 * There is no target argument, and that is the shape of the gate rather than an
 * omission: `requireOwnStrukturEditAccess` answers "may you" and "which one" in
 * one call, so authorization and the row being written can never disagree. It
 * also means this action cannot be pointed at somebody else's Struktur — not
 * because a check refuses it, but because there is nowhere to say it.
 */
export const updateOrganizationProfileAction = async (
  prevState: OrganizationProfileState,
  formData: FormData
): Promise<OrganizationProfileState> => {
  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    logo: formData.get('logo') as string | null
  }

  try {
    const org = await requireOwnStrukturEditAccess()
    if (!org) {
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses atas struktur ini.'
      }
    }

    const validated = organizationProfileSchema.safeParse(rawData)
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors,
        message: 'Validasi gagal. Silakan periksa kembali isian Antum.',
        values: Object.fromEntries(
          Object.entries(rawData).filter(([, value]) => value != null)
        ) as Record<string, string>
      }
    }

    await updateOrganization(validated.data, org.id)
    updateTag('organizations')
    revalidatePath('/dashboard/organization')

    logger.info('Profil Struktur diperbarui', {
      organizationId: org.id,
      input: redact(validated.data)
    })

    return { success: true, message: 'Profil struktur berhasil diperbarui.' }
  } catch (error) {
    // Slug bentrok mendarat **di field slug**, bukan di toast — ia bisa
    // diperbaiki di tempat (spec §4.3). Pola yang sama persis dipakai pemulihan
    // Struktur Terhapus; dua kegagalan bersebab identik tidak dijelaskan dengan
    // dua cara berbeda.
    if (isSlugConflict(error)) {
      return {
        success: false,
        errors: { slug: ['Slug ini sudah dipakai Struktur lain.'] },
        values: Object.fromEntries(
          Object.entries(rawData).filter(([, value]) => value != null)
        ) as Record<string, string>
      }
    }

    logger.error('Gagal memperbarui profil Struktur: {error}', {
      error,
      input: redact(rawData)
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil struktur.'
    }
  }
}
