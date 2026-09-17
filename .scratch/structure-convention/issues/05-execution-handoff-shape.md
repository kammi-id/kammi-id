# How should the execution effort be shaped and guarded?

Type: grilling
Status: resolved
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

**Now unblocked** — and ticket 03's re-measurement changes the risk balance
this ticket is weighing. The mechanical half is far smaller than the audit
implied: **~16 edits total** (4 `index.tsx` renames, 1 sibling rename, 2
files→folders, 7 new barrels, 1 arrow conversion, 1 de-duplication), plus
repointing the deep-path cross-route imports. No folders are split — the 7
"flattened" ones were ruled correct as-is. Every mechanical item is a rename or
a re-export, so `tsc --noEmit` genuinely does guard that half.

That sharpens the ordering question rather than answering it: the mechanical
work is now small enough that "mechanical-first to build confidence" buys less
than it did, while the authorization consolidation (item 3) remains the entire
real risk. Consider whether the two halves should even be one effort.

One mechanical item is **not** purely cosmetic and should be sequenced
deliberately: giving `members-page-content/` and `specialist-summary-cards/`
their barrels is what makes ticket 01's barrel-only rule enforceable at all,
and it touches the `perangkat` and `alumni` route imports. It is the one place
where the mechanical pass and the ownership decision meet.

Output: a short written brief the execution effort starts from — not a full
plan, just the constraints and sequencing it must respect.

## Answer

**Verdict: one effort, four commits, mechanical-first — and the authorization
consolidation needs no new tests, because measurement dissolved the risk this
ticket was built around.**

### 0. The premise of item 3 does not survive measurement

This ticket's hardest question was "does the authorization consolidation need
tests written first?" It was framed as *"a rewrite, not a move"* touching *five
files* with *three identical copies* of a `root`/`humas` rule. Measured:

**a. Three copies, not five.** `checkAccess` is defined in exactly three files
(`pages/home`, `pages/managers`, `pages/tentang`) and referenced in no others.
Ticket 02's "five files" conflated the three `checkAccess` copies with the two
`user/account` inline session reads, which are a different thing (see c).

**b. The three are byte-identical** — confirmed by hashing lines 16–31 of each:
all `69570e02…`. So the consolidation has no behavioural deltas to reconcile.
There is no "which copy is the correct one" question.

**c. `user/account` has no role check at all.** The ticket calls it "a
*different* inline access rule" and flags a correctness trap. It is sharper than
that: `user/account/_components/action.ts` checks only *authentication*
(`validateSession` → proceed) with no `role` comparison anywhere — correctly, as
a user editing their own account needs no privilege. So it is not a variant rule
that might get folded in by mistake; it is **not the same kind of thing**, and
the shared helper's name should make that impossible to confuse.

**d. The decisive one — this is a move, not a rewrite.** `checkAccess` lines
17–22 are *character-for-character* the body of `readActiveSession`
(`src/lib/auth/cookies.ts`), differing only in returning `undefined` vs `null`:

```
checkAccess:        cookies() → get('kammi_id_session') → validateSession → …
readActiveSession:  cookies() → get('kammi_id_session') → validateSession → …
```

`readActiveSession` already exists, is already `cache()`-wrapped, and already has
**40 callers**. So consolidating is not writing new authorization logic — it is
deleting three copies of a helper that duplicates one already in `src/lib/auth/`,
and adding the four lines the copies add on top (`role` check + `orgId`
extraction).

**Therefore: no tests need to be written first.** The ticket's own stated
condition for demanding them — *"that is a rewrite… `tsc` cannot see a
behavioural regression in an access check"* — is not met. The residual risk is
the four-line role/orgId tail, which is reviewable by eye in a diff that does
nothing else. Writing three `action.ts` test suites to guard a verbatim move
would spend I4's budget on the safest item in the effort.

**Guard instead:** the consolidation is its own commit (§2, commit C) containing
*only* deletions and one new export. Any behavioural change becomes visible as a
non-deletion line in that diff.

`tests/access-control.test.ts` exists but is not relevant cover here — it tests
`fetchAllowedOrgIds` org-hierarchy traversal against the DB, not role gating.

### 1. Ordering — mechanical-first, and the two halves stay one effort

The ticket asks whether they should even be one effort. **Yes**, now that §0
shows the authorization half is small and mechanical. Splitting would mean two
review cycles and two `tsc` baselines for what is one afternoon.

Mechanical-first, but for a different reason than "building confidence" (which
ticket 03's re-measurement did devalue): **the barrels are what make the
cross-route import rewrites expressible.** You cannot repoint
`perangkat`/`alumni` at `members-page-content`'s barrel before that barrel
exists. Order is forced by dependency, not by comfort.

The ownership-first argument ("riskiest change while the tree is familiar")
doesn't apply either, because §0 established the risky change isn't risky.

### 2. Granularity — four commits

`/code-review` runs before each, so each must be independently reviewable.

| # | Commit | Contents | Guard |
| --- | --- | --- | --- |
| **A** | Barrels + file shape | 4 `index.tsx` → `<folder>.tsx` + barrel; 2 remaining missing barrels (`_components/logout`, `kader/_components/members-grid`); 3 bare files → folders (`MembersPageContent`, `specialist-summary-cards`, `under-construction-client`); 2 bare `src/components/` files → folders; 1 sibling rename | `tsc --noEmit` |
| **B** | Repoint imports | The 3 deep cross-route imports (`add-form/action`, `add-form/store`, `dashboard/_components/data-table/data-table`) + 1 deep relative (`branches-table/columns`) → barrels | `tsc --noEmit` |
| **C** | Authorization consolidation | 3 `checkAccess` copies → one `src/lib/auth/` export built on `readActiveSession`. **Touches `user/account` not at all.** | diff is deletions-only + 1 export |
| **D** | Convention + enforcement | Apply ticket 04's AGENTS.md rewrite; add ESLint rule + `check:structure` script (ticket 06); wire `check:types` into CI; flip enforcement warn → error | CI green |

A is large but uniform — a reviewer checks one pattern repeated ~12 times. B is
small and is where a mistake would actually compile-fail loudly. C is the only
one needing careful human eyes, and it is ~15 lines. Splitting A per-area was
rejected: it multiplies commits without changing what a reviewer verifies.

**Sequencing note the ticket flagged, honoured:** `members-page-content/` and
`specialist-summary-cards/` getting barrels is in **A**, and the `perangkat`/
`alumni` imports that depend on them are in **B**. That is the one place the
mechanical pass and the ownership decision meet, and it is deliberately split
across two commits so the barrel exists before anything points at it.

### 3. Measured execution load — 19 items

Supersedes the "~18" estimate. Ticket 06's scaffolding adds to it.

- 4 `index.tsx` renames (all in `trainings/_components/`) — each also clears a
  missing-barrel violation, so 03's "4 renames" and "7 new barrels" **overlap**;
  they were counted as disjoint. Real remaining barrel-only additions: **2**.
- 3 bare `.tsx` at a `_components/` root → folders
- 2 bare `src/components/` files → folders (from 04 §0c)
- 1 sibling rename (`MembersPageContent.tsx` → kebab)
- 4 import repointings
- 3 `checkAccess` deletions + 1 new shared export
- 3 `loading.tsx` arrow conversions (06 §3 dropped enforcement, not the fix)
- 1 `DataTable` — **no change**, it is 04 §12's sanctioned exception

`src/components/` itself is a **grouping folder** (04 §5) and correctly needs no
barrel — it appears in a naive scan as a violation and is not one.

### 4. Verification gap — resolved, no arrangement needed

The ticket asks whether seeded credentials must be arranged first. **They already
are.** `src/scripts/seed.ts` collects every created user's credentials and writes
`users.csv` (`Display Name,Username,Password`) at the repo root. So
`bun run db:seed` produces working logins on demand — the previous sessions'
"no credentials available" was a gap in knowledge, not in tooling.

That said: **a browser pass is not required for A–C.** Every item is a rename or
re-export that `tsc --noEmit` fully covers, and C changes no rendering. Do one
manual dashboard login after **D** only — the AGENTS.md/enforcement commit is
also where the arrow-function `loading.tsx` conversions land, which are the only
items that touch rendered output.

E2E is not a safety net here: `tests/e2e/auth.playwright.ts` despite its name
only asserts the public home page's `<title>`, with no login flow.

### 5. Constraints the execution effort must respect

1. **Do not fold `user/account` into the shared auth helper** (§0c). Name the
   export for what it gates (e.g. `requireOrgManager`), not `checkAccess` —
   a generic name is what invites the mistake.
2. **`cacheComponents: true` is live.** Commit C touches files holding
   `updateTag`; keep the `cacheTag`(`_data/`) / `updateTag`(`action.ts`) split
   from 04 §11 intact.
3. **`tsc --noEmit` is not in CI** (06). Run it locally before every commit
   A–D; commit D wires it in permanently.
4. **AGENTS.md is untouched until D.** It is live instruction for every session
   in this repo (04's closing note) — applying it mid-effort changes agent
   behaviour underneath commits A–C.
5. **Enforcement lands warn-only** at the start of D and flips to error at its
   end (06 §4/§6), so the script's output is the worklist.

### Not decided here

Whether commit D's AGENTS.md rewrite should be reviewed by a human before the
enforcement tooling is written against it. Recommended, but it is a process call
for whoever executes, not a structural constraint.
