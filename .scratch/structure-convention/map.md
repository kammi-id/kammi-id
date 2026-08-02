# Map: Structure & convention drift (I1)

Label: `wayfinder:map`

## Destination

A **locked set of decisions** — written down and agreed — that says, for every
kind of structure drift found in I1: what the target shape is, who owns the
shared code, and which convention text (AGENTS.md) needs to change to match.
No code is restructured in this map. It clears when someone could pick up the
decisions and execute the restructuring without needing to decide anything
further.

## Notes

- **Domain**: Next.js App Router codebase conventions. Source of truth for the
  conventions is `AGENTS.md` ("Codebase Organization" section); the `articles`
  feature is the clean reference implementation of them.
- **Origin**: item I1 of `.scratch/pre-feature-audit/REPORT.md` (§ "Important").
  That report is the input, not the spec — its recommendation was deliberately
  vague ("worth a deliberate restructuring pass, or at minimum a written note").
- **Plan, don't do.** Default wayfinder rule applies, chosen explicitly by the
  user: this map produces decisions, not moved files. Execution is a separate
  effort opened after this map clears.
- **Skills**: `/grilling` and `/domain-modeling` for the decision tickets.
  `/code-review` only becomes relevant in the execution effort, not here.
- **Constraint — thin safety net.** Only 4 test files cover the areas that would
  be restructured (kader, trainings, pages, profile); the other ~19 sit on
  `articles`, which is already clean. Any decision that implies large-scale
  file movement must account for `tsc --noEmit` being nearly the only guard.
- **Correction to ticket 03 (made in 04).** Two of its claims were measured on
  `src/app/**/_components/` only and are narrowed: "barrels are universal, **no
  exceptions**" now exempts **grouping folders** (folders holding only other
  component folders — `base-ui/`, `ui/`), and "**repo-wide**" meant *not
  dashboard-scoped*, not *all of `src/`* — `src/lib/` keeps its flat per-domain
  convention and is out of scope. Read 03 through 04 §1.
- **Constraint**: `cacheComponents: true` is live. Decisions about where
  `action.ts` / `_data/*.ts` live must not break the existing `cacheTag` /
  `updateTag` pairings retrofitted in the I2 work (commit `fdd609a`).

## Decisions so far

<!-- one line per resolved ticket -->

- [Who owns the cross-route shared components?](issues/01-shared-component-ownership.md)
  — Decided per category: stateless utilities promote, the page-level composite
  stays in kader with sanctioned consumers, the privileged action stays shared.
  Promotion bar is **generic AND used by 2+ routes**; cross-route imports must
  target a **barrel**, never an internal file. Also corrects the audit's
  authorization-leak claim — it was misread.
- [Is a route-level shared `action.ts` a violation, or a missing convention?](issues/02-route-level-shared-action.md)
  — A violation: split per component, but **extract** the byte-identical
  `checkAccess()` into `src/lib/auth/` built on `readActiveSession` rather than
  duplicating it. Folds in the session-helper bypass found in the same four
  files; the performance rationale was checked against the Next.js docs and
  **withdrawn** — the case is correctness, not speed.
- [What is the exact target shape for the mechanical drift?](issues/03-mechanical-target-shape.md)
  — A folder is an **exported unit**, so the 7 "flattened" folders are correct
  and are *not* split; barrels become **universal** (the thing that makes
  enforcement greppable); `index.tsx` → `<folder-name>.tsx`; sibling names must
  be domain-specific (idiom exceptions: `columns.tsx`, `*-client.tsx`); rules
  are **repo-wide** because `(main)` is already the cleanest area. `DataTable`
  stays a function declaration — generics in `.tsx` become an AGENTS.md
  exception. Re-measurement cut the drift 3-4x below the audit's figures and
  surfaced the unlisted `MembersPageContent.tsx`, whose missing barrel had left
  ticket 01's decision unenforceable.
- [What exactly changes in AGENTS.md?](issues/04-agents-md-amendment.md)
  — **Rewrite, not amend**: the old section's shape is what let the drift
  through (the exemption list names files but not which rules they escape —
  the hole `SpecialistsWrapper` fell through). Carries all of 01-03 unchanged
  and adds scope (**component code**, not `src/lib/`), a **grouping folder**
  exception to universal barrels, side-effect-free `_`-prefixed files at a
  `_components/` root, and `schema.ts` / `_data/` as documented conventions.
  Discharges ticket 03's **greppable** claim by stating the cross-route
  violation as a matchable path pattern covering both relative and `~/`
  spellings — which is what leaves 06 choosing an enforcer rather than a rule.
  Corrects two of its own premises from 03 (see Notes).

## Not yet specified

_Empty — the fog has cleared. Two tickets remain live, both unblocked:
[05](issues/05-execution-handoff-shape.md) (execution shape — ~18 mechanical
edits, all `tsc`-guarded: ticket 03's ~16 plus the 2 bare `src/components/`
files found in 04) and [06](issues/06-enforcement-mechanism.md) (enforcement —
now picking a **tool**, since 04 §6 states the violation as a matchable path
pattern). The AGENTS.md question resolved as
[04](issues/04-agents-md-amendment.md)._

## Out of scope

<!-- ruled beyond the destination; never graduates -->

- **Actually performing the restructuring** — moving files, adding barrels,
  renaming `index.tsx`. Deliberately excluded by the destination; this map
  decides, a follow-on effort executes.
- **I4 (wider test coverage gap)** — the 15 untested `action.ts` files. Related
  (it is the same thin-safety-net problem seen from another angle) but a
  separate audit item with its own guidance to pick up opportunistically.
