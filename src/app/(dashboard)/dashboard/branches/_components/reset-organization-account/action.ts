'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/db/db'
import { resetOrganizationAccount } from '~/db/query/organization-account-reset'
import { readOrganization } from '~/db/query/organization'
import { user } from '~/db/schema/user.sql'
import { requireOrganizationAccountResetAccess } from '~/lib/auth/kestrukturan'
import { readActiveSession } from '~/lib/auth/cookies'
import { getLogger } from '~/lib/logger'
import { generatePassword, hashPassword } from '~/lib/utils/user'

const logger = getLogger(['app', 'action', 'organization-account-reset'])

const resetSchema = z.object({
  targetAccountId: z.uuidv7(),
  targetOrganizationId: z.uuidv7(),
  actorPassword: z.string().min(1)
})

type ResetOrganizationAccountResult = {
  success: boolean
  message: string
  credential?: {
    username: string
    password: string
    organizationIsNonActive: boolean
  }
}

const GENERIC_FAILURE =
  'Reset password tidak dapat dilakukan. Periksa kembali data lalu coba lagi.'

export const resetOrganizationAccountAction = async (
  input: z.input<typeof resetSchema>
): Promise<ResetOrganizationAccountResult> => {
  const parsed = resetSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: GENERIC_FAILURE }

  const session = await readActiveSession()
  if (!session?.user) return { success: false, message: GENERIC_FAILURE }

  const { targetAccountId, targetOrganizationId, actorPassword } = parsed.data

  try {
    const access =
      await requireOrganizationAccountResetAccess(targetOrganizationId)
    if (!access || access.role !== session.user.role) {
      return { success: false, message: GENERIC_FAILURE }
    }

    const [[actor], [targetOrganization]] = await Promise.all([
      db
        .select({ passwordHash: user.passwordHash })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1),
      readOrganization({ id: [targetOrganizationId] })
    ])
    if (!actor || !targetOrganization) {
      return { success: false, message: GENERIC_FAILURE }
    }
    if (!(await Bun.password.verify(actorPassword, actor.passwordHash))) {
      return { success: false, message: 'Password saat ini tidak sesuai.' }
    }

    const password = generatePassword()
    const reset = await resetOrganizationAccount({
      actorId: session.user.id,
      targetAccountId,
      targetOrganizationId,
      passwordHash: await hashPassword(password),
      accessScope: access
    })

    logger.info('Password Akun Kepengurusan direset', {
      actorId: session.user.id,
      targetOrganizationId
    })
    return {
      success: true,
      message: 'Password Akun Kepengurusan berhasil direset.',
      credential: {
        username: reset.username,
        password,
        organizationIsNonActive: targetOrganization.state === 'non_aktif'
      }
    }
  } catch (error) {
    logger.warn('Reset password Akun Kepengurusan ditolak atau gagal', {
      actorId: session.user.id,
      targetOrganizationId,
      error
    })
    return { success: false, message: GENERIC_FAILURE }
  }
}
