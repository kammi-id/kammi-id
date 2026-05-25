'use server'

import { z } from 'zod'
import { db } from '~/db/db'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'
import { trainingQuery } from '~/db/query/training'
import { generateRegisterNumber } from '~/lib/utils/member'
import { generatePassword, hashPassword } from '~/lib/utils/user'
import { member as memberTable } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'

const BulkMemberInputSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  gender: z.enum(['ikhwan', 'akhwat']),
  yearOfEntry: z.number().min(1998).max(new Date().getFullYear()),
  phone: z.string().optional().nullable()
})

const BulkCreateInputSchema = z.object({
  members: z.array(BulkMemberInputSchema).min(1),
  organizationId: z.string().uuid(),
  trainingId: z.string().uuid().optional()
})

export type CredentialResult = {
  memberId: string
  name: string
  registerNumber: string
  password: string
}

export type BulkCreateResult = {
  success: boolean
  message: string
  data?: CredentialResult[]
  errors?: string[]
}

export const bulkCreateMembersAction = async (
  input: z.infer<typeof BulkCreateInputSchema>
): Promise<BulkCreateResult> => {
  try {
    // Auth check
    const session = await readActiveSession()
    if (!session?.user) {
      return { success: false, message: 'Sesi tidak ditemukan.' }
    }

    const { user } = session

    if (user.role !== 'bpk' && user.role !== 'root') {
      return {
        success: false,
        message: 'Hanya BPK atau root yang dapat melakukan bulk upload.'
      }
    }

    // Validate input
    const validated = BulkCreateInputSchema.safeParse(input)
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors
      const errorMessages = Object.entries(errors).map(
        ([field, msgs]) => `${field}: ${(msgs as string[])[0]}`
      )
      return { success: false, message: 'Validasi input gagal.', errors: errorMessages }
    }

    const { members, organizationId, trainingId } = validated.data

    // Check org scope
    const inScope = await isOrgInScope(user, organizationId)
    if (!inScope) {
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses untuk organisasi ini.'
      }
    }

    // All DB insert operations inside a single transaction
    const credentials = await db.transaction(async (tx) => {
      const results: CredentialResult[] = []

      for (const memberInput of members) {
        const registerNumber = await generateRegisterNumber(
          organizationId,
          memberInput.yearOfEntry
        )

        const [newMember] = await tx
          .insert(memberTable)
          .values({
            name: memberInput.name,
            gender: memberInput.gender,
            yearOfEntry: memberInput.yearOfEntry,
            phone: memberInput.phone ?? null,
            organizationId,
            registerNumber,
            status: 'ab1',
            isAlumn: false,
            isSuspended: false,
            isNonActive: false,
            isCertifiedMentor: false,
            isCertifiedInstructor: false
          })
          .returning({
            id: memberTable.id,
            name: memberTable.name,
            registerNumber: memberTable.registerNumber
          })

        const password = generatePassword()
        const passwordHash = await hashPassword(password)

        await tx.insert(userTable).values({
          name: newMember.registerNumber,
          displayName: newMember.name,
          passwordHash,
          role: 'member',
          connectedMemberId: newMember.id
        })

        results.push({
          memberId: newMember.id,
          name: newMember.name,
          registerNumber: newMember.registerNumber,
          password
        })
      }

      return results
    })

    // Enroll as training attendants OUTSIDE transaction (addAttendant has no tx param)
    if (trainingId) {
      for (const credential of credentials) {
        await trainingQuery.addAttendant(trainingId, credential.memberId)
      }
    }

    revalidatePath('/dashboard/kader')

    return {
      success: true,
      message: `${credentials.length} kader berhasil ditambahkan.`,
      data: credentials
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga.'
    }
  }
}
