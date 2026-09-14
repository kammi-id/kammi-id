import { db } from '../db'
import { sql } from 'drizzle-orm'

async function setup() {
  console.log('🚀 Setting up training system custom logic...')

  try {
    // 1. Date Constraints
    console.log('Adding date constraints...')
    await db.execute(
      sql`ALTER TABLE training ADD CONSTRAINT check_end_date CHECK (end_date >= start_date)`
    )
    await db.execute(
      sql`ALTER TABLE training ADD CONSTRAINT check_deadline CHECK (registration_deadline <= start_date)`
    )

    // 2. Identifier Trigger Function
    console.log('Creating trigger function...')
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION fn_generate_training_identifier()
      RETURNS TRIGGER AS $$
      DECLARE
          next_id INTEGER;
      BEGIN
          SELECT COALESCE(MAX(identifier), 0) + 1 INTO next_id
          FROM training
          WHERE organization_id = NEW.organization_id
            AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM NEW.start_date);
          
          NEW.identifier := next_id;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 3. Trigger
    console.log('Creating trigger...')
    // Drop if exists to avoid errors on re-run
    await db.execute(
      sql`DROP TRIGGER IF EXISTS tr_training_identifier ON training`
    )
    await db.execute(sql`
      CREATE TRIGGER tr_training_identifier
      BEFORE INSERT ON training
      FOR EACH ROW
      EXECUTE FUNCTION fn_generate_training_identifier();
    `)

    console.log('✅ Training system custom logic applied successfully!')
  } catch (e) {
    console.error('❌ Error applying logic:', e)
    process.exit(1)
  }
}

setup()
