import { db } from '~/db/db'
import { member } from '~/db/schema/member.sql'
import { organization } from '~/db/schema/organization.sql'
import { eq, and, sql, desc, ilike } from 'drizzle-orm'

type OrgCodeRow = { type: string; code: string }

// Matches '19.PD-1', '23.PD.1', '31.PD 1', '1.PD-1.USK', etc.
const PD_CODE_RE = /(\d+)\s*\.?\s*PD[\s.-]*(\d+)/i
const PW_CODE_RE = /PW\s*(\d+)/i
const PDLN_CODE_RE = /-\s*(\d+)/

// Resolves the PW/PD prefix codes for an organization based on its own code.
// Returns null if the org's code doesn't follow a recognized format.
export const resolveOrgCodes = (
  org: OrgCodeRow
): { pwCode: string; pdCode: string } | null => {
  if (org.type === 'pw') {
    // PK under PW: PW from code suffix, PD=00
    // Example: 'PW1' -> XX=01
    const match = org.code.match(PW_CODE_RE)
    return { pwCode: match ? match[1].padStart(2, '0') : '00', pdCode: '00' }
  }

  if (org.type === 'pdln') {
    // PDLN: PW=99, PD from code suffix
    // Example: 'PD.LN-8' -> XX=99, YY=08
    const match = org.code.match(PDLN_CODE_RE)
    return { pwCode: '99', pdCode: match ? match[1].padStart(2, '0') : '00' }
  }

  // PD or PK: Extract from code (e.g., '19.PD-1' -> XX=19, YY=01)
  const match = org.code.match(PD_CODE_RE)
  if (match) {
    return {
      pwCode: match[1].padStart(2, '0'),
      pdCode: match[2].padStart(2, '0')
    }
  }

  return null
}

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

  let codes = resolveOrgCodes(org)

  if (!codes && org.parentId) {
    // Fallback: derive codes from the parent (e.g. PK directly under a PW or PDLN)
    const [parent] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, org.parentId))
      .limit(1)
    if (parent) codes = resolveOrgCodes(parent)
  }

  if (!codes) throw new Error('Failed to parse organization codes')

  const { pwCode, pdCode } = codes

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
