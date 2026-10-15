'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  readOrganization,
  softDeleteOrganization
} from '~/db/query/organization'
import { countLiveMembersByOrganization } from '~/db/query/member'
import { countTrainingsByOrganization } from '~/db/query/training'
import { requireKestrukturanManageAccess } from '~/lib/auth/kestrukturan'
import { checkDeletion, type DeletionCounts } from '~/lib/struktur/keadaan'
import {
  confirmsStrukturCode,
  WRONG_STRUKTUR_CODE
} from '~/lib/struktur/konfirmasi'
import { getLogger } from '~/lib/logger'
import { deleteStrukturSchema } from './schema'

const logger = getLogger(['app', 'action', 'organization'])

/**
 * The refusal carries the counts, not a boolean, so the surface can write
 * "Tidak bisa dihapus: masih ada 847 Kader dan 3 Komisariat" as a whole
 * sentence rather than a tooltip (spec §8.2).
 */
export type DeleteStrukturState = {
  success: boolean
  message: string
  counts?: DeletionCounts
}

/**
 * Deletes a Struktur — **soft, and there is no other kind** (ADR 0004).
 *
 * ## What holds it up, in full
 *
 * **Nol Struktur anak, nol Member, nol Daurah** (spec §3). The three counts are
 * gathered here and judged by `checkDeletion`, which states each clause.
 *
 * The children count comes from `readOrganization`, so it inherits the read
 * invariant and lands exactly where the prerequisite wants it: **Non-Aktif
 * children count** and hold the deletion up, **Terhapus children do not**,
 * because Terhapus is treated as though the row had never been there. That is
 * not restated here — it is the same filter every other read gets (spec §7),
 * and the price is a Terhapus-beneath-Terhapus chain that spec §8.4 handles.
 *
 * Publikasi is **not** a prerequisite: Artikel, Kategori Artikel and Pengaturan
 * Situs may dangle. Since tiket 13 cut the cascades, they dangle rather than
 * being silently carried off.
 *
 * ## What is not looked at
 *
 * **The Keadaan it starts from.** A Non-Aktif Struktur may be deleted directly;
 * the empty-contents prerequisite is the only guard. Requiring it be reactivated
 * first would be ritual without protection — one would simply click Aktifkan
 * then Hapus — and a Non-Aktif Struktur that is completely empty is precisely
 * the "created and never actually ran" case deletion exists for (spec §1.5).
 *
 * ## Who it binds
 *
 * **Everyone, Root included.** Cakupan limits reach; the prerequisite keeps the
 * data consistent. Root passes through the first and never the second, which is
 * why the prerequisite sits here — after the gate, outside it — rather than in
 * `requireKestrukturanManageAccess`.
 */
export const deleteStrukturAction = async (
  id: string,
  confirmCode: string
): Promise<DeleteStrukturState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = deleteStrukturSchema.safeParse({ id, confirmCode })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    const denial = await requireKestrukturanManageAccess(id, 'hapus')
    if (denial) {
      logger.warn('Penghapusan Struktur ditolak', {
        actorId: session.user.id,
        actorRole: session.user.role,
        organizationId: id,
        reason: denial
      })
      return { success: false, message: denial }
    }

    const [org] = await readOrganization({ id: [id] })
    if (!org) return { success: false, message: 'Struktur tidak ditemukan.' }

    if (!confirmsStrukturCode(org, confirmCode)) {
      return { success: false, message: WRONG_STRUKTUR_CODE }
    }

    const [children, members, trainings] = await Promise.all([
      readOrganization({ parentId: [org.id] }),
      countLiveMembersByOrganization(org.id),
      countTrainingsByOrganization(org.id)
    ])

    const counts: DeletionCounts = {
      children: children.length,
      members,
      trainings
    }

    const refusal = checkDeletion(org, counts)
    if (refusal) {
      return { success: false, message: refusal.message, counts }
    }

    await softDeleteOrganization(org.id, session.user.id)
    updateTag('organizations')
    updateTag('struktur-slug')
    updateTag(`struktur-slug-${org.slug}`)
    // ADR 0013: Struktur Terhapus disaring dari Berita Jaringan — tanpa ini
    // Berita-nya tetap muncul di sana sampai `cacheLife('days')` habis
    // sendiri.
    updateTag('berita-jaringan')
    revalidatePath('/dashboard/branches')

    logger.info('Struktur dihapus', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId: org.id
    })

    return { success: true, message: `${org.name} berhasil dihapus.` }
  } catch (error) {
    logger.error('Gagal menghapus Struktur: {error}', {
      error,
      organizationId: id
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus struktur.'
    }
  }
}
