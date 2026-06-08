'use server'

import { readActiveSession } from '~/lib/auth/cookies'
import { z } from 'zod'
import { revalidatePath, updateTag } from 'next/cache'
import { createOrganization, updateOrganization } from '~/db/query/organization'
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'organization'])

const orgSchema = z.object({
  name: z.string().min(1, 'Nama organisasi wajib diisi.'),
  code: z.string().min(1, 'Kode organisasi wajib diisi.'),
  type: z.enum(['pp', 'pw', 'pd', 'pdln', 'pk'], {
    message: 'Tipe organisasi tidak valid.'
  }),
  parentId: z.string().min(1, 'Parent ID wajib diisi.'),
  slug: z.string().min(1, 'Slug organisasi wajib diisi.'),
  logo: z.string().optional()
})

export type OrgFormState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
  values?: Record<string, string>
}

export async function createOrganizationAction(
  prevState: OrgFormState,
  formData: FormData
) {
  let user:
    | NonNullable<Awaited<ReturnType<typeof readActiveSession>>>['user']
    | undefined
  let rawData: Record<string, FormDataEntryValue | string | null> | undefined

  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    user = session.user
    if (!user || (user.role !== 'bpw' && user.role !== 'root')) {
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses untuk menambah organisasi.'
      }
    }

    rawData = {
      name: formData.get('name'),
      code: formData.get('code'),
      type: formData.get('type'),
      parentId: formData.get('parentId'),
      slug: formData.get('slug'),
      logo: formData.get('logo') as string | null
    }

    const validated = orgSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors,
        message: 'Validasi gagal. Silakan periksa kembali inputan Anda.',
        values: Object.fromEntries(
          Object.entries(rawData).filter(([, v]) => v != null)
        ) as Record<string, string>
      }
    }

    const created = await createOrganization(validated.data)
    updateTag('organizations')
    revalidatePath('/dashboard/branches')

    logger.info('Organisasi dibuat', {
      actorId: user.id,
      actorRole: user.role,
      organizationId: created?.[0]?.id,
      input: redact(validated.data)
    })

    return {
      success: true,
      message: 'Organisasi berhasil ditambahkan!'
    }
  } catch (error) {
    logger.error('Gagal membuat organisasi: {error}', {
      error,
      actorId: user?.id,
      input: redact(rawData)
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat menambahkan organisasi.'
    }
  }
}

export async function updateOrganizationAction(
  prevState: OrgFormState,
  formData: FormData
) {
  let user:
    | NonNullable<Awaited<ReturnType<typeof readActiveSession>>>['user']
    | undefined
  let id: string | undefined
  let rawData: Record<string, FormDataEntryValue | string | null> | undefined

  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    user = session.user
    if (!user || (user.role !== 'bpw' && user.role !== 'root')) {
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses untuk memperbarui organisasi.'
      }
    }

    id = formData.get('id') as string
    if (!id) {
      return { success: false, message: 'ID organisasi tidak ditemukan.' }
    }

    rawData = {
      name: formData.get('name'),
      code: formData.get('code'),
      type: formData.get('type'),
      parentId: formData.get('parentId'),
      slug: formData.get('slug'),
      logo: formData.get('logo') as string | null
    }

    const validated = orgSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors,
        message: 'Validasi gagal. Silakan periksa kembali inputan Anda.',
        values: Object.fromEntries(
          Object.entries({ ...rawData, id }).filter(([, v]) => v != null)
        ) as Record<string, string>
      }
    }

    await updateOrganization({ ...validated.data }, id)
    updateTag('organizations')
    revalidatePath('/dashboard/branches')

    logger.info('Organisasi diperbarui', {
      actorId: user.id,
      actorRole: user.role,
      organizationId: id,
      input: redact(validated.data)
    })

    return {
      success: true,
      message: 'Organisasi berhasil diperbarui!'
    }
  } catch (error) {
    logger.error('Gagal memperbarui organisasi: {error}', {
      error,
      actorId: user?.id,
      organizationId: id,
      input: redact(rawData)
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui organisasi.'
    }
  }
}
