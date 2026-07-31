# How should the execution effort be shaped and guarded?

Type: grilling
Status: open
Blocked by: 01, 02, 03

## Question

The last decision before this map clears: define the shape of the follow-on
execution effort, so it can start without re-deciding anything.

The forcing constraint is the **thin safety net**. Of 23 test files, ~19 cover
`articles` — already clean and mostly untouched by this work. The areas that
would actually move (kader, trainings, pages, profile) have 4 test files
between them. Large-scale file movement there is guarded by little more than
`tsc --noEmit`.

Decide:

1. **Ordering** — mechanical-first (safe, builds confidence, but may be redone
   if ownership moves folders) or ownership-first (riskiest change while the
   tree is still familiar)? Note this is the reverse of the ticket numbering
   here, and that is fine — deciding order is exactly this ticket's job.
2. **Granularity** — one commit per area, one per drift category, or one large
   mechanical commit plus separate risky ones? Bear in mind `/code-review` runs
   before each commit, and very large diffs review poorly.
3. **Safety net** — is any test scaffolding required *before* the risky moves
   (particularly around the `profile` → `kader` server action from ticket 01),
   or is `tsc` plus review genuinely enough given the changes are moves rather
   than rewrites? If tests are needed, name which ones — this is also where
   I4's backlog can be drawn from opportunistically.
4. **Verification gap** — no login credentials were available in the previous
   sessions, so UI changes could not be checked in a real browser. Does the
   execution effort need seeded credentials arranged first (`src/scripts/seed.ts`),
   or is pure file movement low-risk enough not to need a browser pass?

Output: a short written brief the execution effort starts from — not a full
plan, just the constraints and sequencing it must respect.

## Answer

_unresolved_
