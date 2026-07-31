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

Inputs worth weighing: how much of each shared file is genuinely shared versus
incidentally co-located; whether splitting would duplicate Zod schemas or
`updateTag` calls; and whether per-component actions would make the
`cacheTag`/`updateTag` pairings from commit `fdd609a` harder to keep correct.

Whatever is decided, the outcome must include the **AGENTS.md wording change** —
either tightening the rule so these are clearly violations, or adding the
route-scoped action layer as a documented option.

## Answer

_unresolved_
