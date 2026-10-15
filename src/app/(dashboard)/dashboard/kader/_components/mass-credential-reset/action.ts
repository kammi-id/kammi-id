'use server'

import { readActiveSession } from '~/lib/auth/cookies'
import { requireMassCredentialResetAccess } from '~/lib/auth/kaderisasi'
import { readUserCredential } from '~/db/query/user'
import { readOrganization } from '~/db/query/organization'
import {
  countMassResettableMemberAccounts,
  resetMassMemberCredentials,
  type MassCredentialResetRow
} from '~/db/query/mass-credential-reset'
import {
  confirmsStrukturCode,
  WRONG_STRUKTUR_CODE
} from '~/lib/struktur/konfirmasi'
import { getLogger } from '~/lib/logger'
import {
  massCredentialResetSchema,
  type MassCredentialResetInput
} from './schema'

const logger = getLogger(['app', 'action', 'mass-credential-reset'])

const GENERIC_FAILURE =
  'Regenerasi kredensial tidak dapat dilakukan. Periksa kembali data lalu coba lagi.'

export type MassCredentialResetPreview = {
  organizationId: string
  organizationName: string
  organizationCode: string
  count: number
}

/**
 * Lapis 1 dari tiga lapis konfirmasi: jumlah **terhitung**, dibaca saat
 * dialog dibuka untuk satu Struktur sasaran — bukan sebelumnya, dan bukan
 * dari cache, sebab peringatannya menjanjikan angka yang benar saat itu
 * juga.
 */
export const readMassCredentialResetPreviewAction = async (
  organizationId: string
): Promise<MassCredentialResetPreview | null> => {
  const scope = await requireMassCredentialResetAccess(organizationId)
  if (!scope) return null

  const [org] = await readOrganization({ id: [organizationId] })
  if (!org) return null

  const count = await countMassResettableMemberAccounts(organizationId)

  return {
    organizationId: org.id,
    organizationName: org.name,
    organizationCode: org.code,
    count
  }
}

export type MassCredentialResetResult = {
  success: boolean
  message: string
  rows?: MassCredentialResetRow[]
}

/**
 * Tiket 06 — regenerasi kredensial massal, aksi paling berkonsekuensi di
 * sistem ini. Tiga gerbang wajib lulus berurutan sebelum satu baris pun
 * tersentuh:
 *
 * 1. Kewenangan + Cakupan (`requireMassCredentialResetAccess` — Root/BPK,
 *    BPH ditolak).
 * 2. Kode Struktur yang diketik (`confirmsStrukturCode`, sama seperti setiap
 *    aksi berbahaya lain atas satu Struktur).
 * 3. Password pengurus yang menekannya, diverifikasi lewat
 *    `readUserCredential` + `Bun.password.verify` — pola yang sama persis
 *    dengan `updatePasswordAction`
 *    (`dashboard/user/account/_components/action/action.ts`).
 *
 * Ketiganya berhenti sebelum `resetMassMemberCredentials` dipanggil sama
 * sekali, jadi kegagalan di gerbang mana pun — termasuk password yang salah —
 * tidak pernah menyentuh satu baris `password_hash` ataupun `session`.
 */
export const regenerateMassCredentialsAction = async (
  input: MassCredentialResetInput
): Promise<MassCredentialResetResult> => {
  const parsed = massCredentialResetSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: GENERIC_FAILURE }

  const { organizationId, confirmCode, actorPassword } = parsed.data

  const session = await readActiveSession()
  if (!session?.user) {
    return { success: false, message: 'Sesi tidak ditemukan.' }
  }

  const scope = await requireMassCredentialResetAccess(organizationId)
  if (!scope) {
    logger.warn('Regenerasi kredensial massal ditolak', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId
    })
    return { success: false, message: GENERIC_FAILURE }
  }

  const [org] = await readOrganization({ id: [organizationId] })
  if (!org) return { success: false, message: 'Struktur tidak ditemukan.' }

  if (!confirmsStrukturCode(org, confirmCode)) {
    return { success: false, message: WRONG_STRUKTUR_CODE }
  }

  const [credential] = await readUserCredential(session.user.name)
  if (!credential) return { success: false, message: GENERIC_FAILURE }

  const isPasswordValid = await Bun.password.verify(
    actorPassword,
    credential.passwordHash
  )
  if (!isPasswordValid) {
    return { success: false, message: 'Password Antum saat ini salah.' }
  }

  try {
    const rows = await resetMassMemberCredentials(organizationId, scope)

    logger.info('Regenerasi kredensial massal berhasil', {
      actorId: session.user.id,
      actorRole: session.user.role,
      organizationId,
      organizationCode: org.code,
      affectedCount: rows.length
    })

    return {
      success: true,
      message: `${rows.length} Akun Kader berhasil diregenerasi.`,
      rows
    }
  } catch (error) {
    logger.error('Gagal melakukan regenerasi kredensial massal: {error}', {
      error,
      actorId: session.user.id,
      organizationId
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat regenerasi kredensial.'
    }
  }
}
