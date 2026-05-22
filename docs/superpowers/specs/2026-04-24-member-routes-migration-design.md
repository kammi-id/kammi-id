# Design Spec: Member Routes Migration

**Date:** 2026-04-24
**Status:** Approved
**Topic:** Migration from query-param based routing to dedicated paths for member types.

## 1. Context
Currently, the member management system uses a single route `/dashboard/members` with a `type` query parameter to distinguish between different member categories (Kader, Alumni, Pemandu, Instruktur). This has led to a "God Page" in `src/app/(dashboard)/dashboard/members/[[...slug]]/page.tsx` with complex conditional logic, making it harder to maintain and scale.

The goal is to migrate to dedicated paths to improve URL readability, separate concerns, and simplify the page logic while maintaining the existing hierarchical access control.

## 2. Proposed Architecture

### 2.1 Route Mapping
The application will transition from `/dashboard/members?type=...` to the following structure:

| New Path | Implementation File | Logic Type |
| :--- | :--- | :--- |
| `/dashboard/members` | `members/[[...slug]]/page.tsx` | Default (Kader) |
| `/dashboard/alumni` | `alumni/[[...slug]]/page.tsx` | Alumni |
| `/dashboard/pemandu` | `pemandu/[[...slug]]/page.tsx` | Pemandu |
| `/dashboard/instruktur` | `instruktur/[[...slug]]/page.tsx` | Instruktur |

### 2.2 Shared Logic Component
To avoid code duplication, a shared component `MembersPageContent.tsx` will be created in `src/app/(dashboard)/dashboard/members/_components/`.

**Component Specification:**
- **Props:** `type: 'alumni' | 'pemandu' | 'instruktur' | undefined` and `params: { slug: string[] }`.
- **Responsibility:**
    - Handle session validation.
    - Determine filters based on the `type` prop.
    - Fetch member aggregates and descendant members using the shared data layer.
    - Render the `AccessGuard`, `MemberSectionCards`, and the Tab system (Summary vs Individuals).

## 3. Data Flow & Filtering

The filtering logic in `MembersPageContent` will be strictly enforced as follows:

| Type | `isAlumn` | `isCertifiedMentor` | `isCertifiedInstructor` | `isNonActive` | `isSuspended` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kader** (`undefined`) | `false` | `undefined` | `undefined` | `false` | `false` |
| **Alumni** | `true` | `undefined` | `undefined` | `undefined` | `false` |
| **Pemandu** | `false` | `true` | `undefined` | `false` | `false` |
| **Instruktur** | `false` | `undefined` | `true` | `false` | `false` |

*Note: `isSuspended = false` is a global requirement for all views.*

## 4. Integration Plan

### 4.1 Navigation Updates
- **App Sidebar**: Update all links from `/dashboard/members?type=...` to the new dedicated paths.
- **Members Table**: Update the dynamic link generation in `columns.tsx` to use the current route's base path instead of hardcoding `/dashboard/members`.

### 4.2 Security & Guarding
- **Proxy Layer**: Add `/dashboard/alumni`, `/dashboard/pemandu`, and `/dashboard/instruktur` to the `adminPaths` list in `src/proxy.ts` to ensure hierarchical access control is applied.
- **Component Guard**: `AccessGuard` remains as the primary UI-layer protection.

### 4.3 Cache Management
- **Server Actions**: Update `revalidatePath` calls in `add-form/action.ts` to include all new paths to ensure data consistency across the dashboard.

## 5. Verification Plan
1. **Route Access**: Verify that each new route loads the correct data and respects `AccessGuard`.
2. **Hierarchical Navigation**: Ensure that clicking a sub-organization in the alumni view keeps the user within the `/dashboard/alumni` path.
3. **Data Consistency**: Cross-check that the numbers in `MemberSectionCards` match the row count in `IndividualMemberTable` for all types.
4. **Security Check**: Verify that users without `bph/bpk/root` roles are blocked from all new paths via the Proxy layer.
