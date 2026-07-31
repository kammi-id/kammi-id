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

## Not yet specified

- **What the execution effort actually looks like** — sequencing, whether it
  lands as one big mechanical commit or several per-area passes, and whether it
  needs its own test scaffolding first given the thin safety net. Can't be
  specified until the ownership and `action.ts` decisions land, because those
  determine how much of the work is risky-vs-mechanical.
- **Whether `AGENTS.md` needs restructuring, not just amending** — if several
  decisions come back as "the convention was wrong, not the code", the
  conventions section may need a rewrite rather than clarifying sentences.
  Depends on how the individual decision tickets resolve.
- **Enforcement** — whether the settled conventions should be mechanically
  enforced rather than left to reviewer discipline. The ownership decision
  sharpened this considerably: the barrel-only rule makes a cross-route
  violation *textual*, so a lint rule or CI grep is now clearly feasible where
  before it was speculative. Still fog because the other conventions
  (target shape, action layer) aren't settled yet, and enforcing a partial set
  may be worse than enforcing none. Revisit once those land.

## Out of scope

<!-- ruled beyond the destination; never graduates -->

- **Actually performing the restructuring** — moving files, adding barrels,
  renaming `index.tsx`. Deliberately excluded by the destination; this map
  decides, a follow-on effort executes.
- **I4 (wider test coverage gap)** — the 15 untested `action.ts` files. Related
  (it is the same thin-safety-net problem seen from another angle) but a
  separate audit item with its own guidance to pick up opportunistically.
