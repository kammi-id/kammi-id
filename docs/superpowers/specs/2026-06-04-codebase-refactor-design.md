# Codebase Refactor & Audit Design

**Date:** 2026-06-04
**Branch:** 20260604
**Scope:** Full codebase refactor, audit, test infrastructure, and CI hardening

---

## Overview

A comprehensive refactor and audit of the kammi-id Next.js 16 / React 19 codebase,
executed in five sequential phases. Each phase must complete before the next begins,
with Phase D (test infrastructure) serving as the safety net for all subsequent work.

**Execution strategy:** Subagents run in parallel within each phase; phases run sequentially.

---

## Phase Order

```
D → C → A → B → E
```

| Phase | Area | Priority |
|-------|------|----------|
| D | Test Infrastructure | Gate — must pass before anything else |
| C | Bun & Modern Web Optimizations | Foundation hardening |
| A | Core Refactor (Next.js 16 + React 19) | Architecture |
| B | UI Layer (Shadcn/BaseUI + Polish) | Presentation |
| E | AGENTS.md Rules Update | Enforcement |

---

## Phase D — Test Infrastructure (from scratch)

All existing test files are deleted and rewritten from zero with a deliberate strategy.

### Test Runners & Tools (no new dependencies)

| Type | Runner |
|------|--------|
| Unit & Integration | `bun test` + `happy-dom` + `@testing-library/jest-dom` |
| Component | `@playwright/experimental-ct-react` |
| E2E | `@playwright/test` |
| Docker build | Shell script via `bun run test:docker` |
| Smoke | `wait-on` + fetch to `/api/health` |

### Layer 1 — Unit Tests

Colocated `*.test.ts` next to each source file.

| File | Coverage |
|------|----------|
| `src/lib/access-control.ts` | `hasRequiredRole`, `hasMinimumLevel`, `isHumas` — all role combinations |
| `src/lib/utils/format.ts` | All formatter functions |
| `src/lib/utils/member.ts` | Member helper functions |
| `src/lib/utils/user.ts` | `getRandomAlphanumeric`, `generatePassword` |
| `src/lib/utils/site-image.ts` | Image URL helpers |
| `src/lib/shadcn/utils.ts` | `cn()` merge behavior |

### Layer 2 — Integration Tests

Located in `tests/integration/`. Require a real PostgreSQL database.
Each test file runs `TRUNCATE ... CASCADE` in `beforeEach`.
CI provides PostgreSQL via service container (already configured in `ci.yml`).

| Area | Coverage |
|------|----------|
| `db/query/organization` | `fetchAllowedOrgIds` per role, `createOrganization`, hierarchy traversal |
| `db/query/member` | CRUD, filters, CTE |
| `db/query/user` | Create, fetch, update |
| `db/query/session` | Session lifecycle |
| Server Actions | Happy path + Zod validation errors for each critical action |

### Pre-test Cleanup (before writing any tests)

Move flat-file components to atomic structure so component test paths are stable from the start:

| Current | Target |
|---------|--------|
| `src/components/image-upload.tsx` | `src/components/image-upload/image-upload.tsx` + `index.ts` |
| `src/components/unsaved-changes-banner.tsx` | `src/components/unsaved-changes-banner/unsaved-changes-banner.tsx` + `index.ts` |

Also delete `src/components/shadcn/ui/button/button.backup.tsx` (stale backup file).

Update all import references after moving.

### Layer 3 — Component Tests

Colocated `*.playwright.tsx` files. Playwright CT (experimental). Only critical reusable components:

- `src/components/image-upload/`
- `src/components/unsaved-changes-banner/`
- `src/components/access-guard/access-guard.tsx`
- `src/components/error-view/error-view.tsx`
- Customized Shadcn components (Button, etc.)

### Layer 4 — E2E Tests

Located in `tests/e2e/*.playwright.ts`. Run against `bun run dev` server.

| Flow | Scope |
|------|-------|
| Auth | Login valid, login invalid, logout, session expiry |
| Dashboard | Access per role, redirect when unauthorized |
| Member management | List members, access control per role |

### Layer 5 — Docker Build Test

`scripts/test-docker.sh`:
```sh
docker build -t kammi-id-test . && docker rmi kammi-id-test
```

Added as `bun run test:docker` in `package.json`. Non-zero exit code on failure.

### Layer 6 — Smoke Test

`scripts/smoke-test.sh`:
1. `docker run` the built image
2. `wait-on` polls `GET /api/health` with `X-CI-Token` header
3. Assert response body equals `"OK"`
4. `docker stop`

Added as `bun run test:smoke` in `package.json`.

### Healthcheck Endpoint

**Route:** `GET /api/health` → `src/app/api/health/route.ts`

- Reads `process.env.CI_HEALTH_TOKEN`
- If request header `X-CI-Token` matches → respond `200` with plain text `"OK"`
- Otherwise → respond `404` with no body (does not leak any information)
- Not accessible in browsers (no matching header → 404)
- `CI_HEALTH_TOKEN` added as GitHub Actions secret

### CI Workflow (`ci.yml`) Updates

The current `ci.yml` and `docker.yml` are merged into a single unified workflow.
Docker build job uses `needs: [test]` — it will not run if any test fails.

**Job: `test`**
1. Fix formatting: `bun run format`
2. Fix linting: `bun run lint:fix`
3. Commit auto-fixes back to branch (if any changes): `git commit -am "style: auto-fix formatting and linting [skip ci]"` + push
4. Type check: `bun run check:types`
5. Set up database functions (uuidv7)
6. Run DB migrations: `bun run db:migrate`
7. Run unit + integration tests: `bun test`
8. Install Playwright browsers
9. Run component tests: `bun run test:ct`
10. Start dev server + E2E tests: `bun run test:e2e`

**Job: `docker`** (`needs: [test]`)
- Runs on: push to `main`, push of `v*.*.*` tags, PRs to `main`
- Builds and pushes image to GHCR (same logic as current `docker.yml`)
- Runs smoke test after successful build

**Additional changes to `ci.yml`:**
- Update Postgres service image from `postgres:16` to `postgres:18.3-bookworm` (consistent with `docker-compose.yml`)
- Add `CI_HEALTH_TOKEN` secret usage in smoke test step

**New script in `package.json`:**
```json
"lint:fix": "eslint --fix"
```

---

## Phase C — Bun & Modern Web Optimizations

### C1 — bunfig.toml

Add `frozen = true` under `[install]`. Add `*.playwright.tsx` to test exclusions.

### C2 — next.config.ts Hardening

| Addition | Reason |
|----------|--------|
| `poweredByHeader: false` | Remove `X-Powered-By: Next.js` response header (security) |
| `reactStrictMode: true` | Double-render in dev to surface side effects |

### C3 — TypeScript

- Bump `target` from `ES2017` → `ES2022`
- Add `exactOptionalPropertyTypes: true`

### C4 — ESLint Cleanup

Fix all occurrences of the two TODO-flagged rules in `eslint.config.mjs`, then promote from `warn` to `error`:
- `@typescript-eslint/no-explicit-any`
- `react-hooks/set-state-in-effect`
- `react-hooks/refs`

### C5 — Bun-specific APIs

Audit scripts and utilities for Node.js APIs that have faster Bun equivalents:
- `fs.readFileSync` → `Bun.file().text()` in scripts
- Check for other Node built-in usages in `src/scripts/`

### C6 — Dependency Audit

Run `bun outdated`. Update stale deps. Remove unused deps if found.

---

## Phase A — Core Refactor (Next.js 16 + React 19)

### A1 — Arrow Function Convention

All files in `src/` (excluding `src/components/shadcn/`, `src/lib/shadcn/`, and
Next.js convention files) must use arrow function syntax:

```ts
// Wrong:
export async function getCachedMemberAggregates(filters) { ... }

// Correct:
export const getCachedMemberAggregates = async (filters) => { ... }
```

### A2 — Naming Convention Fix

`MembersPageContent.tsx` → `members-page-content.tsx`.
Audit entire codebase for PascalCase file names and rename to kebab-case.

### A3 — `use cache` Consistency

- Audit all `_data.ts` files: every exported function must use `'use cache'` + `cacheTag` + `cacheLife`
- Replace `revalidatePath` with `updateTag` in action files where granular cache invalidation is applicable

### A4 — RSC Boundary Audit

- Audit all ~30 `'use client'` files
- Remove `'use client'` where there is no client-only API usage (no state, no effects, no event handlers)
- Enforce pattern: `*-client.tsx` for client leaf components, parent stays RSC

### A5 — ESLint Warnings → Errors

After Phase C fixes all `any` types and hook patterns, promote warnings to errors in `eslint.config.mjs`.

### A6 — Metadata

Audit all `page.tsx` files. Add `export const metadata` or `generateMetadata()` where missing.

### A7 — Error Boundaries

Verify `error.tsx` exists at all critical route segments. Add where missing.

---

## Phase B — UI Layer Audit

### B1 — BaseUI Select Rewrite

`src/components/base-ui/select/base-ui-select.tsx` is a broken hand-rolled implementation
that does not use BaseUI primitives. Rewrite using `@base-ui/react/select`.
Delete `use-select.ts` (custom hook no longer needed after rewrite).

Issues with current implementation:
- `useEffect` sync is a no-op (documented in the code itself)
- Listbox uses `<div onClick>` — no ARIA roles, keyboard inaccessible
- `highlightedOption` variable declared but never used

### B2 — Duplicate Combobox Consolidation

Two combobox implementations exist:
- `src/components/shadcn/ui/combobox.tsx`
- `src/components/ui/combobox/`

Audit usage across codebase, keep one, delete the other.

### B3 — Cleanup

The flat-file moves (`image-upload`, `unsaved-changes-banner`) and `button.backup.tsx` deletion
are done in Phase D (Pre-test Cleanup) to keep component test paths stable from the start.
No additional cleanup needed here.

### B4 — Compound Component Audit

Audit complex multi-file components for prop-drilling:
- `branches/_components/branches-grid/` (5 sub-files)
- `training-detail-view/`

Convert to Compound Component pattern where beneficial.

### B5 — Accessibility Pass

- All custom interactive elements (dropdown, select, combobox): verify keyboard navigation and ARIA roles
- All form fields: verify `<label>` association
- Color contrast: validated via existing OKLCH design tokens

### B6 — Impeccable Polish

- Spacing, typography, and radius consistency across components
- Loading states and empty states: verify `empty-state.tsx` and `spinner.tsx` are used consistently
- Micro-interactions: transitions feel natural and purposeful

---

## Phase E — AGENTS.md Rules Update

Add the following mandatory rules:

### Pre-commit (required before every commit)

```sh
bun run format        # auto-fix formatting
bun run lint:fix      # auto-fix linting
bun run check:types   # must pass with zero errors
bun test              # must pass with zero failures
```

### Pre-push (required before every push)

```sh
bun run test:docker   # docker build must succeed
bun run test:ct       # Playwright component tests must pass
```

### Pre-session-end Checklist

Before declaring any task complete:
- [ ] All unit tests pass (`bun test`)
- [ ] Type check clean (`bun run check:types`)
- [ ] No ESLint errors (`bun run check:lint`)
- [ ] Docker build succeeds (`bun run test:docker`)
- [ ] No regressions in Next.js DevTools (`get_errors`)

### CI Rules

- Format (`bun run format`) and lint fix (`bun run lint:fix`) run **before** tests in CI
- If formatting or linting produces changes, CI auto-commits them back to the branch
- Container build job **must not run** if the test job has not passed (`needs: [test]`)
- E2E tests (`bun run test:e2e`) are CI-only — not required locally
- Smoke test (`bun run test:smoke`) is CI-only — runs after docker build

### Note on CI as Safety Net

CI auto-fixes are a safety net, not the primary workflow.
Agents must run `format` and `lint:fix` locally before committing — do not rely on CI to clean up.
