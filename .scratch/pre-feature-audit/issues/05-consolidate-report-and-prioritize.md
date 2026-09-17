# Consolidate findings into final report and prioritize

Type: grilling
Status: resolved
Blocked by: 01, 02, 03, 04

## Question

Four audits are done (structure/convention, Next.js best-practice, UI/a11y,
technical health). This ticket is the destination itself: work with the user
to (a) consolidate all findings into a single readable report, and (b)
prioritize them — which findings are worth acting on before new feature work
starts, which can wait, which are informational only.

Open questions to resolve with the user in this session:

- Severity/priority rubric: several findings straddle categories (e.g. the
  shared `DataTable` a11y bugs also indicate a structural/reuse issue; missing
  `updateTag` calls are both a correctness bug and a convention gap). Does the
  user want the report organized by audit category, or by priority tier
  cutting across categories?
- Two findings look like live correctness bugs, not just style debt: (1)
  missing `updateTag` after profile/bulk-upload/training mutations (stale
  cache = wrong data shown), and (2) zero test coverage on cross-org
  authorization actions (delete-member, reset-password, training grading
  window) — a scope-check bug here has real security/data consequences.
  Confirm whether these should be flagged for near-term fixing outside this
  report's scope, or whether the report is purely descriptive.
- Whether a follow-up execution plan (new tickets, or a new map) should be
  spun up immediately after this report, and how it should be sequenced
  against upcoming feature work.
- Whether findings like the dead `src/components/ui/combobox/` and the dead
  `trainings/_components/filter-form/` should be called out as "safe to
  delete" or left for the user's own judgment.

Produce the final deliverable as a single markdown file (e.g.
`.scratch/pre-feature-audit/REPORT.md`) synthesizing all four tickets'
`## Answer` sections, organized per the rubric agreed above, closing with a
prioritized action list.

## Answer

Resolved with the user:

- Report organized by cross-cutting priority tier (Critical / Important /
  Nice-to-have / Informational), not by originating audit category.
- Two findings elevated to **Critical**, called out for near-term fixing
  ahead of/alongside new feature work rather than treated as descriptive-only:
  (1) missing `updateTag` calls after profile-edit, kader bulk-upload, and
  all training mutations — a live stale-cache bug; (2) zero test coverage on
  cross-org authorization actions (delete-member, reset-password,
  training grading window) — a scope-check bug here has real
  security/data-integrity consequences.
- Dead code (`src/components/ui/combobox/`,
  `trainings/_components/filter-form/`) called out explicitly as safe to
  delete — both pre-verified via grep to have zero real importers.
- No follow-up execution map spun up in this session — the report stands
  alone; a follow-up map/tickets is left for a separate session when the
  user is ready to act on it.

Final deliverable: [REPORT.md](REPORT.md).
