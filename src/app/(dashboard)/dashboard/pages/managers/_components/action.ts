'use server'

import { cookies } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { validateSession } from '~/lib/auth/api'
import { upsertSiteSettings } from '~/db/query/site-settings'
import { z } from 'zod'

export type SettingsActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  values?: Record<string, string>
}

const checkAccess = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('kammi_id_session')?.value
  if (!token) return null

  const session = await validateSession(token)
  if (!session) return null

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumasPP = role === 'humas' && connectedOrganization?.type === 'pp'

  if (!isRoot && !isHumasPP) return null
  return session
}

const leadershipSchema = z.object({
  periodLabel: z.string().min(1),
  heading: z.string().min(1, 'Judul seksi wajib diisi.'),
  leaders: z
    .array(
      z.object({
        name: z.string().min(1, 'Nama wajib diisi.'),
        role: z.string().min(1, 'Jabatan wajib diisi.'),
        photoUrl: z.string().min(1, 'URL foto wajib diisi.')
      })
    )
    .min(1)
})

export const saveLeadershipAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  if (!(await checkAccess())) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  const leadersJson = raw.leaders as string

  let leaders
  try {
    leaders = JSON.parse(leadersJson)
  } catch {
    return { error: 'Data pengurus tidak valid.' }
  }

  const result = leadershipSchema.safeParse({ ...raw, leaders })
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries({ periodLabel: raw.periodLabel, heading: raw.heading })
          .filter(([, v]) => v != null && typeof v === 'string')
      ) as Record<string, string>
    }
  }

  try {
    await upsertSiteSettings('leadership', result.data)
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan kepemimpinan.' }
  }
}
