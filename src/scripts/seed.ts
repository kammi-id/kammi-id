import { createOrganization } from '~/db/mutations/organization'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import path from 'node:path'
import fs from 'node:fs'

interface OrganizationData {
  code: string
  name: string
  type: 'pp' | 'pw' | 'pd' | 'pdln' | 'pk'
  slug: string
  parentCode?: string
}

/**
 * Main seeding function that populates the database with KAMMI organizational structure
 * and generates a CSV file with administrative user credentials.
 */
const seed = async (): Promise<void> => {
  const data = (await import('./data/organization.json').then(
    (m) => m.default
  )) as OrganizationData[]

  const codeToIdMap = new Map<string, string>()
  const allGeneratedUsers: Array<{
    displayName: string
    username: string
    password: string
  }> = []

  /**
   * Helper to seed a batch of organizations and harvest generated user data.
   */
  const seedBatch = async (
    items: Array<OrganizationData & { parentId?: string }>
  ) => {
    const [error, results] = await createOrganization(items)
    if (error) {
      console.error('Seed batch failed:', error.message)
      process.exit(1)
    }

    results?.forEach((org) => {
      if (org.code && org.id) {
        codeToIdMap.set(org.code as string, org.id as string)
      }
      org.users.forEach((user) => {
        allGeneratedUsers.push({
          displayName: user.displayName ?? '',
          username: user.name,
          password: user.password
        })
      })
    })
  }

  console.log('Seeding PP...')
  const ppEntry = data.find((d) => d.type === 'pp')
  if (ppEntry) {
    await seedBatch([ppEntry])
  }

  console.log('Seeding PWs...')
  const pwEntries = data
    .filter((d) => d.type === 'pw')
    .map((d) => ({
      ...d,
      parentId: codeToIdMap.get('KAMMI') // Root organization code from organization.json
    }))
  await seedBatch(pwEntries)

  console.log('Seeding PDs...')
  const pdEntries = data
    .filter((d) => d.type === 'pd' || d.type === 'pdln')
    .map((d) => ({
      ...d,
      parentId: codeToIdMap.get(d.parentCode ?? '')
    }))
  await seedBatch(pdEntries)

  console.log('Refreshing materialized views...')
  const viewNames = [
    'organization_view',
    'member_view',
    'training_view',
    'managers_history_view'
  ]

  for (const viewName of viewNames) {
    try {
      await db.execute(sql.raw(`REFRESH MATERIALIZED VIEW ${viewName}`))
      console.log(`Refreshed ${viewName}`)
    } catch (err) {
      console.error(`Failed to refresh view ${viewName}:`, err)
    }
  }

  // Manual CSV generation to avoid external Excel dependencies
  const csvRows = [
    'Display Name,Username,Password',
    ...allGeneratedUsers.map(
      (u) => `"${u.displayName}","${u.username}","${u.password}"`
    )
  ]
  const csvContent = csvRows.join('\n')

  const csvPath = path.join(process.cwd(), 'passwords.csv')
  fs.writeFileSync(csvPath, csvContent)

  console.log(`\nSeeding complete.`)
  console.log(`${allGeneratedUsers.length} users created.`)
  console.log(`Credentials saved to: ${csvPath}`)
}

seed().catch((err) => {
  console.error('Seed script crashed:', err)
  process.exit(1)
})
