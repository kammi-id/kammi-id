# UI design & accessibility audit

Type: research
Status: resolved

## Question

Audit the dashboard and main-site UI for consistency and accessibility:

- shadcn/BaseUI usage consistency — are components built on top of
  `src/components/shadcn/ui` and `src/components/base-ui/` consistently, or
  do some areas hand-roll equivalents (check `src/components/ui/combobox`,
  `src/components/ui/link-list-editor` and similar custom primitives for
  whether they should instead be shadcn/BaseUI-based)?
- Web Interface Guidelines compliance per AGENTS.md's A11y requirement:
  semantic HTML, aria-labels, keyboard navigation — spot-check the dashboard
  feature areas (kader, branches, trainings, articles, pages, perangkat,
  alumni, profile) for missing labels, non-semantic clickable divs, focus
  traps, or keyboard-unreachable controls.
- Visual/interaction consistency across feature areas — do forms, tables,
  filters, and empty/error states follow one shared pattern, or has each
  dashboard area (kader/branches/trainings/articles) invented its own?

Invoke the `web-design-guidelines` skill while performing this audit. Report
concrete findings (file/route + issue + guideline violated). Use the article
feature's filter/search UI
(`src/app/(dashboard)/dashboard/articles/_components/article-list-view`,
commit `d8c4c9f` which added debounce + filter a11y labels) as a positive
reference point for the bar other areas should be checked against.

## Answer

Audit method: fetched the current Vercel Web Interface Guidelines checklist
via the `web-design-guidelines` skill, read the reference file
(`article-list-view.tsx`, commit `d8c4c9f`) and the two named custom
primitives directly, then dispatched three parallel research passes over the
named feature areas (kader+branches, trainings+articles,
pages+perangmat+alumni+profile). Findings below are deduplicated and
cross-verified by direct file reads. All file paths are absolute.

### 1. shadcn/BaseUI usage consistency

**`src/components/ui/combobox/` is dead code, not a live inconsistency.**
`src/components/shadcn/ui/combobox.tsx` is a fully-built BaseUI-backed
shadcn combobox (chips, empty state, destructive variants, focus rings,
`data-slot` conventions). A second, hand-rolled combobox also exists at
`src/components/ui/combobox/combobox.tsx` (raw `▼` glyph, `any`-typed
options, weaker focus styling, no chips/empty-state polish). Grepping every
`.tsx`/`.ts` file for `from '~/components/ui/combobox'` (the hand-rolled
one, as opposed to `~/components/shadcn/ui/combobox`) returns **zero
matches** — every real usage across kader, trainings, articles, and profile
(`region-combobox`, `university-combobox`, `member-search-combobox`,
`tag-input`, `training-attendant-combobox`, `training-instructor-combobox`,
add-form comboboxes) correctly imports the shadcn one. Recommendation:
delete `src/components/ui/combobox/` — it's an orphaned duplicate that
creates confusion for future contributors, not an active violation.

**`src/components/ui/link-list-editor/`** is a legitimate bespoke composite
(repeatable link-editor rows), not a duplicate of an existing shadcn
primitive — there's no shadcn "field array" component to duplicate. It's
correctly built *on top of* shadcn (`Field`/`FieldLabel`/`FieldContent`/
`Input`), with `sr-only` labels per row and `aria-label` on the remove
button. This one is fine as-is; the ticket's suspicion doesn't hold up here.

**`src/components/base-ui/select/`** exists alongside `shadcn/ui/select.tsx`
but no dashboard code under audit imports the base-ui one directly (all
Selects go through the shadcn wrapper) — no inconsistency found in the
areas audited.

### 2. Real accessibility blockers (keyboard/screen-reader breaking) — highest severity, affect the most users

1. **`src/app/(dashboard)/dashboard/_components/data-table/data-table.tsx:217-231`**
   — active filter-chip removal is a `<Badge onClick={...}>`. `Badge` renders
   a `<span>`; the click handler has no `role="button"`, `tabIndex`, or
   `onKeyDown`, and no `aria-label` describing "remove filter X". This
   shared `DataTable` backs **kader, alumni, and perangkat** individual
   tables (perangkat/alumni are thin wrappers around
   `kader/_components/MembersPageContent` → this same `DataTable`), so the
   defect is not localized — it's inherited by three feature areas at once.
   Violates: semantic HTML over div/span-onClick; keyboard handlers.

2. **`src/app/(dashboard)/dashboard/_components/data-table/data-table.tsx:198-203`**
   — the row search `Input` has only a `placeholder` (`Cari {searchKey}...`),
   no `aria-label`. Same shared component, same three feature areas
   affected. Directly regresses versus the reference
   (`article-list-view.tsx`'s `aria-label='Cari judul artikel'`).

3. **`src/app/(dashboard)/dashboard/_components/data-table/data-table.tsx:292-299`**
   — `<TableRow onClick={() => onRowClick?.(row.original)}>` with
   `cursor-pointer` styling, no `role="button"`/`tabIndex`/keydown handler.
   `onRowClick` is currently unused by kader/branches callers, so this is
   latent rather than firing today, but it's a keyboard trap waiting to
   activate the moment a caller passes `onRowClick`.

4. **`src/app/(dashboard)/dashboard/kader/_components/members-table/editable-cell.tsx:34-44`**
   — "click to edit" trigger is `<div onClick={() => setIsEditing(true)}>`
   with no `role`, `tabIndex`, or `onKeyDown` — keyboard-only users cannot
   enter edit mode. `EditableCell` appears unused by current callers (dead
   code today) but is a landmine if wired up later. Contrast with the
   *correct* pattern already in this same codebase at
   `src/app/(dashboard)/dashboard/pages/home/_components/home-items-list/home-items-list.tsx:147-161`,
   which does `role='button' tabIndex={0} onKeyDown` correctly on an
   equivalent expand/collapse div.

5. **`src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-attendant-combobox.tsx:72-76`**
   and **`training-instructor-combobox.tsx:69-73`** — `ComboboxInput` has
   only a `placeholder` ("Cari kader...", "Cari instruktur..."), no
   `aria-label`. Preceded by a plain text `SectionLabel` span, not a
   `<label>`, so there's no programmatic label association at all. Used
   live in `training-detail-view.tsx` (lines ~582-588, ~736-741).

6. **`src/app/(dashboard)/dashboard/pages/managers/_components/transparent-image-upload/transparent-image-upload.tsx:96-148`**
   — upload trigger is a `<label>` wrapping a `sr-only` file input with no
   `focus-visible` styling on the visible card — keyboard users tabbing to
   it get no visible focus indicator. The correct pattern already exists
   next door at `profile-avatar.tsx:100-101` (`focus-visible:ring-primary`
   on a button-based trigger) — this file just didn't copy it.

### 3. Moderate — real gaps, smaller blast radius

7. **`src/app/(dashboard)/dashboard/kader/_components/add-form/address-section.tsx:52-141`**
   and **`personal-info-section.tsx:292-312`** — `<FieldLabel
   htmlFor='addressProvince'>` (and city/district/subdistrict/
   organizationId) point to ids never passed to the paired
   `RegionCombobox`/`ComboboxInput`. Clicking the label doesn't focus the
   control; no programmatic label↔control association for assistive tech.

8. **`src/app/(dashboard)/dashboard/trainings/_components/filter-form/index.tsx:49,54,68,73`**
   — `<Label>Organisasi</Label>` / `<Label>Tahun</Label>` have no
   `htmlFor`, paired `SelectTrigger` has no `id`/`aria-label`. Lower
   priority because **this component is dead code** (not imported by
   `trainings/page.tsx`, which renders `TrainingGrid`/
   `TrainingGridControls` instead — a different, already-correct
   component). Related structural finding: `trainings/page.tsx` reads
   `organizationId`/`year` from `searchParams`, but with `FilterForm`
   unused, there is currently **no UI control anywhere** to set those
   params — organization/year filtering on the trainings list is backend
   -only today. Worth flagging to the team as an incomplete feature, not
   just an a11y nit.

9. **`src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/academic-section.tsx:111-127`**
   — "Jenjang" `Select`/`SelectTrigger` has a nearby `FieldLabel` but no
   `htmlFor`/`aria-label` binding them. Structure likely repeats in
   `career-section.tsx`/`organization-section.tsx` (same pattern, not
   re-verified line-by-line).

10. **`src/app/(dashboard)/dashboard/branches/_components/organization-table/organization-table.tsx:71-73`**
    — `<button className='text-primary text-sm hover:underline'>Detail</button>`
    is a raw, unstyled (non-shadcn `Button`) element with **no onClick at
    all** — non-functional today. `OrganizationTable` appears to be dead
    code (no importers outside its own barrel), so no live user impact, but
    it's a landmine if revived un-fixed.

11. **`src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-preview.tsx:65-218`**
    — hand-rolled raw `<table>/<thead>/<tbody>/<tr>/<td>` instead of the
    shadcn `Table` primitives every other table in the app uses. Visually
    inconsistent (no shared border/hover/typography), and is a
    component-consistency violation, not just cosmetic, since it duplicates
    functionality the design system already provides.

12. **`src/app/(dashboard)/dashboard/articles/_components/article-body-editor/article-body-editor.tsx`**
    — the Tiptap `EditorContent` has no `aria-label`/`role`, and isn't
    programmatically bound to the `FieldLabel` ("Konten") that visually
    precedes it in `article-form.tsx:241` (Tiptap doesn't expose a
    labelable id). Screen readers won't announce "Konten" on focus. Minor
    severity, easy fix (`aria-label='Konten artikel'` on the content
    wrapper).

### 4. Visual/interaction consistency across feature areas

- **Destructive-action confirmation has two competing patterns.** The
  gold-standard pattern — `AlertDialog` + dropdown trigger + type-the-exact
  -name-to-enable-delete — is used consistently and correctly in
  `delete-article-button.tsx`, `delete-training-button.tsx`, and
  `delete-member-button.tsx`/`reset-password-button.tsx` (profile). But
  `article-category-manager.tsx:395-423` uses a plain AlertDialog with no
  type-to-confirm step, and `academic-section.tsx` (and likely
  `career-section.tsx`/`organization-section.tsx`) use a lighter inline
  two-button confirm instead of `AlertDialog` at all. Not a blocker (still
  requires a confirming click) but three different confirmation UX
  patterns coexist for conceptually similar "delete this record" actions.
- **Branches grid has no search/filter controls at all**
  (`branches/_components/branches-grid/branches-grid.tsx` +
  `branches-header.tsx` — just a count and an "Add" button), while kader's
  equivalent grid (`members-grid.tsx` + `members-grid-controls.tsx`) has a
  full URL-synced debounced search + type filter. Same kind of
  organizational/listing data, two different UX expectations.
- **Empty states are inconsistent.** The shared shadcn `EmptyState`
  component is used correctly in `training-grid/index.tsx` and
  `training-detail-view.tsx`, but `article-category-manager.tsx:246`
  hand-rolls its own empty-state div instead of reusing it.
- **Icon-only button labeling is inconsistent within near-identical
  components**: `branches-grid/branch-card.tsx:46-57`'s edit button has no
  `aria-label`, while its kader counterpart
  `member-branch-card.tsx:72-78` does (`aria-label={`Edit ${org.name}`}`).
  Same gap on `members-table/inline-quick-add-row.tsx:232-239`'s
  remove-row button (no `aria-label`) versus most other icon buttons in
  the codebase.
- **`autoComplete` is essentially unused across all audited forms**
  (nav-form, footer-form, hero-form, about-form, profile-info, etc.) — not
  a hard blocker per guideline, but a consistent gap versus the "inputs
  need autocomplete" rule.
- **Cosmetic typography nit, widespread**: "Menyimpan...", "Loading..."
  etc. use `...` instead of the guideline's `…` — 22 occurrences across
  dashboard code (`grep -rn "Menyimpan\.\.\.\|Loading\.\.\.\|Memuat\.\.\." `
  under `src/app/(dashboard)/dashboard`). Purely cosmetic, lowest priority.

### 5. What's already good (matches or exceeds the `article-list-view` reference bar)

- `kader/_components/members-grid-controls.tsx` and
  `trainings/_components/training-grid/training-grid-controls.tsx` — both
  textbook: 300ms-debounced search synced to the URL via
  `useSearchParams`+`router.push`, `aria-label='Hapus pencarian'` on the
  clear button, shadcn `InputGroup`/`Button`. Arguably better than the
  reference itself.
- `delete-article-button.tsx` / `delete-training-button.tsx` /
  `delete-member-button.tsx` — the type-to-confirm `AlertDialog` pattern is
  genuinely gold-standard and consistently applied across three areas.
  `add-training-modal/form.tsx`, `article-form.tsx`, and all of the
  `pages/home`, `pages/managers`, `pages/tentang` forms — consistent
  shadcn `Field`/`FieldLabel`/`FieldContent`/`FieldError` usage with
  correct `htmlFor`/`id` pairing.
- `tag-input.tsx` — fully keyboard accessible (Enter/comma to commit,
  Backspace to remove last tag), `aria-label` per removable tag.
- `individual-table/columns.tsx` and `branches-table/columns.tsx` — sort
  /filter column headers are real `<button>` elements with descriptive
  `aria-label`s, not clickable divs.
- `profile-avatar.tsx`, `profile-sidebar.tsx`'s `ControlledToggle`,
  `warning-tooltip.tsx`, `profile-org-hierarchy.tsx` — all correctly reach
  for shadcn/semantic primitives (button-based upload trigger with visible
  focus ring, `role='switch'` toggle, shadcn `Tooltip`, semantic `Link`)
  instead of hand-rolling.
- `MembersPageContent`/`data-table.tsx`'s own sort/filter/pagination state
  (aside from the specific defects above) is genuinely deep-linked via
  server-parsed `searchParams`, matching the "URL reflects state"
  guideline throughout kader/alumni/perangkat/trainings.

### Scope note

Per the ticket's own checklist, this audit concentrated on the eight named
dashboard feature areas. `src/app/(main)` (public site) was only spot
-checked (grepped for div-onClick anti-patterns; one hit in
`tentang/_components/section-nav/section-nav.tsx` turned out to be a
correctly-built `<button>` with `aria-label`, not a violation) — a full
main-site pass was not performed and would need a separate pass if desired.
