import { db } from '~/db/db'
import { member } from '~/db/schema/member.sql'
import { organization } from '~/db/schema/organization.sql'
import { eq, and, sql, desc, ilike, isNull } from 'drizzle-orm'

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

// Whether the parent row has to be read before the codes can be decided.
// Lets a caller pay for the extra query only when it changes the answer: a PK
// always asks its parent first, everything else only when its own code fails.
export const needsParentCodes = (org: OrgCodeRow): boolean =>
  org.type === 'pk' || resolveOrgCodes(org) === null

// The one decision behind every NIA prefix. Pure on purpose: both the plain and
// the transaction-aware caller feed it their own row reads, so the two cannot
// drift into two different numbering systems.
//
// NIA names the PW/PD level, so the rule is deliberately not uniform:
//
//   - PK  — it is the parent that gets named, so the parent's code is asked
//     first, and the PK's own code is only the fallback. A PK's code carries
//     its parent PD's code today, so both directions answer identically; they
//     part ways only after the PK is moved, and there the parent is right.
//     `code` is frozen (ADR 0004), so a moved PK would otherwise emit a wrong
//     NIA forever.
//   - PD / PDLN / PW — they are the ones being named, so their own code wins.
//     Asking their parent first would flatten a PD's own number to `00`.
//     Their pre-existing fallback to the parent is kept untouched, so no
//     registration that succeeds today starts failing.
export const resolveRegisterNumberCodes = (
  org: OrgCodeRow,
  parent: OrgCodeRow | null
): { pwCode: string; pdCode: string } | null => {
  const ownCodes = () => resolveOrgCodes(org)
  const parentCodes = () => (parent ? resolveOrgCodes(parent) : null)

  return org.type === 'pk'
    ? (parentCodes() ?? ownCodes())
    : (ownCodes() ?? parentCodes())
}

export const generateRegisterNumber = async (
  organizationId: string,
  year: number
) => {
  // 1. Get organization details including parent. A Terhapus Struktur reads as
  //    absent (spec §7), so numbering a Kader into one fails the same way as
  //    numbering into an id that was never issued.
  const [org] = await db
    .select()
    .from(organization)
    .where(
      and(eq(organization.id, organizationId), isNull(organization.deletedAt))
    )
    .limit(1)

  if (!org) throw new Error('Organization not found')
  if (org.type === 'pp') throw new Error('Cannot register members under PP')

  let parent: OrgCodeRow | null = null
  if (org.parentId && needsParentCodes(org)) {
    const [parentRow] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, org.parentId))
      .limit(1)
    parent = parentRow ?? null
  }

  const codes = resolveRegisterNumberCodes(org, parent)

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
