# Pre-Feature Codebase Audit — Report

Consolidated from four audit tickets (structure/convention, Next.js
best-practice, UI/a11y, technical health). See
[the map](map.md) for scope and process; each finding below links back to
the ticket holding its full detail.

Repo snapshot at audit time: ~425 `src` `.ts`/`.tsx` files (excluding
shadcn-generated code), 19 test files, 8 dashboard feature areas (kader,
branches, trainings, articles, pages, perangkat, alumni, profile). The
recently-shipped article-management feature is used throughout as the
positive baseline other areas are measured against.

## How to read this

Findings are grouped by priority tier, not by which audit surfaced them —
several issues are simultaneously a structure problem and an a11y problem,
and tiering avoids double-counting them into false-equivalence buckets.

- **Critical** — live correctness/security bugs. Worth fixing before or
  alongside the next feature, not deferred to a general cleanup pass.
- **Important** — real defects with real (if smaller) user impact, or
  systemic convention drift that will compound as more features are built
  the same way. Worth a deliberate pass soon.
- **Nice-to-have** — cosmetic/consistency polish, low risk either way.
- **Informational** — observations, doc gaps, and things checked and ruled
  fine. No action implied.

Quick-win callout: two findings below are pre-verified dead code (zero
importers) and are safe to delete outright rather than needing a decision.

---

## Critical

### C1. Cache invalidation is broken for kader edits and all training mutations — stale data is shown after real writes

[Next.js best-practice audit](issues/02-nextjs-best-practice-audit.md)

`cacheComponents: true` is live in `next.config.ts` today — this isn't a
future flag-flip, it's the current runtime. The repo's own
`cacheTag`/`updateTag` convention (established correctly in several places)
is silently skipped in others:

- **Profile-edit actions never call `updateTag('kader')`**:
  `profile/[registerNumber]/_components/action.ts`
  (`updateMemberProfileAction`, `updateMemberPhotoAction`),
  `academic-section/action.ts`, `career-section/action.ts`,
  `organization-section/action.ts` — all call `updateMember(...)` then only
  `revalidatePath`. A `bpk` editing a member's academic/career/org history
  from the profile page will see stale aggregate numbers on `/dashboard` and
  `/dashboard/kader` for the `cacheLife('minutes')` window.
- **Kader bulk-upload never invalidates**:
  `kader/_components/bulk-upload/action.ts` — bulk-imported members won't
  appear in cached views until natural cache expiry, unlike the single-add
  path which does this correctly.
- **No training mutation ever calls `updateTag('dauroh')`** — create, update,
  delete, attendant/instructor add-remove, DM1 grading, all go through
  `revalidatePath` only, despite `_data/trainings.ts` defining exactly that
  tag for `getCachedUpcomingTrainings`. The dashboard's "Daurah Terdekat"
  widget can show stale/removed trainings after any training CRUD action.
- **Root cause pattern, not isolated bugs**: the tag exists and is used
  correctly elsewhere (`kader/_components/add-form/action.ts`,
  `delete-member-button/action.ts`) — this looks like several action files
  were written before, or without awareness of, the caching convention
  established later. Worth checking for the same gap in any *new* feature
  work started before this is fixed.

**Recommendation**: fix the missing `updateTag` calls across these action
files before shipping more mutation-heavy features — the pattern is
mechanical (copy from `add-form/action.ts`) and low-risk once identified.

### C2. Cross-org authorization actions have zero test coverage — a scope-check bug here has real data/security consequences

[Technical health audit](issues/04-technical-health-audit.md)

Of 21 `action.ts` files under `src/app/(dashboard)`, only 3 (all in
`articles/_components/`) have a real test. The underlying guard primitives
(`isOrgInScope`, `fetchAllowedOrgIds`) are well tested
(`tests/access-control.test.ts`) — but the actions that *compose* those
primitives with role checks and destructive operations are not:

- **`profile/[registerNumber]/_components/delete-member-button/action.ts`**
  (`deleteMemberAction`) — role gate + cross-org scope check + confirm-string
  guard before deleting a member. Untested composition.
- **`profile/[registerNumber]/_components/reset-password/action.ts`**
  (`regenerateCredentialAction`) — same guards, then overwrites a password
  hash. **A bug in the scope check here would let one branch reset another
  branch's member credentials.** Zero tests.
- **`trainings/_components/training-detail-view/action.ts`** —
  `assertCanManage`/`assertCanEditPassing`, the latter enforcing an untested
  30-day post-training grading-window date rule (date-math/timezone bugs are
  easy to introduce silently here).
- **`kader/_components/bulk-upload/action.ts`** — transactional bulk-insert
  that generates sequential register numbers per org/year via a tx-read of
  `MAX`+increment — concurrency-fragile, and untested for both the scope
  check and the sequencing logic.
- Also untested, lower fan-out: `branches/_components/add-form/action.ts`
  (mutates the org hierarchy itself — a bad `parentId`/`type` here could
  corrupt the tree every scope check depends on),
  `profile/.../organization-section/action.ts` (a separate, inline `canEdit`
  helper distinct from the `isOrgInScope` pattern used elsewhere — worth
  checking for consistency), and the login/logout/account actions.

**Recommendation**: prioritize tests for `delete-member-button` and
`reset-password` first (highest blast radius: cross-org credential/data
integrity), then `bulk-upload` and `training-detail-view`'s grading window.
This is the single highest-leverage testing investment available before
building more features on top of the authorization layer.

---

## Important

### I1. Most non-article dashboard areas systematically deviate from AGENTS.md's structure conventions

[Structure & convention consistency audit](issues/01-structure-convention-audit.md)

The article feature is a clean, verified baseline (every folder:
`name/name.tsx` + `index.ts` + per-component `action.ts`+`action.test.ts`).
Almost everything else drifts from it in the same handful of ways, repeated
across kader, trainings, pages, and profile:

- **Sub-components flattened into one folder** instead of nested atomic
  subfolders (`kader/_components/add-form/{address-section,personal-info-section,status-section}.tsx`,
  `members-grid/*`, `bulk-upload/*`, `trainings/_components/training-grid/*`,
  `training-detail-view/*` — 6+ folders).
- **Missing `index.ts` barrels** on ~10+ folders that do have implementation
  files (`members-grid/`, `_components/logout/`, and others).
- **`trainings` uses `index.tsx` as the implementation file**, not a pure
  barrel — a distinct sub-pattern from every other feature, affecting
  `training-table/`, `training-grid/`, `filter-form/`, `add-training-modal/`.
- **Route-level shared `action.ts`** (one file consumed by many sibling
  components) recurs in 5 places: `pages/home`, `pages/managers`,
  `pages/tentang`, `user/account`, `profile/[registerNumber]`'s
  `_components/` roots — the same shape of problem as
  `src/lib/actions/storage.ts`, confirming it's systemic, not a one-off.
- **Cross-route reach-in**: `perangkat` and `alumni` routes import
  `MembersPageContent` and friends directly from `kader/_components/` via
  relative paths, instead of the shared component being promoted to
  `src/components/` per the colocation rule.
- Two non-arrow-function components outside the documented exceptions
  (`SpecialistsWrapper` in `perangkat/page.tsx`, `DataTable` in
  `data-table.tsx`).

**Recommendation**: this is the area most likely to compound if left alone —
every new feature built by copying an existing dashboard area (rather than
articles) inherits the drift. Worth a deliberate restructuring pass, or at
minimum a written note steering new work to copy the articles pattern
specifically.

### I2. `page.tsx` routes mix cached and raw DB reads — bypasses the repo's own Cache Components convention today

[Next.js best-practice audit](issues/02-nextjs-best-practice-audit.md)

`src/app/(dashboard)/dashboard/page.tsx`, `trainings/page.tsx`,
`articles/new|[id]|categories/page.tsx`,
`profile/[registerNumber]/page.tsx`, and `trainings/[branch]/[id]/page.tsx`
all call `~/db/query/*` functions directly instead of through the `_data/*.ts`
`'use cache'` wrappers the repo has already established elsewhere (or, for
`trainings/page.tsx`, ignore an existing `_data/trainings.ts` entirely).
Because these routes start from a cookies-backed session read, they're
already fully dynamic so this doesn't currently break a build — but it means
DB load on read-heavy dashboard pages is uncapped instead of bounded by
`cacheLife`, and it will immediately surface as a blocking read the moment
anyone tries to carve a static shell out of these routes for Partial
Prerendering.

**Recommendation**: not as urgent as C1/C2 (no wrong-data bug, "only" a
performance/scalability gap), but worth fixing opportunistically whenever
one of these routes is touched for other reasons.

### I3. Shared `DataTable` has keyboard-unreachable controls — one bug, three feature areas

[UI design & accessibility audit](issues/03-design-a11y-audit.md)

`src/app/(dashboard)/dashboard/_components/data-table/data-table.tsx` backs
kader, alumni, and perangkat simultaneously (the latter two are thin
wrappers around the same component). Three defects in this one file:

- Active filter-chip removal is a `<Badge onClick>` (renders a `<span>`, no
  `role`/`tabIndex`/`onKeyDown`/`aria-label`) — keyboard users cannot remove
  an applied filter.
- The search `Input` has only a `placeholder`, no `aria-label` — regresses
  versus the article feature's reference pattern.
- Row-click (`<TableRow onClick>`, `cursor-pointer`) has no keyboard
  affordance — currently unused by callers, so latent, but will fire as a
  real keyboard trap the moment any caller passes `onRowClick`.

Related, smaller-radius a11y gaps: training attendant/instructor comboboxes
lack accessible names (placeholder-only, no bound `<label>`);
`editable-cell.tsx` (kader, currently dead code) uses a div-onClick with no
keyboard handler — the *correct* pattern for this exists next door in
`home-items-list.tsx` and should be copied rather than re-invented;
`transparent-image-upload.tsx`'s upload trigger has no visible focus state
(again, the correct pattern already exists in `profile-avatar.tsx`).

**Recommendation**: fix `DataTable` first — highest leverage, single file,
three areas fixed at once. The comboboxes and upload trigger are small,
independent fixes.

### I4. Only 3 of 21 mutation actions have tests — the C2 authorization gap is part of a wider testing gap

[Technical health audit](issues/04-technical-health-audit.md)

Beyond the cross-org-critical actions called out in C2, the remaining 15
untested `action.ts` files are lower individual risk (single-org
content/profile edits without cross-org fan-out) but represent the same
structural gap: the query layer is tested, the action layer generally is
not. `_data/*.ts` fetch wrappers are similarly untested except for
`articles.ts`. Type-checking is clean; lint passes with 127 warnings (0
errors — not currently gating anything, worth deciding if that's intended);
format passes on all source files.

**Recommendation**: treat this as the backlog C2 draws from — C2 names the
four highest-risk files to start with; the rest can follow at normal pace
as those areas are touched.

---

## Nice-to-have

- **Two competing destructive-confirm UX patterns**: the gold-standard
  `AlertDialog` + type-to-confirm (used correctly in
  delete-article/training/member buttons) coexists with a plain
  `AlertDialog` (no type-to-confirm) in `article-category-manager.tsx` and a
  lighter two-button inline confirm in the profile academic/career/org
  sections. Worth converging on one pattern, not urgent.
- **Branches grid has no search/filter**, unlike kader's equivalent grid
  which has a full debounced, URL-synced search + type filter over
  structurally similar data.
- **Empty states inconsistent**: shadcn `EmptyState` used correctly in
  trainings, hand-rolled in `article-category-manager.tsx`.
- **Icon-only buttons inconsistently labeled** — e.g. `branches-grid`'s edit
  button has no `aria-label` where its kader counterpart does.
- **`autoComplete` essentially unused** across all audited forms.
- **`...` vs `…` typography** — 22 occurrences, purely cosmetic.
- **127 ESLint warnings** (0 errors) — mostly unused vars/`no-explicit-any`;
  not gating anything today, worth a decision on whether it should.
- **`site-settings` generic co-tag never invalidated** — currently harmless
  (nothing reads it alone yet) but a latent trap for a future "purge all
  site settings" feature.
- **A few oversized client components** (`home-scene.tsx` 1173 lines,
  `training-detail-view.tsx` 834 lines, `leadership-form.tsx` 761 lines) —
  organizational decomposition candidates, not correctness bugs.
- **`docs/agents` note**: AGENTS.md documents a per-component `data.ts`
  file, but in practice the whole codebase (articles included) uses
  route-level `_data/*.ts` instead — worth reconciling the doc rather than
  treating every feature as independently non-compliant.
- **No component in `src/components/` demonstrates the Compound Components
  pattern** AGENTS.md calls for — not a violation (no prop-drilling smell
  forcing the issue), but currently aspirational with no positive example.

## Quick wins — safe to delete

Both pre-verified via grep with zero real importers:

- **`src/components/ui/combobox/`** — a hand-rolled duplicate of
  `src/components/shadcn/ui/combobox.tsx`. Every real usage across the
  codebase already imports the shadcn version.
- **`src/app/(dashboard)/dashboard/trainings/_components/filter-form/`** —
  not imported by `trainings/page.tsx` (which renders `TrainingGrid`/
  `TrainingGridControls` instead). Note: this also means **org/year
  filtering on the trainings list has no UI today** even though
  `trainings/page.tsx` reads those params from `searchParams` — an
  incomplete feature, not just dead code, worth flagging to whoever owns
  trainings next.

## Informational

- `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/` confirmed absent — expected
  per `docs/agents/domain.md` (created lazily), not a defect. Domain
  knowledge currently living only in code, undocumented: the org
  hierarchy/role-scope model (`fetchAllowedOrgIds`/`isOrgInScope`), the
  member status vocabulary, the training/daurah type system and 30-day
  grading window, the register-number generation scheme, and why `xlsx` is
  sourced from a CDN tarball. These are natural first candidates whenever
  `/domain-modeling` is next run.
- Migration `20260601000001_training_identifier_trigger` is missing its
  `snapshot.json` (every other of 7 migrations has one) — a deliberate,
  hand-written trigger migration outside the normal `drizzle-kit generate`
  flow. Not broken today, but invisible to drizzle-kit's diff bookkeeping;
  worth a comment noting it was intentional so a future engineer doesn't
  "fix" it by regenerating over it.
- `drizzle-orm`/`drizzle-kit` pinned to pre-1.0 betas (`1.0.0-beta.21`) — a
  real risk for a data-integrity-sensitive app; worth tracking toward
  1.0 stable.
- `xlsx` via CDN tarball is deliberate upstream SheetJS practice (npm's
  registry version is stale), not an accidental workaround — fine as-is,
  just undocumented.
- No deprecated/legacy Next.js 16 APIs found anywhere. RSC boundaries are
  sound (no client `page.tsx`/`layout.tsx`). Zod validation coverage in
  server actions is consistently good. `src/components/ui/link-list-editor/`
  and `src/components/base-ui/select/` were checked and found fine —
  legitimate, not duplicates.
- Main-site (`src/app/(main)`) UI was only spot-checked, not fully audited
  (out of this effort's scope per the map).

---

## Suggested next step

This report is descriptive — no fixes were made. Two paths, not mutually
exclusive:

1. Open a small, focused fix for **C1 + C2** (cache invalidation + tests for
   the four highest-risk authorization actions) before starting new feature
   work — both are mechanical, bounded, and close real risk.
2. Start a separate execution map/tickets for **I1–I4** and the
   nice-to-haves at whatever pace fits alongside upcoming feature work — none
   of them block starting a new feature, they just compound if ignored.

Per this map's scope, spinning up that follow-up work is left for a
separate session when you're ready to act on it.
