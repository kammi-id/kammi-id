# How are the settled conventions enforced mechanically?

Type: grilling
Status: resolved
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

**Verdict: ESLint `no-restricted-imports` for rule 1, a CI script for rules 2–5,
nothing for rule 6. All warn-first, landing *with* the execution effort.**

But the load-bearing finding is not the tool choice. It is that **§6's violation
pattern does not survive measurement** — the fourth-and-a-half instance of this
map's recurring lesson, and the first time it has hit a pattern written *to be*
mechanical.

### 0. §6's pattern is wrong, in three ways

§6 states: *"An import violates if its path enters another route's
`_components/` **and** points deeper than that component's folder."* Measured
against all 23 cross-route-shaped imports in the tree, that sentence
misclassifies three separate categories:

**a. "another route's" is not decidable from the specifier.** Eight legal
imports have the shape `../_components/<x>` — a route importing *its own*
`_components/` from a `page.tsx` one level down (`articles/new/page.tsx` →
`../_components/article-form`). A glob sees `../` + `_components/` and cannot
tell self from other. Deciding it requires resolving the specifier against the
importing file's path — which no glob does, and which is exactly the line
between `no-restricted-imports` (patterns) and a custom rule (resolution).

**b. The dashboard-level shared `_components/` is invisible to the rule.**
`src/app/(dashboard)/dashboard/_components/` is a real, sanctioned shared
location — `data-table` is consumed by kader, branches and trainings via
`../../../_components/data-table`. §6 assumes every `_components/` belongs to a
route that owns it. This one belongs to a *route group*, and every import of it
is by definition cross-route and legal. §6 would flag all four.

**c. Depth is not legality.** The cleanest disproof:
`~/…/user/account/_components/action` is **one** segment past `_components/`, so
§6's depth test rules it legal — while ticket 02 ruled root-level `action.ts` a
violation and scheduled it for splitting. Meanwhile
`~/…/dashboard/_components/data-table/data-table` is **two** segments deep and
is merely the barrel-less spelling of a legal import. Depth correlates with the
violation; it does not constitute it.

The corrected invariant, which *is* mechanical:

> An import is a violation if it resolves into a `_components/` directory that
> is not the importer's own, and does not terminate at a direct child of that
> directory.

The change is "resolves into … not the importer's own" replacing "enters another
route's". That needs path resolution, and it is what picks the tool below.

### 1. Mechanism, per rule — not one mechanism

The ticket asked for *a* mechanism. The six invariants split into three groups
with genuinely different costs, and forcing one tool on all six is what would
make this fail.

| Rule | Mechanism | Why |
| --- | --- | --- |
| 1. Barrel-only cross-route imports | ESLint `no-restricted-imports` (`patterns[].group`) | Already-installed, zero new deps; catches the `~/` spelling exactly |
| 2. Every component folder has `index.ts` | CI script | Not an import or AST question — it is a filesystem question. ESLint cannot see a *missing* file |
| 3. No `index.tsx` | CI script (one `find`) | Same |
| 4. No bare `.tsx` at a `_components/` root | CI script | Same |
| 5. Kebab-case filenames | CI script | Same |
| 6. Arrow-function components | **nothing — do not enforce** | See §3 |

**Rule 1 caveat, stated honestly.** `no-restricted-imports` matches specifier
*strings*, so it cleanly catches the `~/` alias spelling (absolute, self-evident)
but **cannot** express finding (a) for relative spellings — `../_components/x` is
legal or not depending on who imports it. Two options, and I recommend the first:

- **Recommended — ban deep relative `_components/` imports outright.** Any
  `../*_components/*/*` is a violation regardless of ownership. This is
  *stricter* than §6: it also forbids a route deep-importing its own
  `_components/`. Measured cost: **one** file (`branches-table/columns`), which
  ticket 03 already lists as an execution item since it should import the barrel.
  Everything else legal today stays legal. Strictness that costs one already-
  scheduled edit is worth the rule staying a one-liner.
- Rejected: a custom ESLint rule doing real resolution. ~80 lines, a plugin
  package, and a test suite of its own — against a repo whose *entire* enforcement
  need is 23 imports. The safety net is thin (map's Notes); adding untested
  tooling to guard untested code inverts the priority.

### 2. The CI script

One file, `scripts/check-structure.ts`, run by `bun`. It is ~40 lines of
`readdir` and covers rules 2–5 together in a single tree walk, because they are
all the same question asked of one directory listing. Not four scripts.

Two things it must special-case, both measured, both invisible to a naive glob:

- **Grouping folders** (04 §5) are exempt from rule 2. `base-ui/`, `ui/`, and
  `src/components/` itself hold only folders and legitimately have no barrel.
  Test by *content* (does it directly contain `.tsx`?), never by name — 04 §5
  chose that definition precisely so it stays true as the tree grows.
- **`_`-prefixed files are exempt from rules 4 and 5.** A naive kebab-case regex
  reports 4 violations; two of them (`_constants.ts`, `_mock-address.ts`) are
  *sanctioned* by 04 §9, and a third (`indonesia-provinces.geojson.d.ts`) is a
  type declaration whose name mirrors the asset it types. Real violation count is
  **one**: `MembersPageContent.tsx`. A rule that cries wolf on its reference
  implementation gets deleted within a month.

### 3. Coverage — rule 6 is dropped

Rule 6 (arrow-function components) is the only one needing an AST, and it is
also the one with nothing left to catch. Measured: four function declarations in
component scope. Three are `loading.tsx` — Next.js convention files, exempt from
Atomic Structure and Colocation but *not* from function style (04 §12), so they
are genuine violations. The fourth is `DataTable`, which 04 §12 makes an
explicit **exception**.

So an AST rule would need to encode the generics exception to catch three
one-line files that a single execution-effort edit fixes permanently. New
violations arrive only by someone hand-writing a `loading.tsx` — rare, and
reviewable. **Enforce nothing; fix the three during execution.** If they recur,
revisit with `func-style`.

This is the ticket's cost/benefit question answered in the direction it was
leaning: five of six, not all six.

### 4. Failure mode — warn, then error

The ticket framed this as error-vs-warning. Measured violation counts make it a
sequencing question instead:

Rules 2–5 currently have **~6** real violations, every one of them already on
ticket 05's execution list. Rule 1 has **one** (per §1's stricter form). So the
tree is *nearly* clean already — the "hard error blocks all work" fear the ticket
raised is smaller than it looks.

Still: **land warn, flip to error in the same PR that finishes execution.** The
flip is a one-line change and is ticket 05's last execution item. Warning
permanently is how this map's problem arose (drift returns silently); erroring
first is how tooling gets reverted at 2am. The window between them is one PR.

### 5. Sanctioned-consumer exception — expressible, confirmed

The ticket flagged this as a rule-collapse risk. It is not, and §1's stricter
form is what makes it safe:

- ✓ `~/…/kader/_components/bulk-upload` — terminates at a direct child, allowed
- ✓ `~/…/kader/_components/region-combobox` — same
- ✗ `~/…/kader/_components/add-form/action` — one segment too deep, caught
- ✗ `~/…/kader/_components/add-form/store` — caught

`perangkat` and `alumni` consuming kader's composite through its barrel passes;
the two `add-form` reach-ins fail. That is exactly ticket 01's decision, and it
falls out of a single `no-restricted-imports` pattern with no allowlist. The
distinction survives.

### 6. Timing — with execution, not before or after

The ticket posed first-vs-after. **Neither: same effort, staged.** Enforcement
lands warn-only at the *start* of the execution effort so it acts as the
worklist — the script's own output is the checklist, and execution finishes when
it prints nothing. Then the error flip closes it.

Landing first (as error) fails the build on ~7 known violations. Landing after
risks never landing, which the ticket correctly named as the likelier failure.
Staging inside one effort avoids both, and costs nothing because the violations
are already enumerated.

### Execution load added by this ticket

- `eslint.config.mjs`: one `no-restricted-imports` block (~10 lines).
- `scripts/check-structure.ts`: new, ~40 lines.
- `package.json`: `check:structure` script.
- `.github/workflows/ci.yml`: one step.
- Final PR: warn → error.

### Incidental finding — CI does not run `check:types`

Not this ticket's question, but measured while answering it and too load-bearing
to leave unsaid. `.github/workflows/ci.yml` runs `check:format`, `check:lint`,
unit tests and e2e — **not `check:types`**, though the script exists.

The map's central constraint is that `tsc --noEmit` is *nearly the only guard*
over ~18 mechanical file moves. That guard is currently **not wired into CI** —
it holds only as long as whoever executes remembers to run it locally.

Adding one step to `ci.yml` is the single highest-value line in this entire
enforcement ticket, and it enforces nothing this map decided. Recommend ticket
05 carry it as an execution item. Flagged, not fixed — this map decides.

### Not decided here

Whether `check:structure` should also gate the pre-commit path. There is no
lefthook or husky in the repo (`.git/hooks` holds only samples), so adding one
means introducing a hook manager — a tooling decision beyond this map's
destination, and CI already closes the loop.
