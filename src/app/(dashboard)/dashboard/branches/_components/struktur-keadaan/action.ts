'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  deactivateOrganization,
  reactivateOrganization,
  readOrganization,
  readParentOrganization
} from '~/db/query/organization'
import { requireKestrukturanManageAccess } from '~/lib/auth/kestrukturan'
import {
  checkDeactivation,
  checkReactivation,
  type ChildRef
} from '~/lib/struktur/keadaan'
import {
  confirmsStrukturCode,
  WRONG_STRUKTUR_CODE
} from '~/lib/struktur/konfirmasi'
import { getLogger } from '~/lib/logger'
import { strukturKeadaanSchema } from './schema'

const logger = getLogger(['app', 'action', 'organization'])

/**
 * A refusal the surface can build an offer from, not just a sentence to show.
 *
 * `activeChildren` is what lets the sheet put "Pindahkan semua Komisariat Aktif
 * ke PW" next to the message and route to moving them one at a time (spec
 * §8.2). It is empty for every refusal that is not about children.
 */
export type StrukturKeadaanState = {
  success: boolean
  message: string
  activeChildren?: ChildRef[]
}

/**
 * Marks a Struktur Non-Aktif.
 *
 * The order is the whole design: **gate first, prerequisite second, never the
 * two folded together.** Kewenangan answers who may act; the prerequisite keeps
 * the tree consistent, and it binds everyone the gate lets through — Root
 * included. Folding it into the gate would invite the reading that a high
 * enough Kewenangan can push past it (spec §3, and the same argument governs
 * deletion).
 *
 * Kewenangan is asked with `nonaktifkan` and the reverse with `aktifkan`, but
 * the matrix answers them identically for every Jenjang: the Keadaan of the
 * target does not change who may manage it (spec §2.2). If it did, a Komisariat
 * that was deactivated could be revived by nobody below PP — a trap.
 */
export const deactivateStrukturAction = async (
  id: string,
  confirmCode: string
): Promise<StrukturKeadaanState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = strukturKeadaanSchema.safeParse({ id, confirmCode })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    const [org] = await readOrganization({ id: [id] })
    if (!org) return { success: false, message: 'Struktur tidak ditemukan.' }

    // **The PP clause is asked before the gate, and only this clause is.**
    //
    // The matrix refuses PP too (`canManageKestrukturan`, spec §2.3), so the
    // ban does not depend on this line and removing it opens nothing. What it
    // buys is the *reason*: reached gate-first, PP comes back as "Antum tidak
    // memiliki hak akses" — an authority answer to a question that spec §2.3
    // says is not about authority at all. Nobody holds this cell, Root
    // included, because "the central leadership is not currently running" is
    // not a state that means anything here. Saying so is the whole point.
    //
    // Every other prerequisite stays **after** the gate, where spec §3 puts it.
    const ppRefusal = checkDeactivation(org, [])
    if (ppRefusal?.reason === 'pp') {
      return { success: false, message: ppRefusal.message }
    }

    const denial = await requireKestrukturanManageAccess(id, 'nonaktifkan')
    if (denial) {
      logger.warn('Penonaktifan Struktur ditolak', {
        actorId: session.user.id,
        actorRole: session.user.role,
        organizationId: id,
        reason: denial
      })
      return { success: false, message: denial }
    }

    if (!confirmsStrukturCode(org, confirmCode)) {
      return { success: false, message: WRONG_STRUKTUR_CODE }
    }

    // Only Aktif children hold a deactivation up; ones already Non-Aktif may be
    // left where they are (spec §6.4).
    const activeChildren = await readOrganization({
      parentId: [org.id],
      state: ['aktif']
    })

    const refusal = checkDeactivation(org, activeChildren)
    if (refusal) {
      return {
        success: false,
        message: refusal.message,
        activeChildren:
          refusal.reason === 'anak-aktif' ? refusal.activeChildren : []
      }
    }

    await deactivateOrganization(org.id, session.user.id)
    updateTag('organizations')
    updateTag('struktur-slug')
    updateTag(`struktur-slug-${org.slug}`)
    // ADR 0013: Keadaan Struktur mengubah apa yang dilayani publik — Situs
    // mati, tapi Berita Jaringan-nya wajib ikut ter-invalidate juga, bukan
    // hanya cache dasbor.
    updateTag('berita-jaringan')
    revalidatePath('/dashboard/branches')

    logger.info('Struktur dinonaktifkan', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId: org.id
    })

    return { success: true, message: `${org.name} berhasil dinonaktifkan.` }
  } catch (error) {
    logger.error('Gagal menonaktifkan Struktur: {error}', {
      error,
      organizationId: id
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat menonaktifkan struktur.'
    }
  }
}

/**
 * Brings a Struktur back to Aktif.
 *
 * Its prerequisite is the **exact mirror** of the one above (spec §6.4):
 * deactivating an induk demands its living children leave first, reviving a
 * child demands its induk live first. One rule, two directions.
 *
 * It revives **one row**. Reviving an induk does not cascade to its children —
 * an unrequested mass state change is the fastest way to wake up Struktur that
 * were deliberately put to sleep, and the same argument refuses cascading
 * restore in spec §8.4.
 */
export const reactivateStrukturAction = async (
  id: string,
  confirmCode: string
): Promise<StrukturKeadaanState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = strukturKeadaanSchema.safeParse({ id, confirmCode })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    const denial = await requireKestrukturanManageAccess(id, 'aktifkan')
    if (denial) {
      logger.warn('Pengaktifan Struktur ditolak', {
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

    const refusal = checkReactivation(org, await readParentOrganization(org))
    if (refusal) return { success: false, message: refusal.message }

    await reactivateOrganization(org.id)
    updateTag('organizations')
    updateTag('struktur-slug')
    updateTag(`struktur-slug-${org.slug}`)
    // ADR 0013 — same reasoning as the deactivation branch above.
    updateTag('berita-jaringan')
    revalidatePath('/dashboard/branches')

    logger.info('Struktur diaktifkan kembali', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId: org.id
    })

    return {
      success: true,
      message: `${org.name} berhasil diaktifkan kembali.`
    }
  } catch (error) {
    logger.error('Gagal mengaktifkan Struktur: {error}', {
      error,
      organizationId: id
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat mengaktifkan struktur.'
    }
  }
}
