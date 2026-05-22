# Design Spec: Codebase Organization Refactor
Date: 2026-04-20
Status: Proposed

## 1. Overview
The goal of this refactor is to transition the codebase to a highly consistent, atomic, and colocated structure. This will improve maintainability, reduce cognitive load when navigating the project, and ensure that every component follows a predictable pattern for logic, state, and data fetching.

## 2. Core Principles

### 2.1 Colocation
Components must reside as close as possible to where they are used:
- **Route-Specific Components:** Located in `_components` folders within the route segment.
- **Global Reusable Components:** Located in `src/components/`.

### 2.2 Named-File Atomic Pattern
Every component or function must have its own folder.
- **Main File:** Named after the component (e.g., `my-component.tsx`).
- **Barrel File:** An `index.ts` file that exports the main component (`export * from './my-component'`).
- **Naming Convention:** Use kebab-case for folder and file names.

## 3. Component Folder Structure
A component folder can contain the following supporting files:

| File | Purpose | Standard |
| :--- | :--- | :--- |
| `index.ts` | Barrel export | `export * from './component-name'` |
| `component-name.tsx` | Main UI & Logic | Arrow functions, RSC-first, a11y-compliant |
| `action.ts` | Server Actions | Zod validation, `useTransition`, `revalidatePath` |
| `data.ts` | Data Fetching | `use cache`, `cacheLife`, `cacheTag` |
| `store.ts` | State Management | Nanostores for reactive client state |
| `types.ts` | Type Definitions | Strict TS interfaces/types |
| `constants.ts` | Static Values | Config, magic strings, option lists |
| `utils.ts` | Local Helpers | Pure functions specific to the component |
| `*.test.ts` | Testing | Vitest/Playwright tests |

## 4. Ultra-Atomic Engineering Standards

### 4.1 Composition Pattern
- Use **Compound Components** for complex reusable components to avoid prop-drilling.
- Keep components small and focused on a single responsibility.

### 4.2 Documentation (TSDoc)
- **Mandatory TSDoc:** Every component, function, variable, and hook MUST have a TSDoc block.
- **Content:** Include a clear description of purpose, parameters (`@param`), and return values (`@returns`).
- **Goal:** Ensure that any agent or developer can understand the intent and usage without reading the implementation.

### 4.3 Next.js 16 Performance
- **RSC Optimization:** Push `'use client'` directives to the leaf-most components.
- **Caching Strategy:** Use granular invalidation via `cacheTag` in `data.ts` and `updateTag` in `action.ts`.
- **UX:** Implement Optimistic Updates using `useOptimistic` for mutations.

### 4.4 Accessibility (a11y)
- Use semantic HTML elements.
- Ensure all interactive elements have appropriate `aria-labels` and are keyboard accessible.

## 5. Migration Strategy (Surgical Migration)
To prevent regressions, components will be migrated one by one:
1. **Identify** single-file components in `_components`.
2. **Create** the atomic folder and rename the file.
3. **Implement** the `index.ts` barrel file.
4. **Update** all import paths across the codebase.
5. **Extract** logic into `action.ts`, `data.ts`, or `store.ts` if applicable.
6. **Verify** compilation and runtime stability.
7. **Re-scan & Sync:** After each successful migration, perform a fresh scan of the `_components` directories to identify remaining single-file components. This ensures that if the process was interrupted by an error, no components are skipped or overlooked.

## 6. Exceptions
The following are exempt from these rules:
- **Shadcn UI:** Everything in `src/components/shadcn/` and `src/lib/shadcn/`.
- **Next.js Convention Files:** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
