# Design Spec: Hierarchical Access Control System

**Date:** 2026-04-23
**Status:** Draft
**Author:** Gita (Claude Code)

## 1. Overview
Implement a multi-layered access control system that restricts data access based on a combination of organization hierarchy (vertical) and user roles (horizontal).

### 1.1 Organizational Hierarchy
The system follows a strict tree structure:
- **PP (Pusat)**: Level 1 (Top) $\rightarrow$ Can access all levels.
- **PW (Wilayah)**: Level 2 $\rightarrow$ Can access self, all PDs and PKs under its jurisdiction.
- **PD/PDLN (Daerah)**: Level 3 $\rightarrow$ Can access self and all PKs under its jurisdiction.
- **PK (Komisariat)**: Level 4 (Leaf) $\rightarrow$ Can access only its own data.

### 1.2 Role-Based Constraints (Horizontal)
Access is further filtered by roles. Even if a user has hierarchical access to an organization, they cannot access data outside their functional role:
- **Root**: Omnipotent. Full access regardless of hierarchy or role.
- **BPH**: Management access.
- **BPK (Pembinaan Kader)**: HR, Cadre, Alumni, Mentor, Instructor data.
- **BPW (Pengembangan Wilayah)**: Regional, Area, and Commissariat structural data.
- **Humas**: Public Relations and Communication data.
- **Member**: Personal data only.

**Constraint Example:** A `Humas` role at `PW Jabar` cannot access `BPK` data in `PW Jabar` or any `PD/PK` below it.

## 2. Technical Architecture

The system implements a "Defense in Depth" strategy across three layers.

### 2.1 Proxy Layer (Edge/Fast Guard)
**File:** `src/proxy.ts` (Next.js 16 Proxy convention)

- **Responsibility:** Fast redirection and basic authentication.
- **Logic:**
  - Intercept requests to `/dashboard/:path*`.
  - Verify session presence.
  - Perform high-level role checks (e.g., redirect `member` roles trying to access `/dashboard/admin`).
- **Outcome:** Prevents unauthorized users from even reaching the page rendering logic.

### 2.2 Application Layer (UI/UX Guard)
**Components:** `AccessGuard` (React Component), `validateAccess` (Utility)

- **`AccessGuard`**:
  - Wraps page content.
  - Checks `session.user.role` and `session.user.connectedOrganization.level`.
  - Renders `403 Forbidden` if requirements are not met.
- **`validateAccess`**:
  - Used inside Server Actions (`action.ts`).
  - Re-verifies the user's right to mutate/access a specific `organizationId`.
- **Sidebar Filtering**:
  - Dynamically hides/shows menu items based on the user's role.

### 2.3 Data Access Layer (Database Guard)
**Implementation:** Raw SQL Recursive CTE within Drizzle queries.

- **The `allowed_organizations` CTE**:
  - Uses `WITH RECURSIVE` to calculate the organization subtree.
  - **Input**: `connectedOrganizationId` from session.
  - **Output**: A list of all `organization.id`s that the user is allowed to access.
- **Query Integration**:
  - Every data-fetching query must `JOIN` or filter by `organization_id IN (SELECT id FROM allowed_organizations)`.
  - Additional `WHERE` clauses are added based on the user's role (e.g., `AND role IN ('root', 'bph', 'bpk')` for HR data).
- **Special Case**: `Root` user bypasses the subtree filter and accesses all records.

## 3. Data Flow Example
**Scenario:** A user with role `BPK` at `PW Jabar` requests a list of members in a `PK` under `PW Jabar`.

1. **Proxy**: Checks if user is logged in and has a role that can access `/dashboard/members`. $\rightarrow$ **PASS**.
2. **Page**: `AccessGuard` checks if `BPK` is an allowed role for this page. $\rightarrow$ **PASS**.
3. **Database**:
   - CTE calculates all IDs under `PW Jabar`.
   - Query filters members where `organization_id` is in that list AND user role is `BPK/BPH/Root`.
   - Returns only the filtered member list. $\rightarrow$ **SECURE**.

## 4. Implementation Notes
- **Drizzle Limitation**: Since Drizzle does not natively support `WITH RECURSIVE`, the hierarchy CTE must be implemented using `db.execute(sql`...`)` or raw SQL fragments.
- **Performance**: Recursive queries are efficient for the expected depth of this organization (max 4 levels).
- **Testing**: Must include test cases for "cross-branch" access (e.g., PW Jabar attempting to access PW Jatim data) to ensure 403s are returned.
