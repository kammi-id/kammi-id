# How should the execution effort be shaped and guarded?

Type: grilling
Status: open
Blocked by: 03

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
3. **Safety net** — the risk profile shifted once the two decisions landed, and
   not in the direction the original audit assumed:
   - The `profile` → `kader` action import is **not** the danger it was
     believed to be (unauthenticated region proxies; see the ownership ticket).
   - The real risk is now the action-layer work: consolidating three identical
     `checkAccess()` copies into one shared `src/lib/auth/` helper **changes
     live authorization code** for `root`/`humas` across `pages/home`,
     `pages/managers` and `pages/tentang`. None of those three has a single
     test. That is a rewrite, not a move, and `tsc` cannot see a behavioural
     regression in an access check.
   - `user/account` has a *different* inline access rule and must not be folded
     into the shared helper — a correctness trap worth an explicit guard.

   So: does the authorization consolidation need tests written first? If so,
   name them — this is the natural place to draw from I4's backlog, since those
   are exactly the untested `action.ts` files it lists.
4. **Verification gap** — no login credentials were available in the previous
   sessions, so UI changes could not be checked in a real browser. Does the
   execution effort need seeded credentials arranged first (`src/scripts/seed.ts`),
   or is pure file movement low-risk enough not to need a browser pass?

Output: a short written brief the execution effort starts from — not a full
plan, just the constraints and sequencing it must respect.

## Answer

_unresolved_
