import { db } from '../db/db'
import { member } from '../db/schema/member.sql'
import { organization } from '../db/schema/organization.sql'
import { eq } from 'drizzle-orm'

const INDONESIAN_NAMES_MALE = [
  'Ahmad',
  'Budi',
  'Catur',
  'Dedi',
  'Eko',
  'Fajar',
  'Gilang',
  'Hadi',
  'Irfan',
  'Joko',
  'Kurniawan',
  'Lutfi',
  'Mulyadi',
  'Nugroho',
  'Oki',
  'Putra',
  'Qosim',
  'Rian',
  'Setyo',
  'Taufik',
  'Umar',
  'Vicky',
  'Wahyu',
  'Xander',
  'Yusuf',
  'Zaki',
  'Andi',
  'Bambang',
  'Cholil',
  'Dwi'
]

const INDONESIAN_NAMES_FEMALE = [
  'Aisyah',
  'Bunga',
  'Citra',
  'Dian',
  'Eka',
  'Fitri',
  'Gita',
  'Hani',
  'Indah',
  'Juwita',
  'Kartika',
  'Lestari',
  'Maya',
  'Nadia',
  'Olivia',
  'Putri',
  'Qiana',
  'Rina',
  'Sari',
  'Tania',
  'Ulfa',
  'Vina',
  'Wanda',
  'Xena',
  'Yanti',
  'Zahra',
  'Anisa',
  'Bella',
  'Cut',
  'Dewi'
]

const LAST_NAMES = [
  'Pratama',
  'Sutrisno',
  'Hidayat',
  'Kusuma',
  'Wijaya',
  'Saputra',
  'Lestari',
  'Utami',
  'Sari',
  'Putri',
  'Hidayat',
  'Sanjaya',
  'Gunawan',
  'Setiawan',
  'Nugroho',
  'Wibowo',
  'Hasan',
  'Rahayu',
  'Kurniawan',
  'Siregar'
]

const getRandom = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const generateRandomName = (gender: 'ikhwan' | 'akhwat') => {
  const firstNames =
    gender === 'ikhwan' ? INDONESIAN_NAMES_MALE : INDONESIAN_NAMES_FEMALE
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  return `${firstName} ${lastName}`
}

const generatePhone = () =>
  `08${Math.floor(Math.random() * 10000000000)
    .toString()
    .padStart(10, '0')}`

/**
 * Simulated version of generateRegisterNumber to avoid thousands of DB queries during seeding.
 * Replicates the logic in src/lib/utils/member.ts
 */
type OrgRecord = typeof organization.$inferSelect

const getNikPrefix = (org: OrgRecord, parentOrg?: OrgRecord) => {
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
    const extract = (code: string) => {
      const match =
        code.match(/(\d+)\s*\.\s*PD\s*(\d+)/i) ||
        code.match(/(\d+)\s*\.\s*PD\s*-\s*(\d+)/i)
      return match
        ? { pw: match[1].padStart(2, '0'), pd: match[2].padStart(2, '0') }
        : null
    }

    const selfMatch = extract(org.code)
    if (selfMatch) {
      pwCode = selfMatch.pw
      pdCode = selfMatch.pd
    } else if (parentOrg && parentOrg.type === 'pd') {
      const parentMatch = extract(parentOrg.code)
      if (parentMatch) {
        pwCode = parentMatch.pw
        pdCode = parentMatch.pd
      }
    }
  }

  if (!pwCode || !pdCode) return null
  return { pwCode, pdCode }
}

const main = async () => {
  console.log('🌱 Starting members seeding (Production NIK Logic)...')

  // Clear existing members for a clean seed
  console.log('🧹 Clearing existing members...')
  await db.delete(member)

  // 1. Get all PK organizations and their parents for NIK generation
  const pks = await db
    .select()
    .from(organization)
    .where(eq(organization.type, 'pk'))
  const allOrgs = await db.select().from(organization)
  const orgMap = new Map(allOrgs.map((o) => [o.id, o]))

  console.log(`🏢 Found ${pks.length} PK organizations to seed.`)

  let totalSeeded = 0

  for (const pk of pks) {
    console.log(`⏳ Seeding members for ${pk.name}...`)

    const memberCount = getRandom(400, 600)
    const ikhwanRatio = getRandom(20, 40) / 100
    const ikhwanCount = Math.floor(memberCount * ikhwanRatio)

    // Sequence tracker per prefix (PW+PD+YEAR)
    const prefixSequences = new Map<string, number>()

    const membersToInsert: (typeof member.$inferInsert)[] = []

    for (let i = 0; i < memberCount; i++) {
      const gender = i < ikhwanCount ? 'ikhwan' : 'akhwat'
      const name = generateRandomName(gender)
      const phone = generatePhone()
      const yearOfEntry = getRandom(1998, new Date().getFullYear())

      // NIK Generation
      const parentOrg = pk.parentId ? orgMap.get(pk.parentId) : undefined
      const prefixData = getNikPrefix(pk, parentOrg)

      if (!prefixData) {
        // We'll use a fallback to avoid skipping too many members if some codes are weird
        const fallbackPrefix = '0000' + yearOfEntry
        const seq = (prefixSequences.get(fallbackPrefix) || 0) + 1
        prefixSequences.set(fallbackPrefix, seq)
        const registerNumber = `${fallbackPrefix}${seq.toString().padStart(3, '0')}`

        // We still log it once per PK to avoid flooding the console
        if (i === 0)
          console.warn(
            `⚠️ Using fallback NIK for ${pk.name} due to code parsing failure.`
          )

        const isAlumn = Math.random() < 0.1
        let status: 'ab1' | 'ab2' | 'ab3' = 'ab1'
        let isCertifiedMentor = false
        let isCertifiedInstructor = false
        if (!isAlumn) {
          const statusRoll = Math.random()
          if (statusRoll < 0.6) {
            status = 'ab1'
          } else {
            const ab3Roll = Math.random()
            if (ab3Roll < 0.2) {
              status = 'ab3'
              isCertifiedMentor = true
              isCertifiedInstructor = true
            } else {
              status = 'ab2'
              if (Math.random() < 0.4) isCertifiedMentor = true
              if (Math.random() < 0.3) isCertifiedInstructor = true
            }
          }
        }

        membersToInsert.push({
          name,
          phone,
          organizationId: pk.id,
          isAlumn,
          status,
          gender,
          isCertifiedMentor,
          isCertifiedInstructor,
          yearOfEntry,
          registerNumber
        })
        continue
      }

      const prefix = `${prefixData.pwCode}${prefixData.pdCode}${yearOfEntry}`
      const seq = (prefixSequences.get(prefix) || 0) + 1
      prefixSequences.set(prefix, seq)
      const registerNumber = `${prefix}${seq.toString().padStart(3, '0')}`

      const isAlumn = Math.random() < 0.1
      let status: 'ab1' | 'ab2' | 'ab3' = 'ab1'
      let isCertifiedMentor = false
      let isCertifiedInstructor = false

      if (!isAlumn) {
        const statusRoll = Math.random()
        if (statusRoll < 0.6) {
          status = 'ab1'
        } else {
          const ab3Roll = Math.random()
          if (ab3Roll < 0.2) {
            status = 'ab3'
            isCertifiedMentor = true
            isCertifiedInstructor = true
          } else {
            status = 'ab2'
            if (Math.random() < 0.4) isCertifiedMentor = true
            if (Math.random() < 0.3) isCertifiedInstructor = true
          }
        }
      }

      membersToInsert.push({
        name,
        phone,
        organizationId: pk.id,
        isAlumn,
        status,
        gender,
        isCertifiedMentor,
        isCertifiedInstructor,
        yearOfEntry,
        registerNumber
      })
    }

    const batchSize = 100
    for (let i = 0; i < membersToInsert.length; i += batchSize) {
      const batch = membersToInsert.slice(i, i + batchSize)
      await db.insert(member).values(batch)
    }

    totalSeeded += membersToInsert.length
    console.log(`✅ Seeded ${membersToInsert.length} members for ${pk.name}`)
  }

  console.log(`\n🚀 Seeding completed! Total members seeded: ${totalSeeded}`)
}

main().catch((err) => {
  console.error('❌ Seeding failed!')
  console.error(err)
  process.exit(1)
})
