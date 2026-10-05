# Next.js best-practice audit (caching, RSC boundaries, performance)

Type: research
Status: resolved

## Question

This project runs Next.js 16.2.2 with conventions that differ from stock
Next.js knowledge (per AGENTS.md's warning to read
`node_modules/next/dist/docs/` before assuming behavior). Audit the codebase
against current Next.js best practice for this version:

- `'use cache'` / `cacheTag` / `cacheLife` usage in `data.ts` files — are
  cacheable reads actually cached, and do mutations call the matching
  `updateTag`/`revalidateTag` in their `action.ts`? Flag data-fetching code
  that should use these but doesn't, and any cache-tag/invalidation
  mismatches.
- RSC-first compliance — is `'use client'` pushed to leaf components, or are
  large subtrees needlessly client-rendered?
- Cache Components readiness — would `cacheComponents` (see the
  `next-cache-components-adoption` skill) surface blocking-prerender issues
  in current routes? A quick scan for obvious blockers (uncached dynamic
  reads inside route segments that should be static) counts; a full flag-flip
  is out of scope for this ticket.
- Data-fetching patterns — server actions doing validation (Zod) correctly,
  no client-side waterfalls that should be server-fetched.
- Any use of deprecated/legacy APIs relative to Next 16 (check against
  `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` and
  the codemods list).

Report concrete findings (file path + issue + which Next.js doc/guide it
contradicts). Use `src/app/(dashboard)/dashboard/articles/_data` and its
`action.ts` as a positive reference for the cacheTag/updateTag pattern this
repo has already converged on.

## Answer

Correction on setup: the "positive reference" the ticket named
(`.../articles/_data`) doesn't exist — the converged pattern actually lives in
the shared `src/app/(dashboard)/dashboard/_data/*.ts` files (e.g.
`articles.ts`, `members.ts`, `organizations.ts`, `trainings.ts`, `user.ts`),
each paired with `action.ts` files in the relevant `_components/*` folders.
That pattern (`'use cache'` + `cacheLife(...)` + `cacheTag('tag')` in the
reader, `updateTag('tag')` in the matching mutation) is real and is used
correctly in most places. Findings below are ordered by impact/breadth.

Also material to every finding: `next.config.ts` has `cacheComponents: true`
already turned on. This is not a future flag-flip exercise — the repo is
already running under Cache Components semantics today, so any uncached
dynamic read inside a route segment is a live blocking-prerender/dynamic-hole
concern right now, not a hypothetical one.

### 1. `page.tsx` route components mix cached and raw (uncached) DB reads directly — widest-reaching issue

Several dashboard `page.tsx` files import query functions straight from
`~/db/query/*` and call them inline, alongside the correct `getCached*`
helpers from `_data/*.ts`, with no `'use cache'` boundary or `<Suspense>`
around the raw calls:

- `src/app/(dashboard)/dashboard/page.tsx` — calls `readMemberAggregates`
  (raw, 3x) directly next to `getCachedOrganizationCount`,
  `getCachedUpcomingTrainings`, `getCachedMemberDistributionByOrgType`
  (cached). Same page, same `Promise.all`, half cached half not.
- `src/app/(dashboard)/dashboard/trainings/page.tsx` — `trainingQuery.getAll`
  (called twice, uncached), `readOrganization`, `fetchAllowedOrgIds` all raw;
  no `_data/trainings.ts` equivalent is used here at all despite one existing.
- `src/app/(dashboard)/dashboard/articles/new/page.tsx`,
  `.../articles/[id]/page.tsx`, `.../articles/categories/page.tsx` — read
  `articleCategoryQuery`/`articleQuery` directly; only the list page
  (`articles/page.tsx`) uses `getCachedArticlesForOrg`.
- `src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx` — reads
  `readMemberByRegisterNumber`, `readMemberTrainingHistory`,
  `readOrgHierarchyChain`, `readMemberAcademic`, `readMemberCareer`,
  `readMemberOrganizationHistory` all raw, no cache layer at all for this
  route.
- `src/app/(dashboard)/dashboard/trainings/[branch]/[id]/page.tsx` — same
  pattern with `trainingQuery`, `readOrganization`.

Per `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`,
under Cache Components every async data access in a page/layout should either
be wrapped in `'use cache'` (as close to the data access as possible) or be
clearly request-time (behind `<Suspense>`, driven by cookies/headers). Here
it's neither consistently — it's ad hoc. Because these pages start with
`readActiveSession()` (a cookies-backed, inherently per-request read), the
whole route is already dynamic, so this doesn't currently throw a
build/prerender error — but it does mean:
  (a) the repo's own caching convention is being bypassed in exactly the
      routes that established it (trainings, profile), so DB load for
      read-heavy dashboard pages is uncapped instead of bounded by
      `cacheLife('minutes'/'hours')`, and
  (b) any future move to extract a static shell (nav/header) around these
      routes for Partial Prerendering will immediately surface these as
      blocking reads, since they're not wrapped.

This is the highest-impact finding because it's the majority pattern across
route entry points, not an isolated action.

### 2. Missing `updateTag` after mutations that change `'kader'`-tagged data — read-your-writes is broken for member edits

`src/app/(dashboard)/dashboard/_data/members.ts` tags every member read with
`cacheTag('kader')` and `cacheLife('minutes')`. That cache feeds the
dashboard bento stats, `/dashboard/kader` (`MembersPageContent.tsx`), and
`/dashboard/perangkat` (aggregates).

But the actions that call `updateMember(...)` on the **profile** side never
call `updateTag('kader')`:

- `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/action.ts`
  — `updateMemberProfileAction` and `updateMemberPhotoAction` call
  `updateMember(...)` then only `revalidatePath('/dashboard/profile')`. No
  `updateTag`/`revalidateTag` at all.
- `.../academic-section/action.ts`, `.../career-section/action.ts`,
  `.../organization-section/action.ts` — same shape: `revalidatePath` only,
  no cache-tag invalidation, even though these mutate member-linked records
  that roll up into `getCachedMemberAggregates`.

Compare with `.../kader/_components/add-form/action.ts`
(`createMemberAction`/`updateMemberAction`), which correctly calls
`updateTag('kader')`, and
`.../profile/[registerNumber]/_components/delete-member-button/action.ts`,
which also correctly calls `updateTag('kader')`. So the tag exists and is
used correctly elsewhere — it's specifically the profile-edit surface that
was missed, most likely because those action files were written before (or
without awareness of) the `_data/members.ts` cache tag convention.

Per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/updateTag.md`,
`updateTag` exists precisely for this read-your-own-writes case — a `bpk`
editing a member's academic/career/org history from the profile page would
see stale aggregate numbers on `/dashboard` and `/dashboard/kader` for up to
the `'minutes'` cacheLife window.

### 3. `bulk-upload` (kader) and all `trainings` mutation actions never invalidate their cache tags

- `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts` —
  `bulkCreateMembersAction` inserts members in bulk, then only calls
  `revalidatePath('/dashboard/kader')`. No `updateTag('kader')`, unlike the
  single-add path in the sibling `add-form/action.ts`. Bulk-imported kader
  won't show in cached aggregates/lists until the `minutes` cache naturally
  expires.
- `src/app/(dashboard)/dashboard/trainings/_components/add-training-modal/action.ts`
  (`createTrainingAction`) and
  `.../training-detail-view/action.ts` (`updateTrainingAction`,
  `deleteTrainingAction`, `addAttendantAction`, `updateAttendantStatusAction`,
  `addInstructorAction`, `removeInstructorAction`, `removeAttendantAction`,
  `addDM1AttendantAction`) — none of these call `updateTag('dauroh')`, despite
  `src/app/(dashboard)/dashboard/_data/trainings.ts` tagging
  `getCachedUpcomingTrainings` with exactly `cacheTag('dauroh')`. All of them
  use `revalidatePath` only. The "Daurah Terdekat" widget on `/dashboard`
  (`UpcomingTrainings`) can show stale/removed trainings for up to
  `cacheLife('minutes')` after any training CRUD action.

Per `cacheTag.md`/`updateTag.md`, a tag with no corresponding invalidation call
anywhere in the codebase is effectively dead weight — cache only ever expires
by time, never on write. `dauroh` tag is defined once and never invalidated by
any action; that's a clear-cut mismatch.

### 4. `site-settings` actions have per-org/per-key tags but never touch the generic `'site-settings'` co-tag

`_data/site-settings.ts` (all three: `pages/home`, `pages/managers`,
`pages/tentang`) and the aggregate `(main)/_data/site-settings.ts` call
`cacheTag('site-settings', `site-settings-${key}-${orgId}`)` — two tags per
cached read. Every save action (`saveHomeHeroItemsAction`, `saveHeroAction`,
`saveAboutAction`, `saveActionsAction`, `saveNavAction`, `saveFooterAction`,
`saveMetadataAction`, `saveLeadershipAction`, `saveTentangHeroAction`, etc. in
`pages/home|managers|tentang/_components/action.ts`) only calls
`updateTag(`site-settings-${key}-${orgId}`)` — the specific tag — and never
`updateTag('site-settings')`, the generic one.

This is lower severity than #2/#3 because every consumer of these settings
seems to go through the specific per-key getter (so the specific tag alone is
sufficient in practice), but it means the generic `'site-settings'` tag is
currently write-only from the cache's perspective — nothing ever invalidates
it, so if any future code reads by that broad tag alone (e.g. a "purge all
site settings" admin action), it will silently not work. Flagging as a latent
trap rather than an active bug.

### 5. RSC-first / `'use client'` boundary compliance — generally good, no page/layout-level violations, but several large non-leaf client components

No `page.tsx` or `layout.tsx` file is a client component (checked via grep for
`'use client'` in those filenames — zero hits), which is the most important
invariant. `'use client'` accounts for 129 of 467 `.ts`/`.tsx` files under
`src`, which is reasonable for a form/dashboard-heavy app.

That said, several client components are large enough to suggest more than a
"leaf" is being shipped to the client, worth a closer look (not necessarily
wrong, since some are legitimately interactive canvases/forms):

- `src/app/(main)/_components/home-scene/home-scene.tsx` (1173 lines) and
  `src/app/(main)/tentang/_components/tentang-scene/tentang-scene.tsx` (896
  lines) — likely legitimate (animated/interactive scene components), but
  worth confirming any static sub-content (copy, images resolved server-side)
  is passed in as props/children from a Server Component parent rather than
  fetched/rendered client-side.
- `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx`
  (834 lines) and `.../pages/managers/_components/leadership-form/leadership-form.tsx`
  (761 lines) — large monolithic client forms/views. Per AGENTS.md's own
  Atomic Structure / Compound Components guidance, these are candidates to
  decompose into smaller client leaves wrapped by a Server Component shell,
  but this is a code-organization concern more than a Next.js-correctness one.

No evidence of unnecessary client-side data waterfalls that should be
server-fetched — search actions (`searchMastersAction`,
`searchMembersAction`, `searchTrainingAttendantsAction`, etc.) are
appropriately implemented as server actions invoked from client components
for autocomplete-style UX, which is the correct pattern for interactive
search-as-you-type against a database.

### 6. Deprecated/legacy API usage relative to Next 16 — clean

Checked against
`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`:

- No `unstable_cacheLife`/`unstable_cacheTag` aliased imports found — all
  `data.ts` files import the stable `cacheLife`/`cacheTag` directly.
- No single-argument `revalidateTag(tag)` (deprecated per
  `revalidateTag.md`) found anywhere — the repo consistently uses
  `updateTag(tag)` in Server Actions instead, which is actually the more
  modern choice for the read-your-writes cases it's used in.
- No `export const dynamic|revalidate|fetchCache|runtime` route segment
  configs found anywhere under `src/app` — good, nothing to migrate per
  `migrating-to-cache-components.md`.
- No `middleware.ts`/`middleware()` (should be `proxy.ts`/`proxy()`) — not
  present in `src/app` (not verified at repo root beyond `src/`, but no hits
  in the app tree).
- No `next/legacy/image`, `images.domains`, `serverRuntimeConfig`/
  `publicRuntimeConfig`, or `next/amp` usage found.
- One inconsistency worth a mention alongside this, though not a deprecated
  API: `src/app/(dashboard)/dashboard/pages/{home,managers,tentang}/_components/action.ts`
  read the session via raw `cookies()` + `validateSession(token)` inline
  (`checkAccess()` helper) instead of the shared, `cache()`-wrapped
  `readActiveSession()` used everywhere else (`~/lib/auth/cookies`). Not a
  Next.js violation per se, but it bypasses the request-level memoization
  documented in
  `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`
  ("Deduplicating requests" / React `cache()`), so if these actions ever call
  `checkAccess()` more than once in the same request, the session is
  re-validated redundantly.

### 7. Zod validation in server actions — consistently present

Every `action.ts` file reviewed uses Zod `safeParse` before touching the
database (`memberSchema`, `orgSchema`, `TrainingSchema`, `ArticleInputSchema`,
`CategoryInputSchema`, `profileSchema`, `academicSchema`, `careerSchema`,
`orgHistorySchema`, `loginSchema`, various `site-settings` schemas, etc.), and
per the repo's own `docs/agents` note (schemas extracted to `schema.ts` per
"fix: extract Zod schemas out of use-server action files" in recent commit
history), this is being actively maintained. No action found that skips
validation on user-supplied input. This dimension is in good shape overall.

### Summary ranking

1. Uncached raw DB reads mixed into `page.tsx` route components (widest
   blast radius — touches ~6 routes).
2. Missing `updateTag('kader')` in profile-section mutation actions (breaks
   read-your-writes for a common admin workflow).
3. Missing `updateTag('dauroh')`/`updateTag('kader')` in bulk-upload and all
   training mutation actions (dead cache tag for trainings; no invalidation
   at all for bulk kader import).
4. Generic `'site-settings'` co-tag never invalidated (latent, currently
   harmless).
5. A few oversized `'use client'` components that are candidates for further
   decomposition (organizational, not a correctness bug).
6. No deprecated Next 16 APIs found; `revalidateTag`/`cacheLife`/`cacheTag`
   usage is already on the modern, stable API surface.
7. Zod validation coverage in server actions is consistently good.
