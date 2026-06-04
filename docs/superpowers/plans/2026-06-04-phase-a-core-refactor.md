# Phase A: Core Refactor (Next.js 16 + React 19) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce arrow function convention, kebab-case file naming, `use cache` consistency, RSC boundary correctness, and fix all ESLint/TypeScript warnings across the codebase.

**Architecture:** Systematic audit across all `src/` files outside of `src/components/shadcn/` and `src/lib/shadcn/`. Each fix is a targeted edit — no structural rewrites. Tests must stay green throughout.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Drizzle ORM, Zod, Nanostores

**Prerequisites:** Phase C complete and all tests passing.

---

## Task 1: Arrow Function Convention — data.ts Files

**Files:**
- Modify: all `_data/*.ts` files in `src/app/`

The AGENTS.md rule: all functions in `src/` (except shadcn/, lib/shadcn/, and Next.js convention files) must use arrow function syntax.

- [ ] **Step 1: Find all violating function declarations in data files**

```bash
grep -r "^export async function\|^export function" src/app --include="*.ts" -l
```

- [ ] **Step 2: For each file found, convert to arrow syntax**

Pattern — convert every occurrence of:
```ts
// Before:
export async function getCachedX(params: Type) {
  'use cache'
  // ...
}

// After:
export const getCachedX = async (params: Type) => {
  'use cache'
  // ...
}
```

Go through each file systematically. Files expected to need conversion include all `_data/` files under `src/app/(dashboard)/dashboard/`.

- [ ] **Step 3: Run type check after each file**

```bash
bun run check:types
```

Fix any type errors that appear (often just return type inference differences).

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "refactor: convert data file functions to arrow syntax"
```

---

## Task 2: Arrow Function Convention — action.ts Files

**Files:**
- Modify: all `action.ts` files in `src/app/`

- [ ] **Step 1: Find all violating function declarations in action files**

```bash
grep -r "^export async function\|^async function\|^export default async function" src/app --include="action.ts" -rn
```

- [ ] **Step 2: Convert each action file**

Pattern — `action.ts` files use `'use server'` and export actions. Convert:
```ts
// Before:
'use server'
export default async function loginFormAction(_prevState, formData) { ... }

// After:
'use server'
const loginFormAction = async (_prevState: LoginFormState, formData: FormData): Promise<LoginFormState> => { ... }
export default loginFormAction
```

For named exports:
```ts
// Before:
export async function addMemberAction(state, formData) { ... }

// After:
export const addMemberAction = async (state: MemberFormState, formData: FormData): Promise<MemberFormState> => { ... }
```

- [ ] **Step 3: Verify type check**

```bash
bun run check:types
```

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "refactor: convert action file functions to arrow syntax"
```

---

## Task 3: Arrow Function Convention — lib/ and components/ Files

**Files:**
- Modify: files in `src/lib/` (excluding `src/lib/shadcn/`)
- Modify: files in `src/components/` (excluding `src/components/shadcn/`)
- Modify: files in `src/hooks/`
- Modify: `src/db/query/` files

- [ ] **Step 1: Find remaining violations**

```bash
grep -rn "^export async function\|^export function\|^async function " \
  src/lib src/components src/hooks src/db \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=shadcn
```

- [ ] **Step 2: Convert each occurrence**

For DB query files (`src/db/query/*.ts`), convert exported functions:
```ts
// Before:
export const createUser = async (values, tx) => { ... }  // already arrow — skip
export async function readUser(filters, tx) { ... }       // convert this

// After:
export const readUser = async (filters: UserFilters = {}, tx?: DBExecutor) => { ... }
```

For `src/lib/auth/`, `src/lib/actions/`, etc.: same pattern.

- [ ] **Step 3: Verify no regressions**

```bash
bun test && bun run check:types
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/ src/components/ src/hooks/ src/db/
git commit -m "refactor: convert remaining lib and db functions to arrow syntax"
```

---

## Task 4: Fix PascalCase File Names

**Files:**
- Rename: `src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx`

- [ ] **Step 1: Find all PascalCase file names in src/**

```bash
find src -name "*.tsx" -o -name "*.ts" | \
  grep -v node_modules | \
  xargs -I{} basename {} | \
  grep "^[A-Z]" | sort -u
```

- [ ] **Step 2: Rename MembersPageContent.tsx**

```bash
git mv "src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx" \
       "src/app/(dashboard)/dashboard/kader/_components/members-page-content.tsx"
```

- [ ] **Step 3: Update the import in page.tsx**

Find the page that imports it:
```bash
grep -r "MembersPageContent" src --include="*.tsx" --include="*.ts" -l
```

Update the import path from `'./MembersPageContent'` to `'./members-page-content'`.

- [ ] **Step 4: Rename any other PascalCase files found in Step 1**

Apply the same `git mv` + import update pattern for each additional file found.

- [ ] **Step 5: Type check**

```bash
bun run check:types
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: rename PascalCase files to kebab-case"
```

---

## Task 5: use cache Consistency Audit

**Files:**
- Audit and modify: all `_data/*.ts` files across `src/app/`

- [ ] **Step 1: Find data files missing use cache**

```bash
grep -rL "use cache" src/app --include="*_data*" | grep "\.ts$"
# Also check files in _data/ folders:
find src/app -path "*/_data/*.ts" | xargs grep -L "use cache"
```

- [ ] **Step 2: For each data function missing use cache, add the pattern**

Every exported function in a `_data.ts` file that performs DB queries must have:
```ts
export const getCachedX = async (params: Type) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('relevant-tag')
  return someDbQuery(params)
}
```

Import `cacheLife` and `cacheTag` from `'next/cache'` if not already present:
```ts
import { cacheLife, cacheTag } from 'next/cache'
```

- [ ] **Step 3: Replace revalidatePath with updateTag in action files**

Find action files still using `revalidatePath`:
```bash
grep -rn "revalidatePath" src/app --include="action.ts"
```

For each occurrence, replace with `updateTag` targeting the appropriate cache tag. Example:
```ts
// Before:
import { revalidatePath } from 'next/cache'
revalidatePath('/dashboard/kader')

// After:
import { updateTag } from 'next/cache'
updateTag('kader')
```

Match the tag name to the `cacheTag` used in the corresponding `_data.ts` file.

- [ ] **Step 4: Run type check**

```bash
bun run check:types
```

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "refactor: enforce use cache + cacheTag consistency in all _data files"
```

---

## Task 6: RSC Boundary Audit

**Files:**
- Audit all files with `'use client'`

- [ ] **Step 1: List all use client files**

```bash
grep -rl "^'use client'" src --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: For each file, check if 'use client' is justified**

A file needs `'use client'` only if it uses:
- `useState`, `useReducer`, `useEffect`, `useRef`, `useContext`
- Browser-only APIs (`window`, `document`, `localStorage`)
- Event handlers directly on elements (`onClick`, `onChange`, etc.)
- Third-party client-only hooks (GSAP refs, nanostores `useStore`)

If none of the above: remove `'use client'`.

- [ ] **Step 3: Remove unjustified 'use client' directives**

For each file where `'use client'` is not needed, remove the first line.

Run type check after each removal:
```bash
bun run check:types
```

If removing causes errors (e.g., child component uses client APIs), keep `'use client'`.

- [ ] **Step 4: Run tests**

```bash
bun test
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "refactor: remove unnecessary use client directives, push to leaf components"
```

---

## Task 7: Fix ESLint Warnings — no-explicit-any

**Files:**
- Modify: all files with `any` type annotations in `src/` (excluding shadcn/)

- [ ] **Step 1: Find all explicit any usages**

```bash
bun run check:lint 2>&1 | grep "@typescript-eslint/no-explicit-any" | head -30
```

- [ ] **Step 2: Fix each any occurrence**

Common patterns and their fixes:

```ts
// DB result rows (very common in raw SQL):
// Before:
const rows = (result as any).rows || result
const ids = (Array.isArray(rows) ? rows : []).map((r: any) => r.id)

// After:
const rows = (result as { rows?: { id: string }[] }).rows ?? (result as { id: string }[])
const ids = (Array.isArray(rows) ? rows : []).map((r) => r.id)
```

```ts
// Generic event handlers:
// Before:
const handleChange = (e: any) => { ... }

// After:
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
```

```ts
// Unknown API responses:
// Before:
const data: any = await response.json()

// After:
const data: unknown = await response.json()
// Then use type guards or Zod to narrow
```

- [ ] **Step 3: After all fixes, promote rule to error in eslint.config.mjs**

In `eslint.config.mjs`, change:
```js
'@typescript-eslint/no-explicit-any': 'warn',
```
to:
```js
'@typescript-eslint/no-explicit-any': 'error',
```

- [ ] **Step 4: Run lint to verify zero violations**

```bash
bun run check:lint
```

Expected: no `no-explicit-any` errors.

- [ ] **Step 5: Commit**

```bash
git add src/ eslint.config.mjs
git commit -m "fix: replace all explicit any types, promote rule to error"
```

---

## Task 8: Fix ESLint Warnings — react-hooks rules

**Files:**
- Modify: files flagged by `react-hooks/set-state-in-effect` and `react-hooks/refs`

- [ ] **Step 1: Find all react-hooks violations**

```bash
bun run check:lint 2>&1 | grep "react-hooks/" | head -30
```

- [ ] **Step 2: Fix set-state-in-effect violations**

This rule flags `setState` called directly in `useEffect` without being in an event or async callback. Pattern:

```ts
// Before (flagged):
useEffect(() => {
  if (state.values?.username) {
    setUsername(state.values.username)  // setState in effect body
  }
}, [state.values])

// After (accepted):
useEffect(() => {
  const username = state.values?.username
  if (username) {
    setUsername(username)
  }
}, [state.values?.username])  // depend on specific value, not object
```

- [ ] **Step 3: Fix refs violations**

```bash
bun run check:lint 2>&1 | grep "react-hooks/refs"
```

Fix each flagged ref usage by ensuring refs are accessed in effects or callbacks, not during render.

- [ ] **Step 4: Promote both rules to error**

In `eslint.config.mjs`, change:
```js
'react-hooks/set-state-in-effect': 'warn',
'react-hooks/refs': 'warn',
```
to:
```js
'react-hooks/set-state-in-effect': 'error',
'react-hooks/refs': 'error',
```

- [ ] **Step 5: Verify zero lint errors**

```bash
bun run check:lint
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/ eslint.config.mjs
git commit -m "fix: resolve all react-hooks warnings, promote to errors"
```

---

## Task 9: Metadata Audit

**Files:**
- Modify: `page.tsx` files missing metadata

- [ ] **Step 1: Find pages without metadata**

```bash
grep -rL "export const metadata\|export async function generateMetadata" \
  src/app --include="page.tsx"
```

- [ ] **Step 2: Add metadata to each page found**

For static pages, add a `metadata` export before the page component:
```ts
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title | KAMMI.id',
  description: 'Brief description of this page.'
}
```

For dynamic pages (e.g., `[registerNumber]`), use `generateMetadata`:
```ts
export const generateMetadata = async ({
  params
}: {
  params: Promise<{ registerNumber: string }>
}): Promise<Metadata> => {
  const { registerNumber } = await params
  return {
    title: `Profil ${registerNumber} | KAMMI.id`
  }
}
```

- [ ] **Step 3: Type check**

```bash
bun run check:types
```

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: add missing metadata exports to all pages"
```

---

## Task 10: Error Boundary Audit

**Files:**
- Possibly create: `error.tsx` files in routes missing them

- [ ] **Step 1: Find route segments without error.tsx**

```bash
# Find all route directories (those containing page.tsx)
find src/app -name "page.tsx" | xargs dirname | sort

# Find all directories with error.tsx
find src/app -name "error.tsx" | xargs dirname | sort
```

Compare the two lists. Any route directory with `page.tsx` but no `error.tsx` in itself or a parent should get one.

- [ ] **Step 2: For each missing error.tsx, create it**

```tsx
'use client'

import { ErrorView } from '~/components/error-view'

const ErrorPage = ({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  return <ErrorView type="general" context="dashboard" />
}

export default ErrorPage
```

Use `context="public"` for routes under `(main)`, `context="dashboard"` for `(dashboard)` routes.

- [ ] **Step 3: Type check**

```bash
bun run check:types
```

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: add missing error.tsx boundaries to route segments"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Full test suite**

```bash
bun test
```

Expected: all tests pass.

- [ ] **Step 2: Type check**

```bash
bun run check:types
```

Expected: zero errors.

- [ ] **Step 3: Lint — zero errors**

```bash
bun run check:lint
```

Expected: clean.

- [ ] **Step 4: Format**

```bash
bun run format && bun run check:format
```

Expected: clean.

- [ ] **Step 5: Final commit**

```bash
git add -A
git status
git commit -m "refactor: complete Phase A — Next.js 16 + React 19 core refactor" --allow-empty
```

---

**Phase A complete.** Arrow functions enforced, kebab-case files, use cache consistent, RSC boundaries correct, ESLint clean.

Proceed to Phase B plan: `docs/superpowers/plans/2026-06-04-phase-b-ui-layer.md`
