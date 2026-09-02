'use server'

import { z } from 'zod'
import { db } from '~/db/db'
import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'
import { generatePassword, hashPassword } from '~/lib/utils/user'
import { generateRegisterNumber } from '~/lib/utils/member'
import { member as memberTable } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'
import { trainingAttendants } from '~/db/schema/training.sql'
import { getLogger, redact } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'member'])

const BulkMemberInputSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  gender: z.enum(['ikhwan', 'akhwat']),
  status: z.enum(['ab1', 'ab2', 'ab3']).default('ab1'),
  yearOfEntry: z.number().min(1998).max(new Date().getFullYear()),
  phone: z.string().optional().nullable(),
  isCertifiedMentor: z.boolean().default(false),
  isCertifiedInstructor: z.boolean().default(false)
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
  let user:
    | NonNullable<Awaited<ReturnType<typeof readActiveSession>>>['user']
    | undefined

  try {
    // Auth check
    const session = await readActiveSession()
    if (!session?.user) {
      return { success: false, message: 'Sesi tidak ditemukan.' }
    }

    user = session.user

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
      return {
        success: false,
        message: 'Validasi input gagal.',
        errors: errorMessages
      }
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
        // Same atomic high-water mark allocation as every other registration
        // path (ADR 0020) — `tx`-aware so a member later in this batch can't
        // collide with one earlier in it, and so this doesn't reach for a
        // second connection out of the single-connection pool mid-transaction.
        const registerNumber = await generateRegisterNumber(
          organizationId,
          memberInput.yearOfEntry,
          tx
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
            status: memberInput.status ?? 'ab1',
            isAlumn: false,
            isSuspended: false,
            isNonActive: false,
            isCertifiedMentor: memberInput.isCertifiedMentor ?? false,
            isCertifiedInstructor: memberInput.isCertifiedInstructor ?? false
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

      // Enroll in training inside the transaction — atomic with member creation
      if (trainingId) {
        for (const result of results) {
          await tx.insert(trainingAttendants).values({
            trainingId,
            memberId: result.memberId
          })
        }
      }

      return results
    })

    updateTag('kader')
    revalidatePath('/dashboard/kader')

    logger.info('Bulk upload kader selesai', {
      actorId: user.id,
      actorRole: user.role,
      organizationId,
      trainingId,
      createdCount: credentials.length,
      registerNumbers: credentials.map((c) => c.registerNumber)
    })

    return {
      success: true,
      message: `${credentials.length} kader berhasil ditambahkan.`,
      data: credentials
    }
  } catch (error) {
    logger.error('Gagal melakukan bulk upload kader: {error}', {
      error,
      actorId: user?.id,
      input: redact(input)
    })
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan tak terduga.'
    }
  }
}
