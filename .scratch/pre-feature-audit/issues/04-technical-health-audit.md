# Technical health audit (tests, types, dependencies, missing domain docs)

Type: research
Status: resolved

## Question

Assess the codebase's technical health as a pre-feature baseline:

- Test coverage — only 19 test files exist against ~425 source files. Which
  areas carry real logic (server actions, query layers with guards like
  cycle-detection, cross-org checks) but have zero test coverage? Prioritize
  by risk (data-mutating actions and authorization/cross-org guards matter
  more than presentational components).
- `bun run check:types`, `check:lint`, `check:format` — run each and report
  whether they currently pass clean; list any existing errors/warnings.
- Dependency health — any dependencies that are notably outdated, deprecated,
  or risky (note `xlsx` is pulled from a CDN tarball rather than npm registry
  — flag if that's expected or worth revisiting). Check for unused
  dependencies too.
- Missing domain documentation — confirm `CONTEXT.md`, `CONTEXT-MAP.md`, and
  `docs/adr/` don't exist (per `docs/agents/domain.md`'s expectations) and
  note what domain knowledge is currently undocumented as a result (don't
  attempt to write these docs in this ticket — just flag the gap and roughly
  what it's costing).
- Migration hygiene — `src/db/__migrations/` naming and structure: anything
  irregular (skipped numbers, manual edits, drift between schema and
  migrations)?

Report as concrete findings with file paths/command output, not fixes.

## Answer

### 1. Test coverage — untested authorization/mutation logic (highest risk)

19 test files exist against 425 source files (excluding `src/components/shadcn`
and `src/lib/shadcn`). There are 21 `action.ts` files under
`src/app/(dashboard)`; only 3 folders have a real test alongside their action
(`articles/_components/article-category-manager`,
`articles/_components/article-form`,
`articles/_components/delete-article-button`). One more
(`kader/_components/add-form`) has a `store.test.ts` but it only tests the
Nanostores edit-mode store, not `action.ts` itself — so it does **not** count
as action coverage despite the folder having a `*.test.ts` file.

Pattern found repeatedly: the query-layer building blocks are tested, but the
server actions that wrap them with role/session/scope checks are not. Ordered
by risk:

- **`src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/action.ts`**
  — `deleteMemberAction`: role gate (`root`/`bpk` only) + `isOrgInScope` cross-org
  check + a "type the register number to confirm" guard before calling
  `deleteMember`. Zero test coverage of the action itself. The underlying
  `deleteMember` query and `fetchAllowedOrgIds`/`isOrgInScope` primitives *are*
  tested (`tests/delete-member.test.ts`, `tests/access-control.test.ts`), but
  the composition (role check → scope check → confirm-string check → delete →
  cache invalidation) is not.
- **`src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/action.ts`**
  — `regenerateCredentialAction`: same role gate + `isOrgInScope` check, then
  generates and hashes a new password and overwrites `passwordHash`. A bug in
  the scope check here directly lets one branch reset another branch's
  credentials. No test coverage at all.
- **`src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/action.ts`**
  — contains `assertCanManage` (session + `isOrgInScope` on the training's
  organization) and `assertCanEditPassing`, which layers on a date-window
  business rule (grades only editable after `endDate`, and only within a
  30-day window past it). This is real, easy-to-get-wrong logic (off-by-one on
  day boundaries, timezone handling via `new Date()`) with zero tests.
- **`src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts`**
  — `bulkCreateMembersAction`: role gate, `isOrgInScope` check, then a
  transactional bulk-insert that resolves org codes, generates sequential
  register numbers per org/year prefix inside the transaction (tx-read of
  `MAX` + increment — a pattern that is exactly the kind of logic that breaks
  under concurrent submissions), creates a `user` row per member, and
  optionally enrolls into a training. No test exercises the register-number
  sequencing, the transaction atomicity, or the scope check.
- **`src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/action.ts`**
  — `saveOrgHistoryAction` / `deleteOrgHistoryAction`: custom `canEdit` helper
  (root/bpk can edit anyone; a `member` can only edit their own connected
  record) is inline, untested authorization logic distinct from the
  `isOrgInScope` pattern used elsewhere — worth checking for consistency with
  the rest of the authz model.
- **`src/app/(dashboard)/dashboard/branches/_components/add-form/action.ts`**
  — `createOrganizationAction` / `updateOrganizationAction`: role-gated
  (`bpw`/`root`) creation and mutation of the org hierarchy itself (parents,
  types, codes) feeding directly into `isOrgInScope`'s recursive CTE. No
  tests; a bad `parentId` or `type` here could corrupt the hierarchy that all
  scope checks depend on.
- **`src/app/(dashboard)/dashboard/kader/_components/add-form/action.ts`** —
  has a `store.test.ts` in the same folder but it does not touch `action.ts`;
  the action itself (member creation/edit with org-scope checks, based on the
  pattern above) is untested.
- **`src/app/(dashboard)/login/_components/login-form/action.ts`** —
  authentication entry point, zero tests (password verification, session
  creation).
- **`src/app/(dashboard)/dashboard/user/account/_components/action.ts`** and
  **`src/app/(dashboard)/dashboard/_components/logout/action.ts`** — session
  mutation, untested.
- Remaining untested action files (`pages/home`, `pages/managers`,
  `pages/tentang` under `dashboard/pages/_components/action.ts`,
  `profile/.../academic-section`, `profile/.../career-section`,
  `profile/.../university-combobox`) are lower risk — mostly single-org
  content/profile edits without cross-org fan-out, but still zero coverage.

What **is** well covered: `fetchAllowedOrgIds`/`isOrgInScope`
(`tests/access-control.test.ts`, 7 cases across the org hierarchy), 
`deleteMember` query behavior (`tests/delete-member.test.ts`),
`trainingQuery.hasDependents` (`tests/delete-training.test.ts`),
`wouldCreateCycle` for article categories
(`src/db/query/article-category.test.ts` — parentId self-reference and
descendant-cycle cases), and the 3 article action.ts files noted above. This
means the core cross-org guard primitive is trustworthy, but nearly every
call site that *uses* it in a mutating action is unverified.

No `data.ts` files exist in this codebase (the convention documented in
AGENTS.md uses `_data/*.ts` instead, e.g.
`src/app/(dashboard)/dashboard/_data/{articles,members,organizations,trainings,user}.ts`).
Of these, only `_data/articles.ts` has a test
(`src/app/(dashboard)/dashboard/_data/articles.test.ts`); `members.ts`,
`organizations.ts`, `trainings.ts`, and `user.ts` have none. These files
appear to be thin fetch wrappers around the query layer rather than
containing their own guard logic, so risk here is lower than the action.ts
gaps above, but still unverified.

### 2. Command results

- **`bun run check:types`** — **PASS**, clean. `tsc --noEmit` produced zero
  output beyond the command echo.
- **`bun run check:lint`** — **PASS** (exit code 0), but not clean: **0
  errors, 127 warnings** (eslint summary: "127 problems (0 errors, 127
  warnings)", 7 auto-fixable). Warning categories seen: `@typescript-eslint/no-explicit-any`
  (several, e.g. `scripts/fetch-indonesia-provinces.ts`, `src/scripts/seed-members.ts`,
  `src/db/scripts/verify-training-trigger.ts`), `@typescript-eslint/no-unused-vars`
  (many — unused imports/vars across dashboard components), a
  `react-hooks/exhaustive-deps` warning
  (`kader/_components/add-form/status-section.tsx:41`), a `react-hooks`
  "Calling setState synchronously within an effect" warning
  (`kader/_components/individual-table/columns.tsx:64`), a React Compiler
  "Compilation Skipped: Use of incompatible library" note on
  `data-table.tsx:138` (TanStack Table's `useReactTable()` returns
  non-memoizable functions), and a couple of unused eslint-disable directives
  (`src/lib/logger/config.test.ts:27`, plus two more in another file). None of
  this fails CI as configured, but the volume (127) suggests lint has not been
  treated as a gate in practice.
- **`bun run check:format`** — **FAIL** (exit 1). Prettier flags exactly one
  file: `.scratch/pre-feature-audit/map.md` (an untracked scratch file from
  this same audit effort — `git status` confirms it's untracked, not a
  pre-existing regression). No source files under `src/` are misformatted.

### 3. Dependency health

- **`xlsx` via CDN tarball** (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`)
  — this is a known, deliberate SheetJS practice, not an accidental workaround.
  SheetJS stopped publishing current releases to the npm registry after a
  supply-chain/security incident years ago and now ships current builds only
  from their own CDN; the npm registry's `xlsx` package is stuck at `0.18.5`
  (confirmed via `npm view xlsx version` / `dist-tags` — latest on npm is
  `0.18.5`, older than the CDN's `0.20.3`). So pulling from the CDN is
  actually the *more* current and CDN-recommended approach, not a hack — but
  it does mean: (a) the install is fetching an arbitrary tarball URL with no
  registry integrity/lockfile provenance the way scoped packages get, (b) if
  `cdn.sheetjs.com` ever goes down or the URL 404s, installs break with no
  fallback, and (c) it bypasses normal `npm audit`/Dependabot-style vulnerability
  scanning since it's not a registry package. Worth revisiting only in the
  sense of: pin/vendor a copy, or at least document why in a comment near the
  dependency, so a future engineer doesn't "fix" it by pointing it back at the
  stale npm version.
- **`drizzle-orm` / `drizzle-kit` pinned to `1.0.0-beta.21`** — `npm outdated`
  shows "Wanted" as `1.0.0-rc.4-*` (a newer prerelease) while "Latest" reports
  `0.31.10`/`0.45.2` (npm's dist-tag semantics get confused by the 1.0 beta
  channel — the actual newest published version is the rc, not the 0.x
  latest tag). Running a pre-1.0 beta ORM in production for a project this
  data-integrity-sensitive (recursive org hierarchy, migrations with manual
  trigger SQL — see below) is a real risk: beta APIs can change under you on
  a routine `bun install`/lockfile update, and migration-format changes
  between beta releases are exactly the kind of thing that could silently
  corrupt migration history.
- **Other outdated packages** (via `npm outdated`, current → latest):
  `@base-ui/react` 1.4.1 → 1.6.0, `next` 16.2.2 → 16.2.12 (patch-level, likely
  safe), `eslint` 9.39.4 → 10.8.0 (major), `typescript` 5.9.3 → 7.0.2 (major —
  large jump), `tailwindcss` 4.2.2 → 4.3.3, `zod` 4.3.6 → 4.4.3, `recharts`
  3.8.0 → 3.10.1, `@tiptap/*` 3.27.1 → 3.29.2, `shadcn` CLI 4.1.2 → 4.16.0,
  `nanostores` 1.3.0 → 1.4.2, `react`/`react-dom` 19.2.4 → 19.2.8. None of
  these looked urgent/security-flagged, just aging.
- **Unused-dependency spot check** — grepped usage for the suspicious/heavy
  ones: `@dnd-kit/*` (used in `home-items-list.tsx` and `leadership-form.tsx`),
  `react-leaflet`/`leaflet` (1 usage file), `vaul` (used by
  `src/components/shadcn/ui/drawer.tsx`), `cmdk` (used by
  `src/components/shadcn/ui/command.tsx`), `@tanstack/react-table` (6 usage
  files), `@tiptap/*` (1 usage file, the article rich-text editor). None of
  these came back as dead/unused. This was a spot check, not exhaustive.

### 4. Missing domain documentation

Confirmed absent: `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/` all do not
exist at the repo root (`ls` returns "No such file or directory" for all
three). Per `docs/agents/domain.md` this is expected to be created lazily
via the domain-modeling skill, not flagged as a defect — noting it here only
per the ticket's request.

What's likely undocumented as a result, inferred from the code explored during
this audit:
- The **organization hierarchy and role model** (`pp` → `pw`/`pdln` → `pd` →
  `pk`, with roles `root`/`bpw`/`bph`/`bpk`/`humas`/`member`, and how each
  role's visibility scope is derived — recursive-CTE subtree for
  `bpw`/`bph`/`bpk`, single-org for `humas`, all-orgs for `root`). This logic
  lives only in `src/db/query/organization.ts` (`fetchAllowedOrgIds`,
  `isOrgInScope`) and is re-derived by reading code, not written down
  anywhere as a decision record — a natural first ADR/CONTEXT.md candidate.
- The **member lifecycle/status vocabulary** (`ab1`/`ab2`/`ab3`, alumni,
  suspended, non-active, soft-delete via `deleted_at`) and what transitions
  are valid.
- The **training/daurah domain** (`dm1`/`dm2`/`dpmk`/`tfi`/`dm3`/`other`
  types, the per-org-per-year sequential `identifier` trigger, the 30-day
  post-training grading window enforced in `assertCanEditPassing`) — this
  30-day rule in particular is a business rule that only exists as inline
  code with no named policy.
- Why `xlsx` is sourced from a CDN tarball (see above) — undocumented
  reasoning that a future engineer could easily "fix" incorrectly.
- The register-number generation scheme (`{pwCode}{pdCode}{year}{seq}`) and
  its uniqueness/concurrency assumptions.

### 5. Migration hygiene

`src/db/__migrations/` contains 7 migration folders (drizzle-orm 1.0 beta's
new folder-per-migration format: `<timestamp>_<slug>/migration.sql` +
`snapshot.json`, no `_journal.json`):

```
20260529063120_free_vengeance/         (migration.sql + snapshot.json)
20260601000001_training_identifier_trigger/   (migration.sql ONLY — no snapshot.json)
20260604105440_cultured_silver_sable/  (migration.sql + snapshot.json)
20260611051709_green_gressill/         (migration.sql + snapshot.json)
20260613134236_fantastic_true_believers/ (migration.sql + snapshot.json)
20260613134706_early_speed_demon/      (migration.sql + snapshot.json)
20260626171908_funny_pete_wisdom/      (migration.sql + snapshot.json)
```

Timestamps are chronologically ordered and none are skipped/duplicated.
**One clear irregularity**: `20260601000001_training_identifier_trigger` is
missing its `snapshot.json` — every other migration has one, generated
automatically by `drizzle-kit generate`. Its timestamp suffix (`000001`
seconds) and hand-written content (a raw `CREATE OR REPLACE FUNCTION
assign_training_identifier()` + `CREATE TRIGGER training_before_insert_identifier`
for auto-assigning a per-org-per-year sequential `identifier` on the
`training` table) strongly suggest this migration was authored by hand
outside the normal `bun run db:generate` flow rather than derived from a
schema diff. This is a known-risky pattern for drizzle-kit: the schema
snapshot chain is how it tracks "what the DB looked like after each
migration" to compute the next diff, and a missing snapshot means this step
is invisible to that machinery — future `db:generate` runs could either
silently miss this trigger when diffing, or drizzle-kit's migration table
bookkeeping could be inconsistent if it expects one snapshot per applied
migration. Confirmed via `git log` that this and the schema/query files
around `article`/`article-category` were both added as intentional,
purpose-named commits (not accidental), so the trigger migration is a
deliberate manual step — but it's undocumented as such and isn't consistent
with the rest of the migration history's structure.

No other drift was found between `src/db/schema/*.sql.ts` (12 schema files:
academic, article, article-category, career, member, organization-history,
organization, session, site-settings, training, user) and the migrations
directory — the schema files match what the 7 migrations would produce, and
`article`/`article-category` schemas (added most recently per git log) have
corresponding migrations and are also the only schema files with their own
`*.sql.test.ts` (`article.sql.test.ts`, `article-category.sql.test.ts`).
