# What is the exact target shape for the mechanical drift?

Type: grilling
Status: open

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

_unresolved_
