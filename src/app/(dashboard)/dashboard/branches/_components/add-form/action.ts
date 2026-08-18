'use server'

import { readActiveSession } from '~/lib/auth/cookies'
import { z } from 'zod'
import { revalidatePath, updateTag } from 'next/cache'
import { createOrganization, updateOrganization } from '~/db/query/organization'
import {
  requireKestrukturanCreateAccess,
  requireKestrukturanManageAccess
} from '~/lib/auth/kestrukturan'
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

/**
 * **`code`, `type` and `parentId` are fixed at creation and never edited
 * afterwards** — for every Kewenangan, Root included (spec §2.4).
 *
 * `type` and `parentId` are what the Hapus action exists for: if a wrong
 * Jenjang could simply be edited, deletion would lose its reason to live.
 * `code` is frozen for a different reason and a heavier one — it is carried
 * into the permanent Nomor Induk of every Kader beneath it (ADR 0004), so
 * renaming it makes those numbers stop identifying the Struktur that issued
 * them.
 *
 * Omitting all three here means a posted value is **ignored outright** rather
 * than trusted. That is what closes the hole by construction, instead of by a
 * check somebody could forget to install.
 */
const orgUpdateSchema = orgSchema.omit({
  code: true,
  type: true,
  parentId: true
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

    // Gated after parsing, because the gate's questions are about the posted
    // `parentId` and `type` — it cannot be asked before they are known to be
    // well-formed.
    const denial = await requireKestrukturanCreateAccess(
      validated.data.parentId,
      validated.data.type
    )
    if (denial) {
      logger.warn('Pembuatan Struktur ditolak', {
        actorId: user?.id,
        actorRole: user?.role,
        parentId: validated.data.parentId,
        requestedType: validated.data.type,
        reason: denial
      })
      return { success: false, message: denial }
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

    id = formData.get('id') as string
    if (!id) {
      return { success: false, message: 'ID organisasi tidak ditemukan.' }
    }

    // `sunting` only. `code`, `type` and `parentId` are frozen at creation, and
    // `orgUpdateSchema` above drops them outright rather than trusting a posted
    // value — the Jenjang a Struktur occupies is what Hapus exists for.
    const denial = await requireKestrukturanManageAccess(id, 'sunting')
    if (denial) {
      logger.warn('Penyuntingan Struktur ditolak', {
        actorId: user?.id,
        actorRole: user?.role,
        organizationId: id,
        reason: denial
      })
      return { success: false, message: denial }
    }

    rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      logo: formData.get('logo') as string | null
    }

    const validated = orgUpdateSchema.safeParse(rawData)

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
