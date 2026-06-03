'use server'

import { cookies } from 'next/headers'
import { revalidatePath, updateTag } from 'next/cache'
import { validateSession } from '~/lib/auth/api'
import { upsertSiteSettings } from '~/db/query/site-settings'
import { z } from 'zod'

export type SettingsActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  values?: Record<string, string>
}

const checkAccess = async (): Promise<{ orgId: string } | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('kammi_id_session')?.value
  if (!token) return null

  const session = await validateSession(token)
  if (!session) return null

  const { role, connectedOrganization } = session.user
  if (role !== 'root' && role !== 'humas') return null

  const orgId = connectedOrganization?.id
  if (!orgId) return null

  return { orgId }
}

const persist = async (
  key: string,
  data: unknown,
  orgId: string,
  errorMsg: string
): Promise<SettingsActionState> => {
  try {
    await upsertSiteSettings(key, data, orgId)
    revalidatePath('/tentang')
    revalidatePath('/dashboard/pages/tentang')
    updateTag(`site-settings-tentang-${orgId}`)
    return { success: true }
  } catch {
    return { error: errorMsg }
  }
}

// ─── Hero background ──────────────────────────────────────────────────────────

const heroBgSchema = z.object({
  heroImageUrl: z.string()
})

export const saveTentangHeroAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  const result = heroBgSchema.safeParse(raw)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries(raw).filter(
          ([, v]) => v != null && typeof v === 'string'
        )
      ) as Record<string, string>
    }
  }

  return persist(
    'tentang-hero',
    result.data,
    access.orgId,
    'Gagal menyimpan latar hero.'
  )
}

// ─── Prinsip images ───────────────────────────────────────────────────────────

const prinsipSchema = z.object({
  prinsipImages: z.array(z.string()).length(6)
})

export const saveTentangPrinsipAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  let prinsipImages
  try {
    prinsipImages = JSON.parse(raw.prinsipImages as string)
  } catch {
    return { error: 'Data gambar prinsip tidak valid.' }
  }

  const result = prinsipSchema.safeParse({ prinsipImages })
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries(raw).filter(
          ([, v]) => v != null && typeof v === 'string'
        )
      ) as Record<string, string>
    }
  }

  return persist(
    'tentang-prinsip',
    result.data,
    access.orgId,
    'Gagal menyimpan gambar prinsip.'
  )
}

// ─── Paradigma images ─────────────────────────────────────────────────────────

const paradigmaSchema = z.object({
  paradigmaImages: z.array(z.string()).length(4)
})

export const saveTentangParadigmaAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  let paradigmaImages
  try {
    paradigmaImages = JSON.parse(raw.paradigmaImages as string)
  } catch {
    return { error: 'Data gambar paradigma tidak valid.' }
  }

  const result = paradigmaSchema.safeParse({ paradigmaImages })
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries(raw).filter(
          ([, v]) => v != null && typeof v === 'string'
        )
      ) as Record<string, string>
    }
  }

  return persist(
    'tentang-paradigma',
    result.data,
    access.orgId,
    'Gagal menyimpan gambar paradigma.'
  )
}
