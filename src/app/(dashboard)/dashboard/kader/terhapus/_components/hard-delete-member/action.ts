'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { readAccessScope } from '~/lib/auth/access-scope'
import {
  readDeletedMembers,
  hardDeleteMember,
  countMutationsByMember,
  type DeletedMember
} from '~/db/query/member'
import {
  countTrainingAttendancesByMember,
  countTrainingInstructionsByMember
} from '~/db/query/training'
import { countMemberAcademicByMember } from '~/db/query/academic'
import { countMemberCareerByMember } from '~/db/query/career'
import { countMemberOrganizationHistoryByMember } from '~/db/query/organization-history'
import { requireMemberHardDeleteAccess } from '~/lib/auth/kekaderan'
import {
  checkHardDeletionMember,
  type MemberHardDeletionCounts,
  type MemberHardDeletionRefusal
} from '~/lib/kekaderan/keadaan'
import { getLogger } from '~/lib/logger'
import { hardDeleteMemberSchema, confirmationSentenceFor } from './schema'

const logger = getLogger(['app', 'action', 'member'])

export type HardDeleteMemberState = {
  success: boolean
  message: string
  counts?: MemberHardDeletionCounts
}

/**
 * Prasyarat ADR 0021 dijalankan sungguhan atas satu baris — dipakai dua
 * tempat, sama seperti `readHardDeleteRefusal` Struktur: `page.tsx` untuk
 * menonaktifkan tombol **sebelum** ditekan, dan `hardDeleteMemberAction`
 * lagi sebagai gerbang sungguhan di server.
 */
export const readHardDeleteMemberRefusal = async (
  member: Pick<DeletedMember, 'id'>
): Promise<MemberHardDeletionRefusal | null> => {
  const [
    trainingAttendant,
    trainingInstructor,
    academic,
    career,
    organizationHistory,
    mutation
  ] = await Promise.all([
    countTrainingAttendancesByMember(member.id),
    countTrainingInstructionsByMember(member.id),
    countMemberAcademicByMember(member.id),
    countMemberCareerByMember(member.id),
    countMemberOrganizationHistoryByMember(member.id),
    countMutationsByMember(member.id)
  ])

  return checkHardDeletionMember({
    trainingAttendant,
    trainingInstructor,
    academic,
    career,
    organizationHistory,
    mutation
  })
}

/**
 * Menghapus satu Kader Terhapus dari basis data sungguhan — Lapis 3 ADR
 * 0021, di belakang gerbang yang jauh lebih sempit dari Lapis 1/2
 * (`requireMemberHardDeleteAccess` — Root dan BPK PP saja). Ireversibel:
 * tidak ada "Pulihkan" untuk baris yang sudah tidak ada, dan Akun-nya ikut
 * lenyap lewat `ON DELETE CASCADE`.
 */
export const hardDeleteMemberAction = async (
  id: string,
  confirmSentence: string,
  confirmRegisterNumber: string
): Promise<HardDeleteMemberState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = hardDeleteMemberSchema.safeParse({
      id,
      confirmSentence,
      confirmRegisterNumber
    })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    const denial = await requireMemberHardDeleteAccess()
    if (denial) {
      logger.warn('Hapus Selamanya Kader ditolak', {
        actorId: session.user.id,
        actorRole: session.user.role,
        memberId: id,
        reason: denial
      })
      return { success: false, message: denial }
    }

    const scope = await readAccessScope()
    if (!scope) return { success: false, message: 'Sesi tidak ditemukan.' }

    const [target] = await readDeletedMembers({ user: scope, id: [id] })
    if (!target) return { success: false, message: 'Kader tidak ditemukan.' }

    if (confirmSentence.trim() !== confirmationSentenceFor(target.name)) {
      return {
        success: false,
        message: 'Kalimat konfirmasi yang dimasukkan tidak sesuai.'
      }
    }

    // Gerbang kedua, dicek terlepas dari yang pertama — dua field yang
    // sama-sama diketik salah wajib menghasilkan dua penolakan yang
    // berbeda, bukan satu yang menyembunyikan yang lain.
    if (confirmRegisterNumber.trim() !== target.registerNumber) {
      return {
        success: false,
        message: 'NIA yang dimasukkan tidak sesuai.'
      }
    }

    const refusal = await readHardDeleteMemberRefusal(target)
    if (refusal) {
      return {
        success: false,
        message: refusal.message,
        counts: refusal.counts
      }
    }

    await hardDeleteMember(target.id)
    updateTag('kader')
    revalidatePath('/dashboard/kader/terhapus')
    revalidatePath('/dashboard/kader')

    logger.info('Kader dihapus selamanya', {
      actorId: session.user.id,
      actorRole: session.user.role,
      memberId: target.id,
      registerNumber: target.registerNumber
    })

    return {
      success: true,
      message: `${target.name} berhasil dihapus selamanya.`
    }
  } catch (error) {
    logger.error('Gagal menghapus Kader selamanya: {error}', {
      error,
      memberId: id
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus Kader secara permanen.'
    }
  }
}
