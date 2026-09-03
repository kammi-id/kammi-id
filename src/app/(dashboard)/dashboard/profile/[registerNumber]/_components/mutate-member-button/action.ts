'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { mutateMember, readMember } from '~/db/query/member'
import { readActiveSession } from '~/lib/auth/cookies'
import { requireMemberMutationAccess } from '~/lib/auth/kekaderan'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'member'])

type MutateMemberResult = {
  success: boolean
  message: string
}

export const mutateMemberAction = async (
  memberId: string,
  toOrganizationId: string
): Promise<MutateMemberResult> => {
  const session = await readActiveSession()
  if (!session?.user) {
    return { success: false, message: 'Tidak terautentikasi' }
  }

  const denial = await requireMemberMutationAccess()
  if (denial) return { success: false, message: denial }

  const [existing] = await readMember({ id: [memberId] })
  if (!existing) return { success: false, message: 'Kader tidak ditemukan' }

  if (existing.organizationId === toOrganizationId) {
    return {
      success: false,
      message: 'Struktur tujuan sama dengan Struktur asal'
    }
  }

  await mutateMember(memberId, toOrganizationId, session.user.id)

  updateTag('kader')
  revalidatePath('/dashboard/kader')
  revalidatePath('/dashboard/alumni')
  revalidatePath('/dashboard/pemandu')
  revalidatePath('/dashboard/instruktur')
  revalidatePath('/dashboard/profile')

  logger.info('Kader dimutasi', {
    actorId: session.user.id,
    actorRole: session.user.role,
    memberId,
    fromOrganizationId: existing.organizationId,
    toOrganizationId
  })

  return { success: true, message: 'Kader berhasil dimutasi.' }
}
