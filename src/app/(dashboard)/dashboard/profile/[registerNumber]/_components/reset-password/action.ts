'use server'

import { eq } from 'drizzle-orm'
import { db } from '~/db/db'
import { user as userTable } from '~/db/schema/user.sql'
import { member as memberTable } from '~/db/schema/member.sql'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'
import { generatePassword, hashPassword } from '~/lib/utils/user'

type RegenerateResult = {
  success: boolean
  message: string
  data?: {
    memberId: string
    name: string
    registerNumber: string
    password: string
  }
}

export const regenerateCredentialAction = async (
  memberId: string
): Promise<RegenerateResult> => {
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

  const [userRow] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.connectedMemberId, memberId))
    .limit(1)

  if (!userRow) return { success: false, message: 'Akun kader tidak ditemukan' }

  const password = generatePassword()
  const passwordHash = await hashPassword(password)

  await db
    .update(userTable)
    .set({ passwordHash })
    .where(eq(userTable.id, userRow.id))

  return {
    success: true,
    message: 'Password berhasil direset',
    data: {
      memberId: memberRow.id,
      name: memberRow.name,
      registerNumber: memberRow.registerNumber,
      password
    }
  }
}
