'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath, updateTag } from 'next/cache'
import { db } from '~/db/db'
import { member as memberTable } from '~/db/schema/member.sql'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'
import { deleteMember } from '~/db/query/member'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'member'])

type DeleteMemberResult = {
  success: boolean
  message: string
}

export const deleteMemberAction = async (
  memberId: string,
  confirmInput: string
): Promise<DeleteMemberResult> => {
  const session = await readActiveSession()
  if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }

  const { user } = session
  if (!['root', 'bpk'].includes(user.role)) {
    return { success: false, message: 'Role tidak diizinkan untuk aksi ini' }
  }

  const [memberRow] = await db
    .select({
      id: memberTable.id,
      name: memberTable.name,
      registerNumber: memberTable.registerNumber,
      organizationId: memberTable.organizationId
    })
    .from(memberTable)
    .where(eq(memberTable.id, memberId))
    .limit(1)

  if (!memberRow) return { success: false, message: 'Kader tidak ditemukan' }

  const inScope = await isOrgInScope(user, memberRow.organizationId)
  if (!inScope) {
    return {
      success: false,
      message: 'Kader ini bukan dalam scope organisasi antum'
    }
  }

  if (confirmInput !== memberRow.registerNumber) {
    return {
      success: false,
      message: 'Nomor anggota yang dimasukkan tidak sesuai'
    }
  }

  await deleteMember(memberRow.id)

  updateTag('kader')
  revalidatePath('/dashboard/kader')
  revalidatePath('/dashboard/alumni')
  revalidatePath('/dashboard/pemandu')
  revalidatePath('/dashboard/instruktur')
  revalidatePath('/dashboard/profile')

  logger.info('Kader dihapus', {
    actorId: user.id,
    actorRole: user.role,
    memberId: memberRow.id,
    registerNumber: memberRow.registerNumber
  })

  return { success: true, message: 'Anggota berhasil dihapus' }
}
