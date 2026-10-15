# Pre-Feature Codebase Audit

Label: wayfinder:map

## Destination

A single consolidated audit report covering the whole codebase — findings and
prioritized recommendations across structure/convention consistency, Next.js
best practices, UI design/a11y, and technical health (tests, types,
dependencies) — that the team reads before starting new feature work. This
map produces the report and its priority plan; it does not execute the fixes.

## Notes

- Domain: general engineering housekeeping, not a specific feature.
- Standard to audit against: `AGENTS.md` (arrow functions, atomic
  component-folder structure, RSC-first, cacheTag/updateTag caching,
  Web Interface Guidelines a11y, Compound Components) plus patterns already
  consistently used in the codebase (the recently-completed article-management
  feature, commits `b3227b5`..`0bdf1d7`, is a good positive reference point).
- No `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` exist yet in this repo —
  audit tickets should note this but not attempt to backfill it themselves.
- All four category audits are AFK research tickets: read code, compare
  against the standard above, report findings. No fix execution in this map.
- Consult skills as needed while resolving tickets: `code-review`,
  `web-design-guidelines`, `next-cache-components-adoption`,
  `next-partial-prefetching-adoption`, `vercel-react-best-practices`,
  `simplify`.
- Repo snapshot at charting time: ~425 src `.ts`/`.tsx` files (excluding
  shadcn-generated), only 19 test files, 8 dashboard feature areas (kader,
  branches, trainings, articles, pages, perangkat, alumni, profile).

## Decisions so far

- [Structure & convention consistency audit](issues/01-structure-convention-audit.md) — articles feature is a clean baseline; most other areas systematically flatten sub-components into one folder, skip `index.ts` barrels, or (trainings) use `index.tsx` as the impl file instead of a barrel; `action.ts` shared across sibling components at the route root recurs in 5 places, same shape as `src/lib/actions/storage.ts`.
- [Next.js best-practice audit](issues/02-nextjs-best-practice-audit.md) — `cacheComponents: true` is already live; several `page.tsx` routes read the DB raw instead of through `_data/*.ts` cache wrappers; profile-edit, kader bulk-upload, and all training mutations never call the matching `updateTag`, breaking read-your-writes for kader/dauroh data.
- [UI design & accessibility audit](issues/03-design-a11y-audit.md) — shared `DataTable` (kader/alumni/perangkat) has keyboard-unreachable filter-chip removal, row-click, and an unlabeled search input; training attendant/instructor comboboxes lack accessible names; `trainings` FilterForm is dead code, leaving org/year filtering with no UI.
- [Technical health audit](issues/04-technical-health-audit.md) — only 3 of 21 `action.ts` files have real tests; untested ones include member delete, password reset, and training grading-window logic (all carry cross-org authorization checks); types pass clean, lint has 127 warnings/0 errors, format passes on source; one migration is missing its snapshot.json; `drizzle-orm`/`drizzle-kit` pinned to pre-1.0 betas.
- [Consolidate findings into final report and prioritize](issues/05-consolidate-report-and-prioritize.md) — report organized by priority tier (not audit category); missing `updateTag` calls and untested cross-org authorization actions elevated to Critical; dead code marked safe to delete; final deliverable is [REPORT.md](REPORT.md).

## Not yet specified

- Whether a follow-up execution map (or a set of standalone fix tickets)
  should be spun up to act on the report's Critical/Important findings, and
  how that work should be sequenced against upcoming feature work — left for
  a separate session when the user is ready to act on the report.
- Whether `CONTEXT.md`/`docs/adr/` should be backfilled — the report names
  several undocumented domain concepts (org hierarchy/role-scope model,
  member status vocabulary, training grading window) as first candidates,
  but the decision to formalize them is separate from this report.

## Out of scope

- Executing any fix identified by the audits (formatting, dependency bumps,
  refactors, test-writing, etc.) — this map produces the report only.
- Auditing the main marketing site content/copy (`src/app/(main)`) for
  editorial quality — scope is engineering/design conventions, not content.
