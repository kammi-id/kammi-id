import { db } from '../db'
import { training } from '../schema/training.sql'
import { sql } from 'drizzle-orm'

async function verify() {
  console.log('🧪 Verifying training identifier trigger...')

  try {
    // Manually specify an organization ID if the auto-fetch fails,
    // but first let's try to fix the fetch.
    const orgs = await db.execute(sql`SELECT id FROM organization LIMIT 1`)
    const rows = orgs as any[]
    if (rows.length === 0) {
      console.error('❌ No organization found in DB. Please create one first.')
      process.exit(1)
    }
    const orgId = rows[0].id
    console.log(`Using organization: ${orgId}`)

    // Clean up previous test data
    await db.execute(sql`DELETE FROM training WHERE organization_id = ${orgId}`)

    // Insert first training for 2026
    console.log('Inserting training 1 for 2026...')
    await db.insert(training).values({
      organizationId: orgId,
      name: 'Training 1 2026',
      startDate: '2026-01-01',
      endDate: '2026-01-05',
      type: 'dm1',
      identifier: 0
    })

    // Insert second training for 2026
    console.log('Inserting training 2 for 2026...')
    await db.insert(training).values({
      organizationId: orgId,
      name: 'Training 2 2026',
      startDate: '2026-02-01',
      endDate: '2026-02-05',
      type: 'dm1',
      identifier: 0
    })

    // Insert first training for 2027
    console.log('Inserting training 1 for 2027...')
    await db.insert(training).values({
      organizationId: orgId,
      name: 'Training 1 2027',
      startDate: '2027-01-01',
      endDate: '2027-01-05',
      type: 'dm1',
      identifier: 0
    })

    const results = await db
      .select({
        name: training.name,
        year: training.year,
        identifier: training.identifier
      })
      .from(training)
      .where(sql`organization_id = ${orgId}`)
      .orderBy(training.year, training.identifier)

    console.log('Results:')
    console.table(results)

    const expected = [
      { name: 'Training 1 2026', year: 2026, identifier: 1 },
      { name: 'Training 2 2026', year: 2026, identifier: 2 },
      { name: 'Training 1 2027', year: 2027, identifier: 1 }
    ]

    const isCorrect = JSON.stringify(results) === JSON.stringify(expected)
    if (isCorrect) {
      console.log('✅ Trigger verification PASSED!')
    } else {
      console.error('❌ Trigger verification FAILED!')
      console.error('Expected:', expected)
    }

    // Cleanup
    await db.execute(sql`DELETE FROM training WHERE organization_id = ${orgId}`)
  } catch (e) {
    console.error('❌ Verification error:', e)
    process.exit(1)
  }
}

verify()
