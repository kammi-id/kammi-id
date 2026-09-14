# Is a route-level shared `action.ts` a violation, or a missing convention?

Type: grilling
Status: resolved

## Question

Four `action.ts` files sit at a `_components/` **root** rather than inside a
single component's folder, each consumed by several sibling components:

- `pages/home/_components/action.ts`
- `pages/managers/_components/action.ts`
- `pages/tentang/_components/action.ts`
- `user/account/_components/action.ts`
- (plus `profile/[registerNumber]/_components/action.ts`)

AGENTS.md's atomic structure implies `action.ts` belongs to one component.
But this shape recurs in five independent places, written by different hands
at different times — and `src/lib/actions/storage.ts` is the same idea at a
wider scope. That consistency is evidence it is solving a real problem, not
five separate mistakes.

So the question is genuinely two-sided:

1. Is this **drift to correct** — split each shared `action.ts` into
   per-component `action.ts` files, duplicating or extracting as needed?
2. Or is it a **legitimate pattern the convention failed to name** — a
   route-scoped action layer, which AGENTS.md should document (with a rule
   for when it is allowed over per-component actions)?

**What the code shows.** Measured rather than assumed:

| File | LOC | Exported actions | Importing components |
|---|---|---|---|
| `pages/home` | 429 | 8 | 7 |
| `pages/tentang` | 173 | 3 | 3 |
| `user/account` | 161 | 2 | 2 |
| `pages/managers` | 117 | 1 | 1 |
| `profile/[registerNumber]` | 96 | 2 | — |

Two facts sharpen the question:

- The mapping is close to **one action per component**, not many components
  sharing one action. `pages/home` is 8 actions for 7 components; `managers`
  is a single action with a single importer. So these files are largely
  *co-located*, not *shared* — which weakens the "legitimate shared layer"
  reading for most of them.
- But all three `pages/*` files open with a **byte-identical**
  `SettingsActionState` type and a private `checkAccess()` helper. That
  duplication is real sharing — just sharing that crosses these files rather
  than living inside any one of them.

So the split may be the wrong axis. A third option: keep per-component
`action.ts` files (satisfying the convention) **and** extract the genuinely
common part — `SettingsActionState` + `checkAccess` — into a shared module the
`pages/*` routes import. That would leave `managers` (1 action, 1 importer) as
a plain convention violation with no defence.

Also weigh: whether splitting duplicates Zod schemas or `updateTag` calls, and
whether per-component actions make the `cacheTag`/`updateTag` pairings from
commit `fdd609a` harder to keep correct.

### Session-helper bypass (found while resolving)

The same four files **bypass `readActiveSession`** — they read the cookie and
call `validateSession` themselves. Repo-wide the split is stark:

- **36 files** use `readActiveSession` (`src/lib/auth/cookies.ts`)
- **4 files** bypass it — exactly the four route-level `action.ts` files

The correlation is total, and it is not a per-route decision: each
`pages/*/page.tsx` uses the helper correctly while its sibling `action.ts` does
not. That reads as copy-paste spread, not intent.

**Verified against the Next.js docs** (`01-app/02-guides/authentication.md`)
before drawing conclusions, which corrected an overstated claim made earlier in
this ticket's discussion:

- `readActiveSession` matches the documented DAL pattern exactly — React
  `cache()` around the session read, invoked from "data requests, Server
  Actions, Route Handlers".
- But the docs scope memoization to **"during a React render pass"**. A Server
  Action runs in a separate phase, so for an action that reads the session once,
  the helper saves **nothing** over `checkAccess`. The earlier framing of "an
  extra session validation per request" was wrong as a general statement.
- `validateSession` is not a pure read: it writes `lastVerifiedAt` via
  `updateSessionFromTable` once `activityCheckIntervalMS` elapses. So redundant
  calls can cost a DB write, though idempotently.

Net: the case for consolidating is **correctness and maintainability**, not
performance — three byte-identical copies of a `root`/`humas` authorization
check must all be edited in lockstep if the access rule ever changes.

Whatever is decided, the outcome must include the **AGENTS.md wording change** —
either tightening the rule so these are clearly violations, or adding the
route-scoped action layer as a documented option.

## Answer

**It is a violation — split per component — but extract what is genuinely
shared rather than duplicating it.**

The "undocumented convention" reading does not survive the measurements. The
mapping is close to one action per component (home: 8 actions / 7 components;
managers: 1 / 1), so these files are *co-located*, not *shared*.
`pages/managers` — a single action with a single importer sitting at the
`_components/` root — has no defence at all.

### What happens to each part

**Per-component actions.** Every action moves into its own component folder as
`action.ts`, per AGENTS.md's atomic structure. This is the bulk of the change
and it is mechanical.

**The genuinely shared part gets extracted, not copied.** All three `pages/*`
files open with a byte-identical `SettingsActionState` type and a byte-identical
private `checkAccess()`. Splitting without extraction would turn 3 copies of an
authorization rule into ~12. Instead:

- `checkAccess()` becomes a shared helper — the natural home is alongside
  `readActiveSession` in `src/lib/auth/`, since it is an authorization concern,
  not a `pages/` concern.
- The new helper is built **on top of `readActiveSession`**, closing the bypass
  described above, so there is one path to a session for the whole repo.
- `SettingsActionState` is extracted next to it or into a shared types module.

### On the session bypass

Folded into this decision rather than tracked separately: the four files that
violate the structure convention are exactly the four that bypass the session
helper, so it is one symptom, not two problems. Fixing them separately would
mean touching the same files twice.

But the justification was checked against the Next.js docs first, and the
**performance argument does not hold** — React `cache()` memoizes within a
render pass, and Server Actions run in a separate phase, so the helper saves an
action nothing. The reason to consolidate is that a `root`/`humas` rule
duplicated three times must be edited in three places, and that
`readActiveSession` is the documented DAL pattern this repo already follows in
36 other files. Any execution ticket should state it that way and not claim a
speedup.

### Constraint carried to execution

`user/account/_components/action.ts` bypasses the session helper too, but has
no shared `checkAccess` — its authorization is inline and its access rule
differs from the `pages/*` trio. It gets the split and the `readActiveSession`
fix, but must **not** be forced onto the `pages/*` helper.

### AGENTS.md consequence

The rule stays as written — `action.ts` belongs to one component. What is added
is the explicit note that shared *authorization* logic belongs in
`src/lib/auth/`, never duplicated across route-level action files. That is the
gap which let this pattern appear five times without anyone flagging it.
