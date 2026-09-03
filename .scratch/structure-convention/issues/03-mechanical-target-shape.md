# What is the exact target shape for the mechanical drift?

Type: grilling
Status: resolved

## Question

The purely mechanical drift — no ownership question attached, `tsc` can guard
the change. Measured on the current tree:

- **4 folders use `index.tsx` as the implementation file** instead of a pure
  barrel: `trainings/_components/{training-table, training-grid, filter-form,
  add-training-modal}`. Unique to `trainings`.
- **~20 folders are flattened** (multiple `.tsx` siblings, no nested atomic
  subfolders). The 7 heaviest: `training-detail-view` (5), `members-grid` (5),
  `branches-grid` (5), `network-section` (4), `training-grid` (4),
  `members-table` (4), `add-form` (4).
- **~30 folders hold `.tsx` but no `index.ts` barrel**, including
  `_components/logout/` and `members-grid/`.

Decide the target shape precisely enough that execution needs no judgement:

1. For `index.tsx` → is it renamed to `<folder-name>.tsx` + a new `index.ts`
   barrel? Confirm this matches the articles reference exactly.
2. For flattened folders → does **every** sibling `.tsx` become its own
   subfolder, or is there a threshold (size, reuse, is-it-really-a-component)
   below which a plain sibling file is fine? A 20-line presentational fragment
   used once by its parent may not warrant a folder.
3. For missing barrels → is a barrel required on every component folder without
   exception, or only on folders imported from outside themselves?
4. Do the `(main)` marketing-site folders (`network-section`, `navbar`,
   `hero-section`, …) follow the same rules as `(dashboard)`, or is the
   convention dashboard-scoped?

Also settle the two stray non-arrow-function components the audit flagged
(`SpecialistsWrapper` in `perangkat/page.tsx`, `DataTable` in `data-table.tsx`)
— straightforward, but they need a decision recorded so execution is complete.

**Unblocked** — the ownership decision has landed and the relocation set is
now known and small: only `region-combobox/` leaves `kader/_components/`
(to `src/components/`), and the region fetchers fold into `src/lib/api/region`.
Everything else in the list above stays where it is, so the target shape
decided here applies to it directly.

One consequence to honour: `members-grid/` and the other kader folders that
alumni/perangkat consume must end up with a **barrel**, since cross-route
imports are now barrel-only. That makes item 3 below (are barrels universal or
only for externally-imported folders?) load-bearing rather than cosmetic.

## Answer

### 0. The premises were wrong — measured, not estimated

Before deciding anything, the tree was re-measured. The question's figures came
from the audit and overstate the drift by 3-4x:

| Question claimed | Actually measured |
| --- | --- |
| ~30 folders missing a barrel | **7** component folders |
| ~20 flattened folders | **7** folders with >2 `.tsx` siblings |
| 4 folders using `index.tsx` | 4 — correct |

This is the third time an audit claim has not survived contact with the tree
(cf. the authorization-leak claim in ticket 01 and the performance rationale in
ticket 02). The pattern is worth carrying into the execution effort: treat
`.scratch/pre-feature-audit/REPORT.md` figures as leads, not inventory.

Two drifts the question did **not** list were found, and one of them is
load-bearing (see §4).

### 1. Atomic-folder threshold — a folder is an *exported unit*

> **A component folder is one unit exported through its barrel.** Sibling
> `.tsx` files inside it are legitimate as long as they are consumed only by
> their sibling parent. The moment a file is imported from outside its folder,
> it graduates to its own folder with its own barrel.

The `articles` reference does not mandate one-`.tsx`-per-folder, and neither do
the healthy multi-file folders: `training-detail-view/` (5) and
`branches-grid/` (5) are single components with internal parts
(`branch-card`, `branches-pagination`, …) used only by their parent.

**Consequence: none of the 7 "flattened" folders are split.** They were never
drift. The rejected alternative — a folder per `.tsx` — would nest
`branches-grid` five deep for no navigational gain, against the thin-safety-net
constraint in the map Notes.

### 2. Barrels are universal, no exceptions

Required on every component folder. ~90 folders already comply; the 7 without
are outliers, so this ratifies the de-facto convention rather than imposing a
new one. Cost: 7 one-line files.

The reason is **enforceability, not tidiness**. Ticket 01 made cross-route
imports barrel-only. With universal barrels, *any* import path pointing at a
file inside another folder is a violation — textually, greppably, with no
knowledge of intent. Under a conditional rule ("barrel only if imported
externally") a missing barrel is ambiguous: deliberate, or forgotten? A linter
cannot tell statically. This decision is what makes the **Enforcement** fog
specifiable (see the new ticket 06).

### 3. `index.tsx` → `<folder-name>.tsx` + `index.ts`

Confirmed against `articles`, which never uses `index.tsx`; the invariable
pattern is `<folder-name>.tsx` plus `index.ts` containing
`export * from './<folder-name>'`. Applies to the 4 `trainings` folders:

- `training-table/index.tsx` → `training-table.tsx`
- `training-grid/index.tsx` → `training-grid.tsx`
- `filter-form/index.tsx` → `filter-form.tsx`
- `add-training-modal/index.tsx` → `add-training-modal.tsx`

**Sibling naming rule:**

> Sibling filenames must be domain-specific, not role-generic. A name stating
> only its role (`form`, `card`, `list`, `item`, `content`, `wrapper`) takes
> its parent component's name as a prefix.
>
> Exceptions — established idioms, left alone:
> - `columns.tsx` — TanStack Table column defs; used in 4 folders.
> - `*-client.tsx` — marks the RSC/client boundary; used in 6 folders. It is a
>   role suffix, but the role it names is a rendering boundary, not a generic.

Swept the whole tree against this rule: exactly **one** file violates it.

- `add-training-modal/form.tsx` → `add-training-form.tsx`

Every other sibling is already specific (`training-card`, `branch-card`,
`tier-summary`, `nav-links`, `leaflet-map`, …).

### 4. The two bare files in `kader/_components/` — not listed, most important

`MembersPageContent.tsx` is the only PascalCase filename in the repo, sits bare
in `_components/` with no folder and no barrel, and is imported **across
routes** by `perangkat` and `alumni` via deep paths
(`../../kader/_components/MembersPageContent`). This is precisely the
page-level composite ticket 01 ruled "stays in kader, sanctioned consumers,
barrel-only" — **so ticket 01's decision is currently unenforceable, because
the file has no barrel to import through.** `specialist-summary-cards.tsx` has
the identical shape and is deep-imported by `perangkat`.

Both become atomic folders:

- `kader/_components/members-page-content/{members-page-content.tsx, index.ts}`
- `kader/_components/specialist-summary-cards/{specialist-summary-cards.tsx, index.ts}`

The React component names (`MembersPageContent`, `SpecialistSummaryCards`) are
**unchanged** — PascalCase is correct for a component identifier. The drift is
that the *filename* followed the component name instead of the file
convention. Cross-route consumers are repointed at the folder barrels.

### 5. Repo-wide, not dashboard-scoped

The question assumed `(main)` might need exempting. The measurement inverts it:
**`(main)` is the most compliant part of the tree** — all ~25 component folders
have barrels, all kebab-case, zero `index.tsx`, zero violations.

So the rule is written repo-wide, applying to `src/app/**/_components/` and
`src/components/`. Not idealism: `(main)` already satisfies it unprompted, and
a dashboard-scoped rule would license the cleanest area to drift. It also keeps
the AGENTS.md text shorter than a per-route-group conditional.

One side finding: `(main)/_components/` contains **both**
`under-construction-client.tsx` (bare) and
`under-construction-client/under-construction-client.tsx` (foldered, with
barrel) — a duplicate. Execution checks which is live and deletes the orphan.
That is a cleanup, not a decision.

### 6. The two non-arrow components — one fix, one convention gap

**`SpecialistsWrapper`** (`perangkat/[[...slug]]/page.tsx:76`) — a local,
unexported function declaration. It violates the arrow-function rule, and
`page.tsx` is **not** exempt: AGENTS.md's Next.js-convention-file exemption
covers Atomic Structure and Colocation, not function style. → Convert to arrow,
**leave it in `page.tsx`**; it is a single-consumer local helper, and promoting
it is a design call outside a mechanical pass.

**`DataTable`** (`_components/data-table/data-table.tsx:49`) — is generic:
`export function DataTable<TData, TValue>(...)`. In a `.tsx` file a generic
arrow needs a parser workaround (`<TData,>` with a trailing comma, or
`extends unknown`) because `<TData>` parses as a JSX tag. The workaround is
uglier than the thing it fixes. → **Leave as a function declaration and amend
AGENTS.md**: generic components in `.tsx` may use function declarations. The
convention was incomplete, not the code — the same shape as the two prior
tickets' corrections.

### Measured execution load

4 `index.tsx` renames · 1 sibling rename · 2 files→folders · 7 new barrels ·
1 arrow conversion · 1 de-duplication · plus repointing the deep-path
cross-route imports. Substantially smaller than the question assumed, and
`tsc --noEmit` guards all of it — every item is a rename or a re-export.
