'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { requireSiteSettingsAccess } from '~/lib/auth/site-settings'
import { siteLinkSchema } from '~/lib/site-links'
import { upsertSiteSettings } from '~/db/query/site-settings'
import type { SettingsActionState } from '~/app/(dashboard)/dashboard/pages/home/_components/action'

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1)
})

const navSchema = z.object({
  navLinks: z.array(linkSchema).min(1),
  ctaBergabungLabel: z.string().min(1),
  ctaBergabungHref: siteLinkSchema,
  ctaBergabungIcon: z.string().max(50).default('join')
})

export const saveNavAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  const raw = Object.fromEntries(formData)
  let navLinks
  try {
    navLinks = JSON.parse(raw.navLinks as string)
  } catch {
    return { error: 'Data navigasi tidak valid.' }
  }

  const result = navSchema.safeParse({ ...raw, navLinks })
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

  try {
    await upsertSiteSettings('nav', result.data, orgId)
    revalidatePath('/')
    updateTag(`site-settings-nav-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan navigasi.' }
  }
}
