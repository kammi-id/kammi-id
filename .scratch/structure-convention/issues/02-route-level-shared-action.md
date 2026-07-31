# Is a route-level shared `action.ts` a violation, or a missing convention?

Type: grilling
Status: open

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

Whatever is decided, the outcome must include the **AGENTS.md wording change** —
either tightening the rule so these are clearly violations, or adding the
route-scoped action layer as a documented option.

## Answer

_unresolved_
