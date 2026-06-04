# Phase B: UI Layer Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the broken BaseUI Select using actual BaseUI primitives, consolidate duplicate combobox implementations, audit complex components for Compound Component pattern opportunities, and run an a11y + visual polish pass.

**Architecture:** Targeted rewrites and audits. The BaseUI Select rewrite is the most impactful change — it replaces a hand-rolled broken implementation with proper accessible primitives. All other tasks are surgical edits.

**Tech Stack:** @base-ui/react, Shadcn (style: base-luma), Tailwind CSS v4, class-variance-authority, HugeIcons

**Prerequisites:** Phase A complete and all tests passing.

**IMPORTANT:** Before any component work, invoke the `shadcn` and `base-ui-docs` skills to get current API docs for `@base-ui/react/select`.

---

## Task 1: BaseUI Select Rewrite

**Files:**
- Rewrite: `src/components/base-ui/select/base-ui-select.tsx`
- Delete: `src/components/base-ui/select/use-select.ts`
- Modify: `src/components/base-ui/select/types.ts` (if needed)
- Keep: `src/components/base-ui/select/index.ts` (barrel — no changes needed)

**Why the current implementation is broken:**
- Uses a custom `useSelect` hook with no connection to `@base-ui/react`
- The `useEffect` sync for controlled value is explicitly commented as doing nothing
- Listbox items are `<div onClick>` — no ARIA roles, not keyboard navigable
- `highlightedOption` variable is declared but never used

- [ ] **Step 1: Read current BaseUI Select API docs**

Invoke the `base-ui-docs` skill to get the current `Select` component API from `@base-ui/react`. Then read the current implementation for reference:

```bash
cat src/components/base-ui/select/base-ui-select.tsx
cat src/components/base-ui/select/types.ts
```

- [ ] **Step 2: Rewrite base-ui-select.tsx using @base-ui/react/select**

Replace `src/components/base-ui/select/base-ui-select.tsx` with a proper BaseUI implementation. The component must:
- Accept the same `BaseUISelectProps` interface (value, onChange, options, placeholder, isLoading, label, error, name)
- Use `@base-ui/react/select` primitives (Select.Root, Select.Trigger, Select.Positioner, Select.Popup, Select.Item)
- Be keyboard navigable (BaseUI handles this by default)
- Show label above trigger if `label` prop is provided
- Show error message below if `error` prop is provided
- Show loading text in trigger when `isLoading` is true
- Be a controlled component (sync internal state with `value` prop)

Example structure (adapt to actual BaseUI API from docs):
```tsx
'use client'

import * as Select from '@base-ui/react/select'
import { cn } from '~/lib/shadcn/utils'
import type { BaseUISelectProps } from './types'

export const BaseUISelect = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  isLoading = false,
  label,
  error,
  name
}: BaseUISelectProps) => {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <Select.Root
        value={value ?? ''}
        onValueChange={(val) => onChange?.(val)}
        disabled={isLoading}
        name={name}
      >
        <Select.Trigger
          id={name}
          className={cn(
            'flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm transition-all dark:bg-slate-900',
            'border-slate-200 hover:border-slate-300 dark:border-slate-700',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[popup-open]:border-transparent data-[popup-open]:ring-2 data-[popup-open]:ring-blue-500',
            error && 'border-red-500'
          )}
        >
          <Select.Value
            placeholder={isLoading ? 'Memuat...' : placeholder}
            className={cn(!value && 'text-slate-400')}
          />
          <Select.Icon className="h-4 w-4 transition-transform data-[popup-open]:rotate-180">
            ▾
          </Select.Icon>
        </Select.Trigger>

        <Select.Positioner sideOffset={4}>
          <Select.Popup className="z-50 max-h-60 w-[var(--anchor-width)] overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-center text-sm text-slate-500">
                Tidak ada opsi
              </div>
            ) : (
              options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm text-slate-700 transition-colors',
                    'hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    'data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700',
                    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
                  )}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))
            )}
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default BaseUISelect
```

Adjust method/component names to match the exact BaseUI API version installed (check `node_modules/@base-ui/react` exports).

- [ ] **Step 3: Delete the now-unused use-select.ts**

```bash
rm src/components/base-ui/select/use-select.ts
```

- [ ] **Step 4: Update the barrel export if needed**

Check `src/components/base-ui/select/index.ts` — if it exports from `use-select`, remove that export.

- [ ] **Step 5: Type check**

```bash
bun run check:types
```

Expected: zero errors.

- [ ] **Step 6: Find all usages of the select component and verify they still work**

```bash
grep -r "BaseUISelect\|base-ui/select\|AsyncSelect" src --include="*.tsx" --include="*.ts" -l
```

Review each usage. The props interface hasn't changed, so they should work without modification.

- [ ] **Step 7: Commit**

```bash
git add src/components/base-ui/select/
git commit -m "fix: rewrite BaseUI Select using actual @base-ui/react/select primitives"
```

---

## Task 2: Combobox Consolidation

**Files:**
- Audit: `src/components/shadcn/ui/combobox.tsx`
- Audit: `src/components/ui/combobox/`
- Possibly delete one of them

- [ ] **Step 1: Find all usages of each combobox**

```bash
# shadcn combobox
grep -r "shadcn/ui/combobox\|from '~/components/shadcn/ui/combobox'" src --include="*.tsx" --include="*.ts" -l

# custom combobox
grep -r "components/ui/combobox\|from '~/components/ui/combobox'" src --include="*.tsx" --include="*.ts" -l
```

- [ ] **Step 2: Determine which to keep**

If only one is used → delete the unused one.
If both are used → check if they have overlapping functionality. If yes, migrate usages to one and delete the other. If they serve different purposes (e.g., one is async, one is sync), keep both but document the distinction in a comment at the top of each file.

- [ ] **Step 3: Migrate usages if consolidating**

For each file using the deleted combobox, update the import to use the kept one. Adjust props if needed.

- [ ] **Step 4: Type check**

```bash
bun run check:types
```

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "refactor: consolidate duplicate combobox implementations"
```

---

## Task 3: Compound Component Audit — branches-grid

**Files:**
- Audit: `src/app/(dashboard)/dashboard/branches/_components/branches-grid/`
- Possibly refactor: `branch-card.tsx`, `branch-management-sheet.tsx`, `branches-header.tsx`, `branches-pagination.tsx`, `branches-grid.tsx`

- [ ] **Step 1: Read the current implementation**

```bash
cat "src/app/(dashboard)/dashboard/branches/_components/branches-grid/branches-grid.tsx"
cat "src/app/(dashboard)/dashboard/branches/_components/branches-grid/branches-header.tsx"
cat "src/app/(dashboard)/dashboard/branches/_components/branches-grid/branches-pagination.tsx"
```

- [ ] **Step 2: Assess prop-drilling severity**

Check if `branches-grid.tsx` passes more than 2-3 props down to children. If yes, consider Compound Component pattern.

A Compound Component looks like:
```tsx
// Usage:
<BranchesGrid data={branches}>
  <BranchesGrid.Header title="Cabang" />
  <BranchesGrid.Content />
  <BranchesGrid.Pagination />
</BranchesGrid>

// Implementation:
export const BranchesGrid = ({ data, children }: Props) => {
  return <BranchesGridContext.Provider value={{ data }}>{children}</BranchesGridContext.Provider>
}
BranchesGrid.Header = BranchesHeader
BranchesGrid.Content = BranchesContent
BranchesGrid.Pagination = BranchesPagination
```

- [ ] **Step 3: Apply Compound Component pattern if prop-drilling is severe (3+ props passed through)**

If prop-drilling is minimal (1-2 props), leave as-is and document the decision with a comment.

- [ ] **Step 4: Type check and tests**

```bash
bun run check:types && bun test
```

- [ ] **Step 5: Commit if changes were made**

```bash
git diff --quiet || (git add src/app/ && git commit -m "refactor: apply compound component pattern to branches-grid")
```

---

## Task 4: Accessibility Pass

**Files:**
- Audit and modify: any component with interactive elements lacking ARIA or keyboard nav

- [ ] **Step 1: Audit custom interactive elements**

```bash
# Find divs/spans with onClick handlers (potential a11y issues)
grep -rn "onClick" src --include="*.tsx" | grep "<div\|<span" | grep -v "//.*onClick" | head -20
```

- [ ] **Step 2: Fix each flagged interactive element**

Replace non-semantic click handlers with proper elements:
```tsx
// Before (inaccessible):
<div onClick={handleClick} className="...">Action</div>

// After (accessible):
<button type="button" onClick={handleClick} className="...">Action</button>
```

Or use BaseUI Button primitive if appropriate.

- [ ] **Step 3: Audit form fields for label association**

```bash
# Find Input elements without associated labels
grep -rn "<Input\|<input" src --include="*.tsx" | grep -v "aria-label\|aria-labelledby\|id=" | head -20
```

Fix by ensuring every `<Input id="x">` has a corresponding `<label htmlFor="x">` or `aria-label`.

- [ ] **Step 4: Run lint**

```bash
bun run check:lint
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "fix: accessibility improvements — semantic elements and label associations"
```

---

## Task 5: Visual Polish Pass

**Files:**
- Audit and modify: components with inconsistent spacing, states, or loading indicators

- [ ] **Step 1: Invoke the impeccable skill for a visual audit**

```
/impeccable
```

Follow the skill's guidance for identifying and fixing visual inconsistencies.

- [ ] **Step 2: Audit loading state consistency**

```bash
# Find components that should show loading states
grep -rn "isPending\|isLoading\|isFetching" src/app --include="*.tsx" -l
```

For each file, verify:
- A `<Spinner />` or loading text is shown when the state is true
- The `<Skeleton />` component is used for content loading states
- Disabled state is applied to buttons when `isPending`

- [ ] **Step 3: Audit empty state consistency**

```bash
grep -rn "EmptyState\|empty-state" src --include="*.tsx" -l
```

For lists that can be empty, verify `<EmptyState />` is used consistently.

- [ ] **Step 4: Fix identified issues**

Apply targeted fixes for each inconsistency found. Keep changes minimal — no redesigns, only consistency fixes.

- [ ] **Step 5: Type check**

```bash
bun run check:types
```

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "polish: improve loading states, empty states, and visual consistency"
```

---

## Task 6: Final Verification

- [ ] **Step 1: Full test suite**

```bash
bun test
```

Expected: all tests pass.

- [ ] **Step 2: Component tests**

```bash
bun run test:ct
```

Expected: all component tests pass.

- [ ] **Step 3: Type and lint check**

```bash
bun run check:types && bun run check:lint
```

Expected: zero errors.

- [ ] **Step 4: Format**

```bash
bun run format && bun run check:format
```

Expected: clean.

- [ ] **Step 5: Final commit**

```bash
git add -A
git status
git commit -m "refactor: complete Phase B — UI layer audit and polish" --allow-empty
```

---

**Phase B complete.** BaseUI Select rewritten, combobox consolidated, a11y improved, visual polish applied.

Proceed to Phase E plan: `docs/superpowers/plans/2026-06-04-phase-e-agents-md.md`
