'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireSiteSettingsAccess } from '~/lib/auth/site-settings'
import { footerContentSchema } from '~/lib/site-links'
import { listSitePages } from '~/db/query/site-pages'
import { readSiteSettings, upsertSiteSettings } from '~/db/query/site-settings'
import type { SettingsActionState } from '~/app/(dashboard)/dashboard/pages/home/_components/action'

export const saveFooterAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access
  let input: unknown
  try {
    input = JSON.parse(String(formData.get('footer')))
  } catch {
    return { error: 'Data footer tidak valid.' }
  }
  // `footerContentSchema` strips unknown keys, so the client-only sortable
  // `id` each link carries never reaches the stored settings.
  const result = footerContentSchema.safeParse(input)
  if (!result.success)
    return {
      error: result.error.issues.map((issue) => issue.message).join(' '),
      fieldErrors: result.error.flatten().fieldErrors
    }
  try {
    const pages = await listSitePages(orgId)
    const pageIds = new Set(pages.map((page) => page.id))
    if (
      result.data.menus.some((menu) =>
        menu.links.some((link) => link.pageId && !pageIds.has(link.pageId))
      )
    ) {
      return {
        error:
          'Halaman harus sudah Terbit dan milik Struktur ini. Pilih ulang halaman yang tidak tersedia.'
      }
    }
    const previous = await readSiteSettings<Record<string, unknown>>(
      'footer',
      {},
      orgId
    )
    await upsertSiteSettings('footer', { ...previous, ...result.data }, orgId)
    revalidatePath('/')
    updateTag(`site-settings-footer-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan footer.' }
  }
}
