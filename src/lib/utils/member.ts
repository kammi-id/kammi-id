import { db } from '~/db/db'
import { member } from '~/db/schema/member.sql'
import { organization } from '~/db/schema/organization.sql'
import { eq, and, sql, desc, ilike } from 'drizzle-orm'

export const generateRegisterNumber = async (
  organizationId: string,
  year: number
) => {
  // 1. Get organization details including parent
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1)

  if (!org) throw new Error('Organization not found')
  if (org.type === 'pp') throw new Error('Cannot register members under PP')

  let pwCode = ''
  let pdCode = ''

  if (org.type === 'pw') {
    // PK under PW: PW from code suffix, PD=00
    // Example: 'PW1' -> XX=01
    const match = org.code.match(/PW\s*(\d+)/i)
    pwCode = match ? match[1].padStart(2, '0') : '00'
    pdCode = '00'
  } else if (org.type === 'pdln') {
    // PDLN: PW=99, PD from code suffix
    // Example: 'PD.LN-8' -> XX=99, YY=08
    const match = org.code.match(/-\s*(\d+)/)
    pwCode = '99'
    pdCode = match ? match[1].padStart(2, '0') : '00'
  } else {
    // PD or PK: Extract from code (e.g., '19.PD-1' -> XX=19, YY=01)
    const match = org.code.match(/(\d+)\s*\.\s*PD\s*-\s*(\d+)/i)
    if (match) {
      pwCode = match[1].padStart(2, '0')
      pdCode = match[2].padStart(2, '0')
    } else {
      // Fallback: try to find parent PD if this is a PK
      if (org.parentId) {
        const [parent] = await db
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
  }

  if (!pwCode || !pdCode) throw new Error('Failed to parse organization codes')

  const prefix = `${pwCode}${pdCode}${year}`

  // 2. Find max sequential number for this prefix
  const [lastMember] = await db
    .select({ registerNumber: member.registerNumber })
    .from(member)
    .where(ilike(member.registerNumber, `${prefix}%`))
    .orderBy(desc(member.registerNumber))
    .limit(1)

  let nextSeq = 1
  if (lastMember) {
    // Extract everything after the prefix as the sequence
    const seqStr = lastMember.registerNumber.slice(prefix.length)
    const lastSeq = parseInt(seqStr)
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1
    }
  }

  return `${prefix}${nextSeq.toString().padStart(3, '0')}`
}
