# Hierarchical Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a multi-layered access control system based on organization hierarchy (PP -> PW -> PD -> PK) and user roles, ensuring strict data isolation.

**Architecture:** Hybrid Defense-in-Depth.
1. **Proxy Layer**: `src/proxy.ts` for fast edge redirection.
2. **Application Layer**: `AccessGuard` component for UI boundaries and `validateAccess` for Server Action protection.
3. **Data Access Layer**: Raw SQL Recursive CTEs in Drizzle queries to enforce subtree and role-based filtering at the database level.

**Tech Stack:** Next.js 16, Drizzle ORM, PostgreSQL (Recursive CTE), TypeScript.

---

## File Map

### New Files
- `src/proxy.ts`: Next.js 16 Proxy for edge-level auth/role guards.
- `src/lib/access-control.ts`: Centralized logic for role/level validation and hierarchy helpers.
- `src/components/access-guard/access-guard.tsx`: UI wrapper for route-level access control.
- `src/components/access-guard/index.ts`: Barrel export for `AccessGuard`.

### Modified Files
- `src/db/query/organization.ts`: Add recursive CTE for fetching subtree organizations.
- `src/db/query/member.ts`: Integrate `allowed_organizations` CTE into member queries.
- `src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx`: Implement dynamic menu filtering.
- `src/app/(dashboard)/dashboard/members/[[...slug]]/page.tsx`: Wrap with `AccessGuard`.
- `src/app/(dashboard)/dashboard/branches/[[...slug]]/page.tsx`: Wrap with `AccessGuard`.

---

## Implementation Tasks

### Task 1: Core Access Utilities
**Files:**
- Create: `src/lib/access-control.ts`

- [ ] **Step 1: Implement `checkRole` and `checkLevel` helpers**
```typescript
export type UserRole = 'root' | 'bph' | 'bpk' | 'bpw' | 'humas' | 'member';
export type OrgLevel = 1 | 2 | 3 | 4; // PP, PW, PD, PK

export const hasRequiredRole = (userRole: UserRole, allowedRoles: UserRole[]) => {
  if (userRole === 'root') return true;
  return allowedRoles.includes(userRole);
};

export const hasMinimumLevel = (userLevel: OrgLevel, minLevel: OrgLevel) => {
  // Lower number = Higher hierarchy (1 is top)
  return userLevel <= minLevel;
};
```

- [ ] **Step 2: Implement `isHumas` check**
```typescript
export const isHumas = (role: UserRole) => role === 'humas';
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/access-control.ts
git commit -m "feat: add core access control utilities"
```

### Task 2: Database Hierarchy Layer (Recursive CTE)
**Files:**
- Modify: `src/db/query/organization.ts`

- [ ] **Step 1: Implement `getAllowedOrganizations` raw SQL query**
This query must return all organization IDs a user can access.
- For `root`: All IDs.
- For `humas`: Only `connectedOrganizationId`.
- For others: `connectedOrganizationId` + all recursive children.

```typescript
// Pseudo-code for the Raw SQL
const sql = `
  WITH RECURSIVE subtree AS (
    SELECT id FROM organization WHERE id = ${userIdOrgId}
    UNION ALL
    SELECT o.id FROM organization o
    INNER JOIN subtree s ON s.id = o.parent_id
  )
  SELECT id FROM subtree;
`;
```

- [ ] **Step 2: Wrap in a Drizzle helper `fetchAllowedOrgIds(user)`**
Ensure it handles the `root` and `humas` cases correctly before executing the recursive part.

- [ ] **Step 3: Verify with a test script**
Create a temporary script to verify that a PW user gets PDs and PKs, but a PK user only gets themselves.

- [ ] **Step 4: Commit**
```bash
git add src/db/query/organization.ts
git commit -m "feat: implement recursive organization hierarchy CTE"
```

### Task 3: Securing Member Queries
**Files:**
- Modify: `src/db/query/member.ts`

- [ ] **Step 1: Update `getMembers` to use `allowed_organizations`**
Inject the CTE into the main query.

```typescript
// Modified query logic
const allowedIds = await fetchAllowedOrgIds(user);
return db.select().from(member)
  .where(in(member.organizationId, allowedIds));
```

- [ ] **Step 2: Add Role-Based Slicing for HR data**
If the query is for "Cadre/HR" data, add:
`.where(and(in(member.organizationId, allowedIds), hasRequiredRole(user.role, ['root', 'bph', 'bpk'])))`

- [ ] **Step 3: Run existing tests and verify no regressions**

- [ ] **Step 4: Commit**
```bash
git add src/db/query/member.ts
git commit -m "feat: enforce hierarchical access in member queries"
```

### Task 4: Proxy Layer Implementation
**Files:**
- Create: `src/proxy.ts`

- [ ] **Step 1: Implement `proxy` function with `matcher`**
Target `/dashboard/:path*`.

- [ ] **Step 2: Add Authentication Guard**
Redirect to `/login` if no session exists.

- [ ] **Step 3: Add Basic Role Guard**
Redirect `member` roles away from admin/management paths.

- [ ] **Step 4: Commit**
```bash
git add src/proxy.ts
git commit -m "feat: add proxy layer for fast route guarding"
```

### Task 5: Application Guard Component
**Files:**
- Create: `src/components/access-guard/access-guard.tsx`
- Create: `src/components/access-guard/index.ts`

- [ ] **Step 1: Implement `AccessGuard` component**
Use `useSession` (or equivalent) to check role and level.

```tsx
const AccessGuard = ({ children, allowedRoles, levelRequirement }) => {
  const { user } = useSession();
  if (user.role === 'root') return <>{children}</>;
  if (!hasRequiredRole(user.role, allowedRoles)) return <ForbiddenPage />;
  if (!hasMinimumLevel(user.connectedOrganization.level, levelRequirement)) return <ForbiddenPage />;
  return <>{children}</>;
};
```

- [ ] **Step 2: Create `ForbiddenPage` UI**
A simple page explaining the access denial.

- [ ] **Step 3: Commit**
```bash
git add src/components/access-guard/
git commit -m "feat: implement AccessGuard UI component"
```

### Task 6: Protecting Pages and Actions
**Files:**
- Modify: `src/app/(dashboard)/dashboard/members/[[...slug]]/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/branches/[[...slug]]/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/action.ts`

- [ ] **Step 1: Wrap Pages with `AccessGuard`**
Set appropriate `allowedRoles` and `levelRequirement`.

- [ ] **Step 2: Implement `validateAccess` in Server Actions**
Call the helper in `action.ts` to prevent unauthorized mutations.

- [ ] **Step 3: Commit**
```bash
git add src/app/(dashboard)/dashboard/
git commit -m "feat: protect member and branch pages/actions"
```

### Task 7: Dynamic UI Filtering
**Files:**
- Modify: `src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx`

- [ ] **Step 1: Filter Sidebar items based on role**
Hide "Manajemen Kader" for `humas`, etc.

- [ ] **Step 2: Commit**
```bash
git add src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx
git commit -m "ui: filter sidebar menus by user role"
```

### Task 8: Final Verification
**Files:**
- New: `tests/access-control.test.ts`

- [ ] **Step 1: Write test cases for:**
  - Root user accessing everything.
  - PW user accessing their own PD/PK.
  - PW user attempting to access another PW's data (Forbidden).
  - Humas user attempting to access subtree (Forbidden).
  - Member user attempting to access management pages (Forbidden).

- [ ] **Step 2: Run all tests and verify PASS.**

- [ ] **Step 3: Final Commit**
```bash
git add .
git commit -m "test: verify hierarchical access control"
```
