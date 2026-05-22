# Training System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a training management system with DB-centric logic for chronological identifiers and date integrity.

**Architecture:** DB-first approach using PostgreSQL triggers for identifiers, generated columns for years, and CHECK constraints for date validation.

**Tech Stack:** Next.js 16, Drizzle ORM, PostgreSQL, Tailwind CSS 4, Shadcn UI.

---

### Task 1: Database Schema and Custom Logic

**Files:**
- Create: `src/db/schema/training.sql.ts`
- Create: `src/db/migrations/training_init.sql` (or equivalent raw SQL execution)

- [ ] **Step 1: Define Drizzle Schema**
Create `src/db/schema/training.sql.ts` with `training`, `training_attendants`, and `training_instructors` tables. Use `pgTable` and define the basic columns.
```typescript
import { pgTable, text, uuid, integer, boolean, date } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'
import { member } from './member.sql'

export const training = pgTable('training', (t) => ({
  id: t.uuid('id').primaryKey().default(sql`uuidv7()`),
  organizationId: t.uuid('organization_id').notNull().references(() => organization.id),
  name: t.text('name').notNull(),
  startDate: t.date('start_date').notNull(),
  endDate: t.date('end_date').notNull(),
  registrationDeadline: t.date('registration_deadline'),
  type: t.text('type', { enum: ['dm1', 'dm2', 'dpmk', 'tfi', 'dm3', 'other'] }).notNull(),
  year: t.integer('year').generatedAlwaysAs(() => sql`CAST(EXTRACT(YEAR FROM start_date) AS INTEGER)`),
  identifier: t.integer('identifier').notNull(),
}))

export const trainingAttendants = pgTable('training_attendants', (t) => ({
  trainingId: t.uuid('training_id').notNull().references(() => training.id),
  memberId: t.uuid('member_id').notNull().references(() => member.id),
  isPassing: t.boolean('is_passing').default(false).notNull(),
}), (table) => ({
  pk: { columns: [table.trainingId, table.memberId], primaryKey: true },
}))

export const trainingInstructors = pgTable('training_instructors', (t) => ({
  trainingId: t.uuid('training_id').notNull().references(() => training.id),
  memberId: t.uuid('member_id').notNull().references(() => member.id),
  role: t.text('role', { enum: ['master', 'assistant_master', 'administrator', 'classroom_master', 'lecturer', 'observer', 'ustadz_of_training'] }).notNull(),
}), (table) => ({
  pk: { columns: [table.trainingId, table.memberId], primaryKey: true },
}))
```

- [ ] **Step 2: Implement DB Constraints and Trigger**
Create a migration/SQL script to add CHECK constraints and the identifier trigger.
```sql
-- Date Constraints
ALTER TABLE training ADD CONSTRAINT check_end_date CHECK (end_date >= start_date);
ALTER TABLE training ADD CONSTRAINT check_deadline CHECK (registration_deadline <= start_date);

-- Identifier Trigger Function
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

CREATE TRIGGER tr_training_identifier
BEFORE INSERT ON training
FOR EACH ROW
EXECUTE FUNCTION fn_generate_training_identifier();
```

- [ ] **Step 3: Verify DB setup**
Run the migration and test by inserting two trainings for the same organization in the same year. Verify `identifier` increments.

- [ ] **Step 4: Commit**
```bash
git add src/db/schema/training.sql.ts
git commit -m "feat: add training schema with DB-level identifiers and constraints"
```

### Task 2: Data Access Layer

**Files:**
- Create: `src/db/query/training.ts`

- [ ] **Step 1: Implement Basic Queries**
Create functions for fetching training list (with filters), fetching a single training by `branch`, `year`, and `identifier`, and adding/removing attendants/instructors.
```typescript
import { db } from '~/db'
import { training, trainingAttendants, trainingInstructors } from '~/db/schema/training.sql'
import { eq, and, sql } from 'drizzle-orm'

export const trainingQuery = {
  async getAll(filters: { organizationId?: string, year?: number }) {
    // implementation...
  },
  async getByIdentifier(orgId: string, year: number, identifier: number) {
    return db.query.training.findFirst({
      where: and(eq(training.organizationId, orgId), eq(training.year, year), eq(training.identifier, identifier)),
      with: {
        attendants: { with: { member: true } },
        instructors: { with: { member: true } },
      }
    })
  },
  // ... add member to training, remove member, etc.
}
```

- [ ] **Step 2: Commit**
```bash
git add src/db/query/training.ts
git commit -m "feat: implement training data access layer"
```

### Task 3: Server Actions

**Files:**
- Create: `src/lib/actions/training.ts`

- [ ] **Step 1: Implement Create Training Action**
Add Zod validation for dates (startDate in future). Call `trainingQuery` to insert.
- [ ] **Step 2: Implement Member Assignment Actions**
Actions to add/remove members as attendants or instructors.
- [ ] **Step 3: Commit**
```bash
git add src/lib/actions/training.ts
git commit -m "feat: implement training server actions with date validation"
```

### Task 4: Global List Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/trainings/page.tsx`
- Create: `src/app/(dashboard)/dashboard/trainings/_components/training-table/` (including `columns.tsx`, `index.tsx`)

- [ ] **Step 1: Implement Data Table**
Create a table showing all trainings. Include filters for Organization and Year.
- [ ] **Step 2: Add "Add Training" Modal**
Integrate a form that calls the create server action.
- [ ] **Step 3: Commit**
```bash
git add src/app/(dashboard)/dashboard/trainings/
git commit -m "feat: implement global training list page"
```

### Task 5: Detail Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/trainings/[branch]/[year]/[identifier]/page.tsx`
- Create: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/`

- [ ] **Step 1: Implement Detail View**
Fetch training data using the route params. Display basic info, list of attendants, and list of instructors.
- [ ] **Step 2: Implement Member Management**
Add ability to mark participants as passing or change instructor roles.
- [ ] **Step 3: Commit**
```bash
git add src/app/(dashboard)/dashboard/trainings/
git commit -m "feat: implement training detail page with member management"
```
