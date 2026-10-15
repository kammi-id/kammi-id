'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  readDeletedOrganizations,
  countAllChildrenByOrganization,
  countPublikasiByOrganization,
  hardDeleteOrganization,
  type Organization
} from '~/db/query/organization'
import { countMembersEverByOrganization } from '~/db/query/member'
import { countTrainingsByOrganization } from '~/db/query/training'
import { requireStrukturRestoreAccess } from '~/lib/auth/kestrukturan'
import {
  checkHardDeletion,
  type HardDeletionCounts,
  type HardDeletionRefusal
} from '~/lib/struktur/keadaan'
import {
  confirmsStrukturCode,
  WRONG_STRUKTUR_CODE
} from '~/lib/struktur/konfirmasi'
import { getLogger } from '~/lib/logger'
import { hardDeleteStrukturSchema, confirmationSentenceFor } from './schema'

const logger = getLogger(['app', 'action', 'organization'])

export type HardDeleteStrukturState = {
  success: boolean
  message: string
  counts?: HardDeletionCounts
}

/**
 * Prasyarat ADR 0019 dijalankan sungguhan atas satu baris — dipakai dua
 * tempat: `page.tsx` memakainya untuk menonaktifkan tombol **sebelum** ditekan
 * (spec kebiasaan repo ini: prasyarat yang tidak terpenuhi menonaktifkan
 * kontrolnya, bukan cuma menolak sesudah diklik), dan `hardDeleteStrukturAction`
 * memakainya lagi sebagai gerbang sungguhan di server, sebab jeda antara render
 * halaman dan klik tombol cukup untuk membuat jawabannya berubah.
 */
export const readHardDeleteRefusal = async (
  org: Pick<Organization, 'id' | 'type'>
): Promise<HardDeletionRefusal | null> => {
  const [children, membersEver, trainings, publikasi] = await Promise.all([
    countAllChildrenByOrganization(org.id),
    countMembersEverByOrganization(org.id),
    countTrainingsByOrganization(org.id),
    countPublikasiByOrganization(org.id)
  ])

  return checkHardDeletion(org, { children, membersEver, trainings, publikasi })
}

/**
 * Menghapus satu Struktur Terhapus dari basis data sungguhan — **satu-satunya
 * pengecualian ADR 0004**, di belakang gerbang yang jauh lebih ketat dari Hapus
 * biasa (ADR 0019, `checkHardDeletion`). Ireversibel: tidak ada "Pulihkan"
 * untuk baris yang sudah tidak ada.
 *
 * Gerbang kewenangannya sama dengan `pulihkan` (`requireStrukturRestoreAccess`
 * — Root dan BPW PP), bukan sel matriks baru: aksi ini hidup di permukaan yang
 * sama, atas baris yang sama-sama tidak terjangkau Cakupan mana pun, jadi
 * privilese menjangkau permukaan ini sudah menjadi privilese yang tepat untuk
 * menggerakkan aksi paling merusaknya juga.
 */
export const hardDeleteStrukturAction = async (
  id: string,
  confirmCode: string,
  confirmSentence: string
): Promise<HardDeleteStrukturState> => {
  try {
    const session = await readActiveSession()
    if (!session) return { success: false, message: 'Sesi tidak ditemukan.' }

    const validated = hardDeleteStrukturSchema.safeParse({
      id,
      confirmCode,
      confirmSentence
    })
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message ?? 'Validasi gagal.'
      }
    }

    const denial = await requireStrukturRestoreAccess()
    if (denial) {
      logger.warn('Hapus Selamanya ditolak', {
        actorId: session.user.id,
        actorRole: session.user.role,
        organizationId: id,
        reason: denial
      })
      return { success: false, message: denial }
    }

    const [org] = await readDeletedOrganizations({ id: [id] })
    if (!org) return { success: false, message: 'Struktur tidak ditemukan.' }

    if (!confirmsStrukturCode(org, confirmCode)) {
      return { success: false, message: WRONG_STRUKTUR_CODE }
    }

    // Gerbang kedua, dicek server terlepas dari yang pertama — dua field yang
    // sama-sama diketik salah wajib menghasilkan dua penolakan yang berbeda,
    // bukan satu yang menyembunyikan yang lain.
    if (confirmSentence.trim() !== confirmationSentenceFor(org.name)) {
      return {
        success: false,
        message: 'Kalimat konfirmasi yang dimasukkan tidak sesuai.'
      }
    }

    const refusal = await readHardDeleteRefusal(org)
    if (refusal) {
      return {
        success: false,
        message: refusal.message,
        counts: refusal.counts
      }
    }

    await hardDeleteOrganization(org.id)
    updateTag('organizations')
    updateTag('struktur-slug')
    updateTag(`struktur-slug-${org.slug}`)
    updateTag('berita-jaringan')
    revalidatePath('/dashboard/branches/terhapus')
    revalidatePath('/dashboard/branches')

    logger.info('Struktur dihapus selamanya', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId: org.id,
      organizationName: org.name
    })

    return {
      success: true,
      message: `${org.name} berhasil dihapus selamanya.`
    }
  } catch (error) {
    logger.error('Gagal menghapus Struktur selamanya: {error}', {
      error,
      organizationId: id
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus struktur secara permanen.'
    }
  }
}
