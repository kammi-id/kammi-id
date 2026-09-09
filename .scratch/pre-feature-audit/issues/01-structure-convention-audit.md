# Structure & convention consistency audit

Type: research
Status: resolved

## Question

Across the whole `src/` tree, where does the codebase deviate from the
conventions documented in `AGENTS.md` — specifically:

- Atomic structure (one component/function per folder) and the named-file
  atomic pattern (`my-component.tsx` + barrel `index.ts`).
- Colocation (route-local components in `_components`, reusable ones in
  `src/components/`).
- Component folder conventions (`action.ts`, `data.ts`, `store.ts`,
  `types.ts`, `constants.ts`, `utils.ts` used for their intended purpose,
  not as dumping grounds).
- Arrow-function-only components/functions (outside the documented
  exceptions: `src/components/shadcn/`, `src/lib/shadcn/`, and non-`src`
  files).
- Compound Components pattern usage where prop-drilling would otherwise occur.

Known lead to investigate: `src/lib/actions/storage.ts` sits outside any
per-component `action.ts` — is this a one-off exception, a systemic pattern of
misplaced actions, or something else category-worthy? Also check whether
other repo-root-level "misc" folders (`src/lib/*`, `src/hooks/`, `src/db/*`)
hide things that should have been colocated.

Report as a flat list of concrete findings (file/folder path + what's wrong +
which AGENTS.md rule it violates), not a rewrite plan. Use the recently
completed article-management feature (commits `b3227b5`..`0bdf1d7`,
`src/app/(dashboard)/dashboard/articles/`) as a positive reference for what
"conforming" looks like.

## Answer

Reference check first: `src/app/(dashboard)/dashboard/articles/` was verified
clean — every component folder follows `name/name.tsx` + `index.ts`, `action.ts`
files are per-component with matching `action.test.ts` and `schema.ts`, zero
`function`-declaration components. It is a legitimate positive baseline.
Everything below is a deviation from that baseline, ordered roughly by how
many files/areas the pattern touches.

### 1. Component sub-parts flattened into a single folder instead of nested atomic subfolders (systemic — affects most non-article features)

Violates: **Atomic Structure** ("one component/function per folder").

- `src/app/(dashboard)/dashboard/kader/_components/add-form/address-section.tsx`,
  `personal-info-section.tsx`, `status-section.tsx` — three real components
  living as flat siblings of `add-form.tsx` inside one folder, no subfolders,
  no barrels of their own.
- `src/app/(dashboard)/dashboard/kader/_components/members-grid/member-branch-card.tsx`,
  `members-grid-controls.tsx`, `members-pagination.tsx`, `tier-summary.tsx` —
  four sibling components inside `members-grid/` with no `index.ts` for the
  folder at all (see finding #2) and no per-component subfolder.
- `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-dialog.tsx`
  + `bulk-upload-preview.tsx` — two components as flat siblings; folder name
  (`bulk-upload`) matches neither file.
- `src/app/(dashboard)/dashboard/trainings/_components/training-grid/training-card.tsx`,
  `training-grid-controls.tsx`, `training-pagination.tsx` — same pattern as
  kader's `members-grid`.
- `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/dm1-add-form.tsx`,
  `dm1-bulk-upload-button.tsx`, `training-attendant-combobox.tsx`,
  `training-instructor-combobox.tsx` — four more components flattened into
  `training-detail-view/` alongside the "main" `training-detail-view.tsx`.
- `src/app/(dashboard)/dashboard/kader/_components/add-form/use-member-region.ts`
  is a component-local hook, which is acceptable colocation, but it sits in
  the same flat pile as the section components above rather than under a
  clearer subfolder boundary.

### 2. Missing `index.ts` barrel on component folders that do have a main `.tsx` (systemic, ~10+ folders)

Violates: **Named-File Atomic Pattern** ("An `index.ts` file is used for
barrel exports").

- `src/app/(dashboard)/dashboard/kader/_components/members-grid/` — no
  `index.ts` at all; consumers reach in directly
  (`MembersPageContent.tsx` imports `./members-grid/tier-summary` directly).
- `src/app/(dashboard)/dashboard/_components/logout/` — has `logout.tsx`,
  `action.ts`, `store.ts` but no `index.ts`.
- `src/app/(main)/_components/under-construction-client.tsx` — loose file,
  no folder, no barrel.
- `src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx`
  and `specialist-summary-cards.tsx` — both sit directly at the
  `_components/` root with no folder/barrel of their own (see finding #3 for
  the naming issue on the first one).

### 3. Main component filename doesn't match its folder name (systemic, ~6 folders)

Violates: **Named-File Atomic Pattern** ("Main file uses the component
name").

- `trainings/_components/training-table/` → main file is `index.tsx`, not
  `training-table.tsx`.
- `trainings/_components/training-grid/` → main file is `index.tsx`.
- `trainings/_components/filter-form/` → main file is `index.tsx` (single
  file folder, still should be named `filter-form.tsx` + barrel).
- `trainings/_components/add-training-modal/` → main file is `index.tsx`
  (+ `form.tsx` sibling).
- `kader/_components/bulk-upload/` → no file named `bulk-upload.tsx` at all
  (see #1).
- `profile/[registerNumber]/_components/reset-password/` → main file is
  `reset-password-button.tsx`, not `reset-password.tsx`.

Note: the `trainings` feature systematically uses `index.tsx` as the
component implementation file rather than `index.ts` as a pure barrel —
this is a distinct sub-pattern from articles/profile/branches, which all
correctly separate `<name>.tsx` (impl) from `index.ts` (barrel).

### 4. `action.ts` sitting directly under a route's `_components/` folder, shared by multiple sibling components, instead of belonging to one component folder (systemic, 5 occurrences)

Violates: **Component Folder Conventions** (`action.ts` is documented as a
per-component file) and, by extension, the **Atomic Structure** rule these
folder conventions are scoped under.

- `src/app/(dashboard)/dashboard/pages/home/_components/action.ts`
- `src/app/(dashboard)/dashboard/pages/managers/_components/action.ts`
- `src/app/(dashboard)/dashboard/pages/tentang/_components/action.ts`
- `src/app/(dashboard)/dashboard/user/account/_components/action.ts`
- `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/action.ts`

Each of these is a route-level "shared actions" file consumed by several
sibling form components (e.g. `pages/home/_components/action.ts` is imported
by `about-form`, `actions-form`, `nav-form`, `hero-form`, `metadata-form`,
`footer-form`, `home-items-list`). This is the same shape of problem as the
`src/lib/actions/storage.ts` lead in the ticket, just one level down — it's
a **repeated pattern**, not unique to `storage.ts`. The article feature's
positive pattern (each of `article-form/`, `article-category-manager/`,
`delete-article-button/` owns its own `action.ts` + `action.test.ts`) is the
counter-example these should have followed.

### 5. `src/lib/actions/storage.ts` — confirmed genuinely cross-cutting, not a one-off exception, but also not colocatable under any single component

Violates: **Component Folder Conventions** (actions should live in a
component's `action.ts`) — but nuanced. It is `'use server'` and
action-shaped (`uploadImageAction`, `getSignedUrlAction`,
`deleteImageAction`), and is imported directly by five unrelated
consumers: `kader/_components/individual-table/columns.tsx`,
`profile/[registerNumber]/_components/profile-avatar/profile-avatar.tsx`,
`branches/_components/add-form/add-form.tsx`,
`pages/managers/_components/transparent-image-upload/transparent-image-upload.tsx`,
and the reusable `src/components/image-upload.tsx`. Since it's genuinely
shared across features with no natural single owning component, AGENTS.md
doesn't define an exception for "cross-cutting shared actions" — this is a
gap in the convention doc as much as a violation. Recommend the audit read
this as: the doc needs a stated exception for truly shared actions (mirroring
how `src/lib/api/*` and `src/db/*` are implicitly treated as infra layers),
not that this file should be force-fit into one component folder.

### 6. Loose, unfoldered components directly under `src/components/`

Violates: **Colocation** / **Atomic Structure** — reusable components under
`src/components/` are still expected to follow the named-file atomic
pattern (folder + main file + `index.ts`), as `access-guard/`,
`credential-store/`, `error-view/`, `lenis-provider/`, and `og-image/` all
correctly demonstrate.

- `src/components/image-upload.tsx` (242 lines, reused by 5+ features) — no
  folder, no barrel.
- `src/components/unsaved-changes-banner.tsx` (35 lines) — same.

### 7. Non-arrow-function components/functions outside the documented exceptions

Violates: **Coding Standards — Arrow Functions** (exceptions are only
`src/components/shadcn/`, `src/lib/shadcn/`, and non-`src` files;
`loading.tsx` boilerplate files were checked and are legitimate Next.js
convention-file exemptions, not counted here).

- `src/app/(dashboard)/dashboard/perangkat/[[...slug]]/page.tsx` — both
  `function Page(...)` (default export, arguably convention-exempt as a
  `page.tsx`) **and** `function SpecialistsWrapper(...)` at line 76, which is
  a real, non-trivial UI component (renders tabs, summary cards, page header)
  declared inline in the route file using `function`, not an arrow — this one
  is not covered by the Next.js-convention-file exemption since it's not the
  page's own default export.
- `src/app/(dashboard)/dashboard/_components/data-table/data-table.tsx:49` —
  `export function DataTable<TData, TValue>({...})`, a generic reusable
  table component, declared with `function` instead of an arrow.

### 8. `perangkat` and `alumni` routes reach directly into `kader`'s `_components/` folder instead of colocating or promoting shared UI to `src/components/`

Violates: **Colocation** ("Components must be colocated near the route that
uses them... or globally inside `src/components/` if they are reusable").

- `src/app/(dashboard)/dashboard/perangkat/[[...slug]]/page.tsx` imports
  `MembersPageContent`, `MembersPageHeader`, and `SpecialistSummaryCards` via
  relative paths reaching into `../../kader/_components/...`.
- `src/app/(dashboard)/dashboard/alumni/[[...slug]]/page.tsx` imports
  `MembersPageContent` the same way.

These three components are used by 3 different routes (kader, perangkat,
alumni) and by definition are reusable — per the colocation rule they should
have been promoted to `src/components/` (or at minimum to a shared location
under `dashboard/_components/`) rather than left inside `kader`'s route-local
`_components/` and imported cross-route via `../../`.

### 9. PascalCase filename breaking the kebab-case named-file convention (one-off, but symptomatic of #1/#2/#8)

Violates: **Named-File Atomic Pattern** (every other component file in the
codebase, including all of `articles/`, uses kebab-case matching the
exported component's purpose, e.g. `article-form.tsx`).

- `src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx`
  (355 lines) — PascalCase filename, no folder, no barrel, and (per #8)
  reused cross-route without promotion.

### 10. `_mock-address.ts` — non-conventional filename, and mock data shipped in a production component folder

Violates: **Component Folder Conventions** (the documented file set is
`index.ts`, `action.ts`, `data.ts`, `store.ts`, `types.ts`, `constants.ts`,
`utils.ts`, `*.test.ts` — `_mock-address.ts` matches none of these, and its
content, `MOCK_ADDRESS_DATA`, is static lookup data that should have been
named `constants.ts` per convention, or excluded from the shipped component
entirely if it's test/dev-only fixture data).

- `src/app/(dashboard)/dashboard/kader/_components/add-form/_mock-address.ts`

### 11. `data.ts` convention (per-component, with `cacheTag`/`cacheLife`) is not actually used anywhere — including by the articles reference feature itself

Observation, not a strict violation, but worth flagging as a doc/practice
gap: AGENTS.md documents `data.ts` as a **component-folder** file
(`Server-side data fetching (with 'use cache', cacheLife, cacheTag)`), but in
practice every feature — articles included — puts this logic in a
route-level `_data/*.ts` file instead (e.g.
`dashboard/_data/articles.ts`, `dashboard/pages/home/_data/settings.ts`,
`dashboard/pages/managers/_data/settings.ts`,
`dashboard/pages/tentang/_data/settings.ts`, `(main)/_data/network.ts`,
`(main)/_data/site-settings.ts`). This is consistent across the whole
codebase (so not a stray deviation), but it means the "positive reference"
feature does not actually demonstrate the documented `data.ts` pattern for
data-fetching — it demonstrates a different, undocumented `_data/` route-level
convention instead. Should be reconciled in AGENTS.md rather than treated as
each feature independently violating the rule.

### 12. Compound Components pattern: no clear violation found, but no clear adoption either

The **Engineering Standards** rule calls for Compound Components "for
reusable components to avoid prop-drilling." No component in `src/components/`
(the reusable layer) currently implements a compound API (e.g.
`<Foo.Root><Foo.Trigger/></Foo.Root>` style) — reusable pieces like
`src/components/ui/combobox/`, `src/components/ui/link-list-editor/`, and
`src/components/credential-store/` are single-component exports, not
compound. This isn't a violation in the strict sense (no obvious
prop-drilling smell was found forcing the issue), but it means the rule is
currently aspirational/unenforced rather than demonstrated anywhere in the
codebase — worth noting since there's no positive example to point future
work at.

### Not violations (checked and ruled out)

- `src/lib/api/*` (`region.ts`, `storage.ts`, `university.ts`) — legitimate
  infra/third-party integration layer (S3 client wrapper, external REST API
  clients), not component logic. Reasonable implicit exception, same as
  `src/db/*`.
- `src/db/query/*`, `src/db/schema/*` — repository/schema layer shared
  app-wide by design, not component-owned data fetching. Not a colocation
  violation.
- `src/hooks/use-unsaved-changes.ts` — single genuinely cross-cutting hook
  used by multiple unrelated forms; reasonable to keep at the shared
  `src/hooks/` level.
- `src/lib/logger/*`, `src/lib/seo/*`, `src/lib/utils/*`, `src/lib/auth/*` —
  infra/cross-cutting utilities, not component-scoped logic.
- `src/components/shadcn/`, `src/lib/shadcn/` — explicitly exempted by
  AGENTS.md.
