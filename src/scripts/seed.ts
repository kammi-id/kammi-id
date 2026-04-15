import { createOrganization } from '../db/query/organization'
import organizationData from './data/organization.json5'
import { writeFileSync } from 'node:fs'

async function main() {
  console.log('🌱 Seeding database (JSON5 mode)...')

  console.log('🏢 Seeding organizations and users via query functions...')

  const codeToId = new Map<string, string>()
  const allCredentials: {
    displayName: string
    name: string
    password: string
  }[] = []

  // Pastikan parent dibuat duluan (PP -> PW -> PD)
  const sortedOrgs = [...organizationData].sort((a, b) => {
    if (a.parent_code === null) return -1
    if (b.parent_code === null) return 1
    return 0
  })

  for (const org of sortedOrgs) {
    const parentId = org.parent_code ? codeToId.get(org.parent_code) : null

    console.log(`⏳ Creating organization: ${org.name}...`)

    const [inserted] = await createOrganization({
      name: org.name,
      slug: org.slug,
      code: org.code,
      type: org.type as 'pp' | 'pw' | 'pd' | 'pdln' | 'pk',
      parentId: parentId || undefined
    })

    if (inserted) {
      codeToId.set(org.code, inserted.id)
      allCredentials.push(...inserted.credentials)
    }
  }

  // 2. Generate CSV
  console.log('📄 Generating users.csv...')
  const csvContent = [
    'Display Name,Username,Password',
    ...allCredentials.map(
      (u) => `"${u.displayName}","${u.name}","${u.password}"`
    )
  ].join('\n')

  writeFileSync('users.csv', csvContent)

  console.log(
    '✅ Seeding completed! All organizations and related users are created.'
  )
  console.log('🚀 users.csv has been generated.')
}

main().catch((err) => {
  console.error('❌ Seeding failed!')
  console.error(err)
  process.exit(1)
})
