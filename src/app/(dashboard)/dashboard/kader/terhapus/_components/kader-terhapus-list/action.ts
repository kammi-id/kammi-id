'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { readDeletedMembers, restoreMember } from '~/db/query/member'
import { requireMemberTrashAccess } from '~/lib/auth/kekaderan'
import { getLogger } from '~/lib/logger'
import { restoreMemberSchema } from './schema'

const logger = getLogger(['app', 'action', 'member'])

export type RestoreMemberState = {
  success: boolean
  message: string
}

/**
 * Memulihkan satu Kader Terhapus beserta Akun-nya — Lapis 2 ADR 0021.
 * **Mengikuti Cakupan**, sengaja berbeda dari `restoreStrukturAction`, yang
 * terpusat: `requireMemberTrashAccess` memeriksa peran, dan
 * `readDeletedMembers` sendiri yang menyaring lewat Cakupan si pemanggil —
 * seorang BPK PD yang mencoba memulihkan Kader di luar Cakupannya mendapat
 * "Kader tidak ditemukan", persis seperti baris yang sungguh tidak ada.
 */
export const restoreMemberAction = async (
  id: string
): Promise<RestoreMemberState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = restoreMemberSchema.safeParse({ id })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    const scope = await requireMemberTrashAccess()
    if (!scope) {
      logger.warn('Pemulihan Kader ditolak', {
        actorId: session.user.id,
        actorRole: session.user.role,
        memberId: id
      })
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses untuk memulihkan Kader.'
      }
    }

    const [target] = await readDeletedMembers({ user: scope, id: [id] })
    if (!target) {
      return {
        success: false,
        message: 'Kader Terhapus tidak ditemukan, atau di luar Cakupan Antum.'
      }
    }

    await restoreMember(target.id)
    updateTag('kader')
    revalidatePath('/dashboard/kader/terhapus')
    revalidatePath('/dashboard/kader')
    revalidatePath('/dashboard/profile')

    logger.info('Kader dipulihkan', {
      actorId: session.user.id,
      actorRole: session.user.role,
      memberId: target.id,
      registerNumber: target.registerNumber
    })

    return { success: true, message: `${target.name} berhasil dipulihkan.` }
  } catch (error) {
    logger.error('Gagal memulihkan Kader: {error}', { error, memberId: id })
    return {
      success: false,
      message: 'Terjadi kesalahan saat memulihkan Kader.'
    }
  }
}
