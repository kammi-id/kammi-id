'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireSiteSettingsAccess } from '~/lib/auth/site-settings'
import { upsertSiteSettings } from '~/db/query/site-settings'
import { z } from 'zod'

export type SettingsActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  values?: Record<string, string>
}

const personSchema = z.object({
  name: z.string(),
  photoUrl: z.string()
})

const leaderMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  photoUrl: z.string()
})

const leaderBlockSchema = z.object({
  id: z.string(),
  title: z.string(),
  members: z.array(leaderMemberSchema)
})

const leadershipSchema = z.object({
  periodLabel: z.string().min(1, 'Label periode wajib diisi.'),
  heading: z.string().min(1, 'Judul seksi wajib diisi.'),
  triumvirate: z.object({
    ketua: personSchema,
    sekretaris: personSchema,
    bendahara: personSchema
  }),
  leaders: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      photoUrl: z.string()
    })
  ),
  leaderBlocks: z.array(leaderBlockSchema)
})

export const saveLeadershipAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  const raw = Object.fromEntries(formData)

  let leaders, triumvirate, leaderBlocks
  try {
    leaders = JSON.parse(raw.leaders as string)
    triumvirate = JSON.parse(raw.triumvirate as string)
    leaderBlocks = JSON.parse(raw.leaderBlocks as string)
  } catch {
    return { error: 'Data pengurus tidak valid.' }
  }

  const result = leadershipSchema.safeParse({
    ...raw,
    leaders,
    triumvirate,
    leaderBlocks
  })
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries({
          periodLabel: raw.periodLabel,
          heading: raw.heading
        }).filter(([, v]) => v != null && typeof v === 'string')
      ) as Record<string, string>
    }
  }

  try {
    await upsertSiteSettings('leadership', result.data, orgId)
    revalidatePath('/')
    updateTag(`site-settings-leadership-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan kepemimpinan.' }
  }
}
