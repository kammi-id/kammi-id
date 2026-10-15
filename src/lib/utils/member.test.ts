import { describe, it, expect, beforeEach } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { createOrganization } from '~/db/query/organization'
import { createMember, deleteMember } from '~/db/query/member'
import {
  needsParentCodes,
  resolveRegisterNumberCodes,
  generateRegisterNumber
} from './member'

// Pure, database-free table tests for the NIA (register number) code derivation.
// NIA shape: [PW 2][PD 2][year 4][seq 3] — the PW/PD half is what these decide.
//
// The `generateRegisterNumber` describe block near the bottom is the one
// exception that does touch the database — it is what proves the high-water
// mark allocation itself (ADR 0020), which the pure tests above cannot.

type OrgRow = { type: string; code: string }

const PK_ITB: OrgRow = { type: 'pk', code: '19.PD-1.ITB' }
const PD_BANDUNG: OrgRow = { type: 'pd', code: '19.PD-1' }
const PD_SLEMAN: OrgRow = { type: 'pd', code: '12.PD-7' }
const PW_JABAR: OrgRow = { type: 'pw', code: 'PW19' }
const PDLN_MESIR: OrgRow = { type: 'pdln', code: 'PD.LN-8' }
const UNPARSEABLE: OrgRow = { type: 'pk', code: 'PK-USK' }

describe('resolveRegisterNumberCodes', () => {
  const cases: {
    name: string
    org: OrgRow
    parent: OrgRow | null
    expected: { pwCode: string; pdCode: string } | null
  }[] = [
    // --- PK: the parent is what names the NIA ---
    {
      name: 'PK with a parseable code under a parseable PD takes the PARENT codes',
      // Both sides parse, and they disagree: this is a PK that has been moved.
      // The frozen own code still says 19.PD-1; the new parent says 12.PD-7.
      org: PK_ITB,
      parent: PD_SLEMAN,
      expected: { pwCode: '12', pdCode: '07' }
    },
    {
      name: 'PK whose own code does not parse falls back to the parent',
      org: UNPARSEABLE,
      parent: PD_BANDUNG,
      expected: { pwCode: '19', pdCode: '01' }
    },
    {
      name: 'degraded: moved PK whose new parent code does not parse falls back to its own code',
      org: PK_ITB,
      parent: { type: 'pd', code: 'PD-TANPA-NOMOR' },
      expected: { pwCode: '19', pdCode: '01' }
    },
    {
      name: 'PK under a PDLN gets pwCode 99 from the parent',
      org: PK_ITB,
      parent: PDLN_MESIR,
      expected: { pwCode: '99', pdCode: '08' }
    },
    {
      name: 'PK under a PW gets pdCode 00 from the parent',
      org: PK_ITB,
      parent: PW_JABAR,
      expected: { pwCode: '19', pdCode: '00' }
    },
    {
      name: 'PK without a parent row falls back to its own code',
      org: PK_ITB,
      parent: null,
      expected: { pwCode: '19', pdCode: '01' }
    },
    {
      name: 'PK where neither side parses resolves to null',
      org: UNPARSEABLE,
      parent: { type: 'pd', code: 'PD-TANPA-NOMOR' },
      expected: null
    },

    // --- PD / PDLN / PW: they are the ones being named. Own code wins. ---
    {
      name: 'PD derives from its own code and ignores the parent',
      org: PD_BANDUNG,
      parent: PW_JABAR,
      expected: { pwCode: '19', pdCode: '01' }
    },
    {
      name: 'PDLN derives pwCode 99 from its own code and ignores the parent',
      org: PDLN_MESIR,
      parent: PW_JABAR,
      expected: { pwCode: '99', pdCode: '08' }
    },
    {
      name: 'PW derives from its own code with pdCode 00 and ignores the parent',
      org: PW_JABAR,
      parent: { type: 'pp', code: 'PP' },
      expected: { pwCode: '19', pdCode: '00' }
    },
    {
      name: 'PD with an unparseable code keeps the pre-existing parent fallback',
      org: { type: 'pd', code: 'PD-TANPA-NOMOR' },
      parent: PW_JABAR,
      expected: { pwCode: '19', pdCode: '00' }
    },
    {
      name: 'PD with an unparseable code and no parent resolves to null',
      org: { type: 'pd', code: 'PD-TANPA-NOMOR' },
      parent: null,
      expected: null
    }
  ]

  for (const { name, org, parent, expected } of cases) {
    it(name, () => {
      expect(resolveRegisterNumberCodes(org, parent)).toEqual(expected)
    })
  }

  it('leaves every registration that succeeds today still succeeding', () => {
    // Today a PK's own code carries its parent PD's code, so both directions
    // answer identically. Only a moved PK sees a difference.
    expect(resolveRegisterNumberCodes(PK_ITB, PD_BANDUNG)).toEqual(
      resolveRegisterNumberCodes(PK_ITB, null)
    )
  })
})

describe('needsParentCodes', () => {
  const cases: { name: string; org: OrgRow; expected: boolean }[] = [
    { name: 'PK always needs the parent row', org: PK_ITB, expected: true },
    {
      name: 'PK with an unparseable code needs the parent row',
      org: UNPARSEABLE,
      expected: true
    },
    {
      name: 'PD with a parseable code does not need the parent row',
      org: PD_BANDUNG,
      expected: false
    },
    {
      name: 'PD with an unparseable code needs the parent row',
      org: { type: 'pd', code: 'PD-TANPA-NOMOR' },
      expected: true
    },
    { name: 'PW never needs the parent row', org: PW_JABAR, expected: false },
    {
      name: 'PDLN never needs the parent row',
      org: PDLN_MESIR,
      expected: false
    }
  ]

  for (const { name, org, expected } of cases) {
    it(name, () => {
      expect(needsParentCodes(org)).toBe(expected)
    })
  }
})

describe('both register-number call sites share the one decision', () => {
  const read = (relative: string) =>
    readFileSync(join(process.cwd(), relative), 'utf8')

  const HOME = 'src/lib/utils/member.ts'

  const CALL_SITES = [HOME, 'src/scripts/seed-members.ts']

  for (const path of CALL_SITES) {
    it(`${path} decides via resolveRegisterNumberCodes`, () => {
      expect(read(path)).toContain('resolveRegisterNumberCodes(')
    })
  }

  it('keeps the per-Jenjang branch in exactly one file', () => {
    // A second copy of the branch is how two different numbering systems are
    // born — it already happened once. Only the shared module may reach for
    // resolveOrgCodes; everyone else goes through the pure decision above.
    const sources = [
      ...new Bun.Glob('src/**/*.{ts,tsx}').scanSync(process.cwd())
    ]
      .map((file) => file.split('\\').join('/'))
      .filter((file) => file !== HOME && !file.endsWith('/member.test.ts'))

    const copies = sources.filter((file) =>
      read(file).includes('resolveOrgCodes(')
    )
    expect(copies).toEqual([])
  })
})

describe('generateRegisterNumber — atomic high-water mark (ADR 0020)', () => {
  let pdId: string

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "user", "member", "member_mutation", "register_number_sequence", organization CASCADE`
    )

    const [pd] = await createOrganization({
      name: 'PD Test',
      slug: 'pd-test',
      code: '77.PD-9',
      type: 'pd',
      parentId: null,
      isNonActive: false
    })
    pdId = pd.id
  })

  it('allocates sequential numbers for repeated calls on the same prefix', async () => {
    const first = await generateRegisterNumber(pdId, 2024)
    const second = await generateRegisterNumber(pdId, 2024)
    const third = await generateRegisterNumber(pdId, 2024)

    expect(first).toBe('77092024001')
    expect(second).toBe('77092024002')
    expect(third).toBe('77092024003')
  })

  it('gives two concurrent registrations on the same prefix different numbers', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => generateRegisterNumber(pdId, 2024))
    )

    expect(new Set(results).size).toBe(10)
  })

  it('never reissues a number after the row holding it is deleted', async () => {
    const first = await generateRegisterNumber(pdId, 2024)
    const [created] = await createMember({
      name: 'Kader Test',
      registerNumber: first,
      organizationId: pdId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2024
    })

    await deleteMember(created.id)

    const next = await generateRegisterNumber(pdId, 2024)

    expect(next).not.toBe(first)
    expect(next).toBe('77092024002')
  })

  it('keeps prefixes independent of each other', async () => {
    const year1 = await generateRegisterNumber(pdId, 2024)
    const year2 = await generateRegisterNumber(pdId, 2025)

    expect(year1).toBe('77092024001')
    expect(year2).toBe('77092025001')
  })
})
