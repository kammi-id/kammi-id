# Codebase Organization Refinement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing atomic structure to meet "Ultra-Atomic" engineering standards, focusing on TSDoc documentation, strict file naming, and logic separation.

**Architecture:**
- **Named-File Atomic Pattern:** `folder/component-name.tsx` + `folder/index.ts` (Already largely implemented).
- **Supporting Files:** Logic extraction to `action.ts`, `data.ts`, `store.ts`, and `utils.ts` to keep components as pure view layers.
- **Documentation:** Mandatory TSDoc for every public component and helper function.

**Tech Stack:** Next.js 16, TypeScript, Nanostores, Zod.

---

## Phase 1: Documentation & Standardized Naming

### Task 1: Audit and Fix Component Naming
**Files:**
- Modify: `src/app/(dashboard)/dashboard/members/_components/individual-table/individual-columns.tsx` -> `src/app/(dashboard)/dashboard/members/_components/individual-table/columns.tsx`

- [ ] **Step 1: Rename the columns file**
  Run: `mv src/app/(dashboard)/dashboard/members/_components/individual-table/individual-columns.tsx src/app/(dashboard)/dashboard/members/_components/individual-table/columns.tsx`
- [ ] **Step 2: Update imports in `individual-table.tsx`**
  Replace `import { ... } from './individual-columns'` with `import { ... } from './columns'`.
- [ ] **Step 3: Update barrel export in `index.ts` (if applicable)**
- [ ] **Step 4: Commit**
  Run: `git add . && git commit -m "refactor: standardize column file naming in members individual-table"`

### Task 2: Implement TSDocs for Core Dashboard Components
**Files:**
- Modify: `src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx`
- Modify: `src/app/(dashboard)/dashboard/_components/nav-main/nav-main.tsx`
- Modify: `src/app/(dashboard)/dashboard/_components/nav-user/nav-user.tsx`
- Modify: `src/app/(dashboard)/dashboard/_components/site-header/site-header.tsx`

- [ ] **Step 1: Add TSDoc to `AppSidebar`**
  Add block: `/** ... description, @param, @returns ... */` above the component.
- [ ] **Step 2: Add TSDoc to `NavMain`**
- [ ] **Step 3: Add TSDoc to `NavUser`**
- [ ] **Step 4: Add TSDoc to `SiteHeader`**
- [ ] **Step 5: Commit**
  Run: `git add . && git commit -m "docs: add TSDocs to core dashboard components"`

---

## Phase 2: Logic Extraction (Ultra-Atomic)

### Task 3: Refactor Members Add Form Logic
**Files:**
- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx` (Check for logic to extract)
- Create/Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/utils.ts` (for validation helpers)

- [ ] **Step 1: Identify non-UI logic in `index.tsx`**
- [ ] **Step 2: Move helper functions to `utils.ts`**
- [ ] **Step 3: Update imports in `index.tsx`**
- [ ] **Step 4: Commit**
  Run: `git add . && git commit -m "refactor: extract logic from members add-form to utils.ts"`

### Task 4: Refactor Account Form Logic
**Files:**
- Modify: `src/app/(dashboard)/dashboard/user/account/_components/account-form/account-form.tsx`
- Modify: `src/app/(dashboard)/dashboard/user/account/_components/password-form/password-form.tsx`

- [ ] **Step 1: Audit for embedded API calls or complex validation**
- [ ] **Step 2: Ensure calls are delegated to `action.ts`**
- [ ] **Step 3: Add TSDocs to form components**
- [ ] **Step 4: Commit**
  Run: `git add . && git commit -m "refactor: refine account form logic and documentation"`

---

## Phase 3: Final Verification & Cleanup

### Task 5: Final Global Scan & Type Check
- [ ] **Step 1: Scan for any remaining non-atomic components**
  Run Glob: `src/app/**/_components/*.tsx`
  Expected: No results (excluding files inside component folders).
- [ ] **Step 2: Verify type safety**
  Run: `npm run build` or `tsc --noEmit`.
- [ ] **Step 3: Final commit**
  Run: `git add . && git commit -m "refactor: complete ultra-atomic organization refinement"`
