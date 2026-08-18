'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  readDeletedOrganizations,
  readOrganization,
  restoreOrganization
} from '~/db/query/organization'
import { requireStrukturRestoreAccess } from '~/lib/auth/kestrukturan'
import { checkRestore } from '~/lib/struktur/keadaan'
import { isSlugConflict } from '~/lib/struktur/slug-conflict'
import { getLogger } from '~/lib/logger'
import { restoreStrukturSchema } from './schema'

const logger = getLogger(['app', 'action', 'organization'])

export type RestoreStrukturState = {
  success: boolean
  message?: string
  /** A slug clash lands **in the field**, never in a toast (spec §4.3). */
  slugError?: string
}

/**
 * What the dialog needs the moment it opens, so the problem is visible
 * **before** the button is pressed rather than after.
 */
export type RestoreInfo = {
  slug: string
  /** Who holds the old slug now, when somebody does. Named, not hinted at. */
  slugTakenBy: string | null
  /** A free slug, offered as a filled-in field — never applied silently. */
  suggestedSlug: string
  refusal: string | null
  /** Set when the induk is Terhapus too: its row is on this same page. */
  refusalParentId: string | null
}

const isSlugFree = async (slug: string): Promise<boolean> =>
  (await readOrganization({ slug })).length === 0

/**
 * A free slug to offer. **Automatic suffixing was rejected** (spec §8.4) — it
 * changes a URL with nobody deciding to, and it hides the very information that
 * explains why this Struktur was deleted in the first place. So this is a
 * suggestion typed into a field a person can see and overwrite, not a fallback
 * the server applies on its own.
 */
const suggestFreeSlug = async (slug: string): Promise<string> => {
  for (let n = 2; n < 10; n++) {
    const candidate = `${slug}-${n}`
    if (await isSlugFree(candidate)) return candidate
  }
  return `${slug}-pulihan`
}

/**
 * The row and the verdict on its induk — the pair both entry points need, read
 * once so the dialog and the write cannot disagree about what they saw.
 *
 * The induk is looked for **twice**: through the ordinary reader, which filters
 * Terhapus (spec §7), and then through the one that does the opposite. Which of
 * the two finds it is exactly what decides which refusal the person gets.
 */
const readRestoreContext = async (id: string) => {
  const [org] = await readDeletedOrganizations({ id: [id] })
  if (!org) return null

  const [liveParent] = org.parentId
    ? await readOrganization({ id: [org.parentId] })
    : []
  const [deletedParent] = org.parentId
    ? await readDeletedOrganizations({ id: [org.parentId] })
    : []

  return {
    org,
    refusal: checkRestore(org, liveParent ?? null, deletedParent ?? null)
  }
}

export const readRestoreInfoAction = async (
  id: string
): Promise<RestoreInfo | null> => {
  const denial = await requireStrukturRestoreAccess()
  if (denial) return null

  const context = await readRestoreContext(id)
  if (!context) return null
  const { org, refusal } = context

  const [holder] = await readOrganization({ slug: org.slug })

  return {
    slug: org.slug,
    slugTakenBy: holder?.name ?? null,
    suggestedSlug: holder ? await suggestFreeSlug(org.slug) : org.slug,
    refusal: refusal?.message ?? null,
    refusalParentId:
      refusal?.reason === 'induk-terhapus' ? refusal.parent.id : null
  }
}

/**
 * Restores one Struktur Terhapus — **one row, always landing on Aktif**.
 *
 * Chained restore is refused by construction: there is nothing here that walks
 * descendants. Restoring an induk together with everything under it is a mass
 * state change nobody asked for, so the order is top-down, one at a time, and
 * the surface is what shows the order (spec §8.4).
 */
export const restoreStrukturAction = async (
  id: string,
  slug?: string
): Promise<RestoreStrukturState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = restoreStrukturSchema.safeParse({ id, slug })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    // Root, and a BPW whose connected Struktur is PP. **Not** `role === 'bpw'`,
    // which would open the recycle bin to every BPW in the country.
    const denial = await requireStrukturRestoreAccess()
    if (denial) {
      logger.warn('Pemulihan Struktur ditolak', {
        actorId: session.user.id,
        actorRole: session.user.role,
        organizationId: id,
        reason: denial
      })
      return { success: false, message: denial }
    }

    const context = await readRestoreContext(id)
    if (!context) {
      return { success: false, message: 'Struktur tidak ditemukan.' }
    }
    const { org, refusal } = context
    if (refusal) return { success: false, message: refusal.message }

    const desiredSlug = slug?.trim() || org.slug
    if (desiredSlug !== org.slug || !(await isSlugFree(desiredSlug))) {
      const holders = await readOrganization({ slug: desiredSlug })
      if (holders.length > 0) {
        return {
          success: false,
          slugError: `Slug ini sedang dipakai ${holders[0].name}.`
        }
      }
    }

    await restoreOrganization(
      org.id,
      desiredSlug === org.slug ? undefined : desiredSlug
    )
    updateTag('organizations')
    revalidatePath('/dashboard/branches/terhapus')
    revalidatePath('/dashboard/branches')

    logger.info('Struktur dipulihkan', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId: org.id
    })

    return { success: true, message: `${org.name} berhasil dipulihkan.` }
  } catch (error) {
    // Ada jeda antara cek saat dialog dibuka dan simpan saat tombol ditekan,
    // dan slug bisa berpindah tangan di dalam jeda itu. Galatnya mendarat di
    // field slug — pola yang sama persis dengan tiket 25.
    if (isSlugConflict(error)) {
      return {
        success: false,
        slugError: 'Slug ini sudah dipakai Struktur lain.'
      }
    }

    logger.error('Gagal memulihkan Struktur: {error}', {
      error,
      organizationId: id
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat memulihkan struktur.'
    }
  }
}
