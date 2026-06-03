'use server'

import { z } from 'zod'
import { db } from '~/db/db'
import { eq, ilike, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'
import { generatePassword, hashPassword } from '~/lib/utils/user'
import { member as memberTable } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'
import { organization } from '~/db/schema/organization.sql'
import { trainingAttendants } from '~/db/schema/training.sql'

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

      // Resolve organization codes once — same for all members in this batch
      const [org] = await tx
        .select()
        .from(organization)
        .where(eq(organization.id, organizationId))
        .limit(1)

      if (!org) throw new Error('Organization not found')
      if (org.type === 'pp') throw new Error('Cannot register members under PP')

      let pwCode = ''
      let pdCode = ''

      if (org.type === 'pw') {
        const match = org.code.match(/PW\s*(\d+)/i)
        pwCode = match ? match[1].padStart(2, '0') : '00'
        pdCode = '00'
      } else if (org.type === 'pdln') {
        const match = org.code.match(/-\s*(\d+)/)
        pwCode = '99'
        pdCode = match ? match[1].padStart(2, '0') : '00'
      } else {
        const match = org.code.match(/(\d+)\s*\.\s*PD\s*-\s*(\d+)/i)
        if (match) {
          pwCode = match[1].padStart(2, '0')
          pdCode = match[2].padStart(2, '0')
        } else if (org.parentId) {
          const [parent] = await tx
            .select()
            .from(organization)
            .where(eq(organization.id, org.parentId))
            .limit(1)
          if (parent && parent.type === 'pd') {
            const pMatch = parent.code.match(/(\d+)\s*\.\s*PD\s*-\s*(\d+)/i)
            if (pMatch) {
              pwCode = pMatch[1].padStart(2, '0')
              pdCode = pMatch[2].padStart(2, '0')
            }
          }
        }
      }

      if (!pwCode || !pdCode)
        throw new Error('Failed to parse organization codes')

      for (const memberInput of members) {
        const prefix = `${pwCode}${pdCode}${memberInput.yearOfEntry}`

        // tx-aware: reads the latest register number visible within this transaction,
        // so members in the same batch don't collide on sequential numbers.
        const [lastMember] = await tx
          .select({ registerNumber: memberTable.registerNumber })
          .from(memberTable)
          .where(ilike(memberTable.registerNumber, `${prefix}%`))
          .orderBy(desc(memberTable.registerNumber))
          .limit(1)

        let nextSeq = 1
        if (lastMember) {
          const seqStr = lastMember.registerNumber.slice(prefix.length)
          const lastSeq = parseInt(seqStr)
          if (!isNaN(lastSeq)) nextSeq = lastSeq + 1
        }

        const registerNumber = `${prefix}${nextSeq.toString().padStart(3, '0')}`

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
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan tak terduga.'
    }
  }
}
