# Training System Design Specification

> **Date:** 2026-04-27
> **Status:** Approved
> **Scope:** Implementation of training data management, including schema, routing, and relations with organization and members.

## 1. Goal
Implement a robust training management system that tracks training sessions, their organizers (organizations), participants (attendants), and instructors. The system emphasizes database-level integrity and automatic identification of training sessions.

## 2. Architecture

### 2.1 Database Schema (PostgreSQL)

#### Table: `training`
Stores the core details of each training session.
- `id`: UUID (Primary Key, default `uuidv7()`)
- `organizationId`: UUID (Foreign Key $\to$ `organization.id`, Not Null)
- `name`: Text (Not Null)
- `startDate`: Date (Not Null)
- `endDate`: Date (Not Null)
- `registrationDeadline`: Date (Optional)
- `type`: Text (Enum: `dm1`, `dm2`, `dpmk`, `tfi`, `dm3`, `other`, Not Null)
- `year`: Integer (**Generated Column**: `CAST(EXTRACT(YEAR FROM startDate) AS INTEGER)`)
- `identifier`: Integer (Not Null) - Chronological sequence per organization per year.

**DB Level Constraints:**
- `CHECK (endDate >= startDate)`
- `CHECK (registrationDeadline <= startDate)`

**DB Automation:**
- **Trigger `tr_training_identifier`**: A `BEFORE INSERT` trigger that calculates the next `identifier` by counting existing trainings for the same `organizationId` and `year`, then incrementing by 1.

#### Table: `training_attendants`
Junction table for training participants.
- `trainingId`: UUID (FK $\to$ `training.id`, Not Null)
- `memberId`: UUID (FK $\to$ `member.id`, Not Null)
- `isPassing`: Boolean (Default: `false`, Not Null)
- **Primary Key**: `(trainingId, memberId)`

#### Table: `training_instructors`
Junction table for training instructors.
- `trainingId`: UUID (FK $\to$ `training.id`, Not Null)
- `memberId`: UUID (FK $\to$ `member.id`, Not Null)
- `role`: Text (Enum: `master`, `assistant_master`, `administrator`, `classroom_master`, `lecturer`, `observer`, `ustadz_of_training`, Not Null)
- **Primary Key**: `(trainingId, memberId)`

### 2.2 Routing
- **Global List**: `/dashboard/trainings`
    - Purpose: Overview of all trainings with filtering capabilities by organization and year.
- **Detail View**: `/dashboard/trainings/[branch]/[year]/[identifier]`
    - Purpose: Detailed view of a specific training session using its unique identifiers.

### 2.3 Business Logic & Validations

#### Application Level (Server Actions/Zod)
- `startDate`: Must be in the future ($\ge$ Today).
- `endDate`: Must be $\ge$ `startDate`.
- `registrationDeadline`: Must be $\le$ `startDate`.

#### Database Level (Integrity)
- Automatic `year` extraction.
- Automatic `identifier` generation via triggers.
- Hard constraints on date ranges via `CHECK` clauses.

## 3. Success Criteria
- [ ] Tables created with all specified constraints and generated columns.
- [ ] Trigger for `identifier` works correctly (increments and resets per org/year).
- [ ] Routes are accessible and resolve to the correct training session.
- [ ] Members can be added as both attendants and instructors.
- [ ] Data integrity is maintained (e.g., cannot set `endDate` before `startDate`).
