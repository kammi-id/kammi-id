# How are the settled conventions enforced mechanically?

Type: grilling
Status: open
Blocked by: 04

## Question

Graduated from the map's **Not yet specified** section. It was fog while the
conventions were unsettled; tickets 01–03 have now settled all of them, and
ticket 03's universal-barrel decision is what makes enforcement tractable.

The decisions are now stated as **textual** invariants, which is the property
that matters — each is checkable without understanding intent:

1. **Barrel-only cross-route imports** (ticket 01). Because barrels are
   universal (ticket 03 §2), any import path reaching *into* another
   component folder is a violation by inspection. No allowlist of
   "folders that should have barrels" is needed — there is no exception.
2. **Every component folder has an `index.ts`** (ticket 03 §2).
3. **No `index.tsx`** anywhere (ticket 03 §3).
4. **No bare `.tsx` directly in a `_components/` directory** — every component
   lives in a folder (ticket 03 §4).
5. **Kebab-case filenames** (ticket 03 §4).
6. **Arrow-function components**, except generics in `.tsx` (ticket 03 §6).

Decide:

1. **Mechanism** — ESLint rule(s), a CI grep/script, a lefthook pre-commit
   hook, or some mix? The repo already runs `tsc --noEmit`; is there an
   existing lint/CI pipeline these should join, or does one need creating?
   (Check before deciding — this is a fact, not a preference.)
2. **Coverage** — all six invariants, or only the subset with a good
   cost/benefit? Rules 2–5 are near-trivial as path globs; rule 1 needs
   import-path analysis; rule 6 needs an AST.
3. **Failure mode** — hard error (blocks the build/commit) or warning? A hard
   error on a repo that has just been restructured risks blocking work if any
   violation was missed; a warning risks the drift returning, which is exactly
   how this map's problem arose.
4. **Sanctioned-consumer exception** — ticket 01 permits specific cross-route
   imports (`perangkat` and `alumni` consuming kader's composite via barrel).
   Rule 1 must allow *barrel* imports across routes while rejecting *deep*
   ones. Confirm that distinction is expressible in the chosen mechanism, or
   the rule collapses to unenforceable.
5. **Timing** — does enforcement land with the execution effort, or after it?
   Landing it first would fail immediately on the current tree; landing it
   after risks never landing.

**Blocked by 04** because the AGENTS.md text is the specification the
enforcement encodes; writing a lint rule against unsettled prose would mean
rewriting it.

## Answer

_unresolved_
