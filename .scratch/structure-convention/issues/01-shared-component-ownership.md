# Who owns the cross-route shared components?

Type: grilling
Status: resolved

## Question

Five call sites reach into another route's `_components/` folder. Two use
relative paths (visible in the original audit), three use the `~/` alias and
were **missed by the audit's grep** — including the most serious one.

Confirmed reach-ins:

| From | Into | Via |
|---|---|---|
| `perangkat/[[...slug]]/page.tsx` | `kader/_components/MembersPageContent`, `members-page-header`, `specialist-summary-cards` | relative `../../` |
| `alumni/[[...slug]]/page.tsx` | `kader/_components/MembersPageContent` | relative `../../` |
| `trainings/.../dm1-bulk-upload-button.tsx` | `kader/_components/bulk-upload` | `~/` alias |
| `profile/.../profile-info.tsx` | `kader/_components/region-combobox` | `~/` alias |
| `profile/.../profile-info.tsx` | `kader/_components/add-form/action` | `~/` alias |

**Correction to the original framing.** When this ticket was written it claimed
the `profile` → `add-form/action` row was an authorization leak. Reading the
code disproves that. The four functions `profile` actually imports
(`fetchProvinces/Cities/Districts/Villages`) are thin proxies to `regionApi` —
no session read, no DB access, no authorization. The session-bearing exports in
that same file (`createMemberAction`, `updateMemberAction`,
`searchMembersAction`) are **not** imported by `profile`. So this row is a
misplaced-file problem: four public region utilities happen to live in a file
owned by kader.

The genuine authorization-weight reach-in is a **different row** — `trainings` →
`kader/_components/bulk-upload`. `bulkCreateMembersAction` checks
`role !== 'bpk' && role !== 'root'`, calls `isOrgInScope`, writes members and
credentials, and emits an audit log. It is also the only reach-in with test
coverage (`bulk-upload/action.test.ts`).

So the five reach-ins are not one kind of problem. They sort into at least
three: page-level composites (`MembersPageContent` and friends), stateless
utilities that were never kader-specific (region fetchers, `RegionCombobox` —
a pure `'use client'` presentational component over `RegionItem`), and one
genuinely privileged cross-route action (`bulkCreateMembersAction`).

Decide, per category:

1. **Stateless utilities never specific to kader** — the four region fetchers
   and `RegionCombobox`. These look like straightforward promotions (region
   fetchers toward `src/lib/api/region`'s own action layer, `RegionCombobox`
   to `src/components/`). Confirm, and decide whether the region actions
   should be a shared `action.ts` or fold into an existing lib module.

2. **Page-level composite** — `MembersPageContent` (355 lines, 3 routes) plus
   `members-page-header` and `specialist-summary-cards`. Is a
   route-page-shaped composite even a candidate for `src/components/`, which
   otherwise holds generic UI? Or does it want a different home — and does
   kader remain its owner with the other two routes as sanctioned consumers?

3. **The privileged action** — `bulkCreateMembersAction`, used by kader and
   trainings. Its authorization is self-contained (it re-checks role and org
   scope on every call rather than trusting the caller), so sharing it is not
   obviously unsafe. But should a privileged action be reachable cross-route
   at all, or does trainings warrant its own entry point?

Then the general rules:

4. What is the **promotion bar**? "Used by 2+ routes" is the obvious rule but
   would drag in things that are only coincidentally similar.
5. Is the `~/` alias part of the problem? It makes a reach-in look like a
   legitimate shared import at the call site — which is exactly why the
   original audit's grep missed three of these five. Should cross-route
   `~/app/...` imports be a named violation, independent of where the shared
   code eventually lives?

## Answer

Ownership is decided **per category**, not by one blanket rule — the five
reach-ins turned out to be three different problems wearing the same shape.

### Per category

**1. Stateless utilities — promote both.**
`RegionCombobox` moves to `src/components/`. The four region fetchers fold into
`src/lib/api/region`'s own action layer. Neither touches kader's domain; both
were only ever misfiled. Low risk, `tsc` catches any miss.

**2. Page-level composite — kader keeps ownership; consumers are sanctioned.**
`MembersPageContent`, `members-page-header` and `specialist-summary-cards` stay
in `kader/_components/`. `src/components/` is for generic UI, and a
page-shaped composite is not that. What changes is the *convention*, not the
code: AGENTS.md gains an explicit "owning route + sanctioned consumers"
pattern, and alumni/perangkat must import through the folder barrel.

**3. Privileged action — sharing allowed, barrel required.**
`bulkCreateMembersAction` stays shared between kader and trainings. Its
authorization is self-contained — it re-derives role and org scope on every
call rather than trusting its caller — so a second caller adds no risk. Import
via the folder barrel; `bulk-upload/action.test.ts` is retained as the contract
guard for that shared status.

### General rules (both go into AGENTS.md)

**Promotion bar — generic AND used by 2+ routes.** Both conditions, not either.
"Used by 2+ routes" alone would have promoted `MembersPageContent`, which the
category-2 decision explicitly rejects; "generic" alone would grow
`src/components/` ahead of demand. The pair is exactly what separates
`RegionCombobox` (promotes) from `MembersPageContent` (does not).

**Cross-route imports must target a barrel.** Importing another route's
internal file (`.../add-form/action`) is a violation; importing its folder
barrel (`.../bulk-upload`) is allowed. A blanket ban on cross-route imports was
rejected as incompatible with decision 2 — alumni and perangkat need a legitimate
route to a component that deliberately stays in kader.

This rule is also the fix for the **visibility failure** that made this ticket
necessary: at a call site, `~/app/(dashboard)/dashboard/kader/...` looks as
legitimate as `~/components/...`, which is why three of the five reach-ins
escaped the original audit's relative-path grep. Barrel-only makes the
violation textual and therefore greppable — relevant to the enforcement
question still sitting in the map's Not yet specified.

### Correction carried out of this ticket

The charting session claimed `profile` → `kader/add-form/action` was an
authorization leak. It is not — the imported functions are unauthenticated
region proxies. The real authorization-weight sharing is
`trainings` → `bulkCreateMembersAction`, and it was judged safe on inspection.
Anything downstream that inherited the original claim should be re-read.
