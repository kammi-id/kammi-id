'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  moveOrganizationParent,
  readOrganization,
  readParentOrganization,
  type Organization
} from '~/db/query/organization'
import { requireStrukturMoveAccess } from '~/lib/auth/kestrukturan'
import {
  checkMoveCandidate,
  type StrukturRef
} from '~/lib/struktur/pindah-induk'
import {
  confirmsStrukturCode,
  WRONG_STRUKTUR_CODE
} from '~/lib/struktur/konfirmasi'
import { getLogger } from '~/lib/logger'
import { moveParentSchema, moveChildrenToParentSchema } from './schema'

const logger = getLogger(['app', 'action', 'organization'])

export type MoveParentState = {
  success: boolean
  message: string
}

/** The move rule reads four columns; `Organization` carries more. */
const toRef = (org: Organization): StrukturRef => ({
  id: org.id,
  type: org.type,
  code: org.code,
  state: org.state
})

/**
 * Moves one Struktur beneath a different induk.
 *
 * **`parentId` is the only column that changes, on the one row that moves.**
 * Kader and Daurah point at the Komisariat rather than at its induk, so they do
 * not travel; a Daurah held in the past stays recorded as held by that
 * Komisariat, which remains true. What changes is only which Daerah it reads
 * under today (spec §6.1).
 */
export const moveStrukturParentAction = async (
  id: string,
  newParentId: string,
  confirmCode: string
): Promise<MoveParentState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = moveParentSchema.safeParse({
      id,
      newParentId,
      confirmCode
    })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    const denial = await requireStrukturMoveAccess(id, newParentId)
    if (denial) {
      logger.warn('Pemindahan induk ditolak', {
        actorId: session.user.id,
        actorRole: session.user.role,
        organizationId: id,
        newParentId,
        reason: denial
      })
      return { success: false, message: denial }
    }

    const [org] = await readOrganization({ id: [id] })
    const [destination] = await readOrganization({ id: [newParentId] })
    if (!org || !destination) {
      return { success: false, message: 'Struktur tidak ditemukan.' }
    }

    if (!confirmsStrukturCode(org, confirmCode)) {
      return { success: false, message: WRONG_STRUKTUR_CODE }
    }

    const parent = await readParentOrganization(org)
    const refusal = checkMoveCandidate(
      toRef(org),
      parent ? toRef(parent) : null,
      toRef(destination)
    )
    if (refusal) return { success: false, message: refusal }

    await moveOrganizationParent([org.id], destination.id)
    updateTag('organizations')
    revalidatePath('/dashboard/branches')

    logger.info('Induk Struktur dipindahkan', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId: org.id,
      fromParentId: org.parentId,
      toParentId: destination.id
    })

    return {
      success: true,
      message: `${org.name} berhasil dipindahkan ke ${destination.name}.`
    }
  } catch (error) {
    logger.error('Gagal memindahkan induk Struktur: {error}', {
      error,
      organizationId: id,
      newParentId
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat memindahkan induk struktur.'
    }
  }
}

/**
 * Parks every **Aktif** child of `id` directly beneath that Struktur's own
 * induk — the shortcut offered when a deactivation is refused for still having
 * Aktif children (spec §8.2).
 *
 * It is *penitipan, not penempatan*: it exists so a Daerah that has wound down
 * can be deactivated today, with its Komisariat placed properly one at a time
 * afterwards. That is also why there is no destination to choose — every child
 * of a Daerah sits in that Daerah's PW, and the PW is a legal induk for all of
 * them, so the shortcut has zero failing cases and needs zero per-row picking.
 *
 * Children that are already Non-Aktif stay where they are: only Aktif children
 * block a deactivation (spec §6.4), so moving the rest would be a state change
 * nobody asked for.
 *
 * **One action, one gate** — the `code` typed is the source Struktur's, once,
 * not each child's in turn.
 */
export const moveActiveChildrenToParentAction = async (
  id: string,
  confirmCode: string
): Promise<MoveParentState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = moveChildrenToParentSchema.safeParse({ id, confirmCode })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    const [org] = await readOrganization({ id: [id] })
    if (!org) return { success: false, message: 'Struktur tidak ditemukan.' }

    if (!confirmsStrukturCode(org, confirmCode)) {
      return { success: false, message: WRONG_STRUKTUR_CODE }
    }

    const destination = await readParentOrganization(org)
    if (!destination) {
      return {
        success: false,
        message: 'Struktur ini tidak punya induk untuk menampung anaknya.'
      }
    }

    const children = await readOrganization({
      parentId: [org.id],
      state: ['aktif']
    })
    if (children.length === 0) {
      return {
        success: false,
        message: 'Tidak ada Struktur aktif di bawah struktur ini.'
      }
    }

    // Authority is asked per child rather than once for the group: the group is
    // a convenience, and a convenience is not a reason to check less. The
    // typing gate is what stays singular.
    for (const child of children) {
      const denial = await requireStrukturMoveAccess(child.id, destination.id)
      if (denial) {
        logger.warn('Pemindahan massal ditolak', {
          actorId: session.user.id,
          actorRole: session.user.role,
          organizationId: org.id,
          childId: child.id,
          reason: denial
        })
        return { success: false, message: denial }
      }

      // Belt for a claim, not a branch anyone expects to take: every child of a
      // Daerah is legal beneath that Daerah's PW. If this ever fires, the
      // assumption broke and refusing the whole batch beats moving half of it.
      const refusal = checkMoveCandidate(
        toRef(child),
        toRef(org),
        toRef(destination)
      )
      if (refusal) return { success: false, message: refusal }
    }

    await moveOrganizationParent(
      children.map((child) => child.id),
      destination.id
    )
    updateTag('organizations')
    revalidatePath('/dashboard/branches')

    logger.info('Struktur anak dipindahkan massal', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId: org.id,
      toParentId: destination.id,
      movedCount: children.length
    })

    return {
      success: true,
      message: `${children.length} Struktur dipindahkan ke ${destination.name}.`
    }
  } catch (error) {
    logger.error('Gagal memindahkan Struktur anak: {error}', {
      error,
      organizationId: id
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat memindahkan struktur anak.'
    }
  }
}
