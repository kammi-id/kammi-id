# What exactly changes in AGENTS.md?

Type: grilling
Status: resolved
Blocked by: 03

## Question

Turn the settled decisions into the actual text of AGENTS.md's "Codebase
Organization" section. This is the deliverable that makes the map's decisions
durable — without it they live only in these ticket files and the next feature
copies the drift again.

**Already settled** by the ownership ticket, to be written up here verbatim:
the promotion bar (**generic AND used by 2+ routes**), the **barrel-only**
rule for cross-route imports, and a new **"owning route + sanctioned
consumers"** pattern covering the case where shared code deliberately stays
inside one route's `_components/`. That last one is genuinely new vocabulary —
AGENTS.md's colocation rule currently has no way to express it.

From the action-layer ticket: the `action.ts`-per-component rule **stands as
written** — no new pattern is needed there. What must be added is that shared
**authorization** logic belongs in `src/lib/auth/` and is never duplicated
across route-level action files, plus a pointer to `readActiveSession` as the
single sanctioned way to read a session. That omission is what let the same
copy-pasted `checkAccess()` reach five files unflagged.

Produce:

1. The **concrete diff** to AGENTS.md — new or amended rules covering shared
   component ownership (from 01), the route-level action layer question (02),
   and the precise atomic-structure target shape (03).
2. An explicit statement of **which existing rule text was wrong or
   underspecified**, so the change reads as a correction rather than an
   arbitrary rewrite.
3. A pointer naming `articles` as the reference implementation, plus whatever
   second reference the ownership decision creates (e.g. wherever promoted
   shared components end up living).

**Now unblocked** — ticket 03 has settled the target shape. What it adds to
this ticket's scope, beyond the atomic-structure text already listed above:

- **A folder is an exported unit**, not one `.tsx` file — sibling files are
  legitimate when consumed only by their sibling parent. The current
  "One component or function per folder" line reads as the stricter rule and
  is the text most in need of correction.
- **Barrels are universal** on component folders, no exceptions.
- **Filename rules**: kebab-case; no `index.tsx`; sibling names
  domain-specific rather than role-generic, with `columns.tsx` and
  `*-client.tsx` named as sanctioned idioms.
- **Scope**: rules are repo-wide (`src/app/**/_components/` and
  `src/components/`), explicitly *not* dashboard-scoped.
- **A new exception to the arrow-function rule**: generic components in `.tsx`
  may use function declarations, because generic arrow syntax needs a parser
  workaround (`<T,>` / `extends unknown`). Cite `DataTable` as the case.
- **A clarification the exemption list currently gets wrong**: the Next.js
  convention-file exemption covers Atomic Structure and Colocation only — it
  does **not** exempt `page.tsx` from the arrow-function rule. `SpecialistsWrapper`
  drifted precisely because that boundary is unstated.

Watch for the case where the decisions conflict with each other in wording even
though they were individually sensible — this ticket is the first time all four
are read as one document, and is the place to catch that.

Also decide here whether the section needs a **structural rewrite rather than
amendments**. This was fog on the map and has graduated into this ticket: three
of the four decisions came back as "the convention was wrong or incomplete, not
the code" (the atomic-structure line, the missing generics exception, the
overbroad convention-file exemption), which is the condition that was supposed
to trigger a rewrite. Judge it once the full diff is drafted.

## Answer

**Verdict: rewrite the section, do not amend it.**

Twelve changes land on a section of four sub-headings and ~35 lines, and three
of the four decisions came back as "the convention was wrong, not the code" —
the condition this ticket named as the rewrite trigger. But the deciding
argument is not the count. It is that **the old section's shape is what let the
drift through**: the exemption list names files without naming which rules they
are exempt from, and that exact gap is how `SpecialistsWrapper` escaped the
arrow-function rule. Adding a thirteenth bullet to a broken frame repeats the
mistake.

Rewrite here means **reorganised and reworded, not re-decided**. Every decision
from tickets 01-03 carries over unchanged.

### 0. Four things measured while drafting

The draft was checked against the tree, and `src/components/` — which ticket 03
never measured — changed two conclusions.

**a. `base-ui/` and `ui/` are handwritten, not vendored** (confirmed by the
user; only `shadcn/` is CLI-generated). So the exemption list is *not* widened.

**b. But they are not violations either — they are a category with no name.**
Neither holds a `.tsx` directly; both hold component folders that already have
barrels (`base-ui/select/index.ts`, `ui/link-list-editor/index.ts`).
`base-ui/select/` proves the nesting case: it has a barrel *and* contains
`async-select/`, which has its own. Ticket 03's "every component folder" quietly
assumed every folder is a component. → new rule, §5.

**c. Two bare files in `src/components/`** — `image-upload.tsx` (imported by 8
routes) and `unsaved-changes-banner.tsx` (9). Both clear the promotion bar
comfortably, so they belong where they are; only the file shape is wrong. Same
shape as `MembersPageContent.tsx`, so ticket 03's decision applies directly:
each becomes `<name>/{<name>.tsx, index.ts}`. **+2 execution items.**

**d. Two undocumented conventions already in use**: `schema.ts` (Zod schemas
split from `action.ts`, 2 files, both in `articles`) and `_data/` (5 folders —
the route-level cached read layer that commit `fdd609a` is built on). Both are
recorded as-is. Documentation, not change.

### 1. Two corrections to ticket 03

Both follow from §0, and both narrow claims that were measured on
`src/app/**/_components/` alone:

- **"Barrels are universal, no exceptions"** now has exactly one exception:
  grouping folders (§5). The greppable-violation argument survives intact — see
  §6.
- **"Repo-wide"** overreached. Its real intent was *not dashboard-scoped*; read
  literally it drags in `src/lib/`, which is consistently flat, barrel-free, and
  ~10 files. Forcing atomic structure there would turn `auth/cookies.ts` into
  `auth/cookies/{cookies.ts, index.ts}` and touch the 36 files importing
  `readActiveSession` — for zero navigational gain, against the map's
  thin-safety-net constraint. Scope is **component code**: `src/app/**/_components/`
  and `src/components/`.

This is the fourth time a claim has not survived measurement (cf. tickets 01,
02, 03). The difference: this time the claim was our own, not the audit's.

### 2. What the old text got wrong

Stated explicitly so the rewrite reads as a correction.

| Old text | Why it is wrong |
| --- | --- |
| "**Atomic Structure:** One component or function per folder." | Reads as one-`.tsx`-per-folder. The reference implementation never obeyed it — `training-detail-view/` (5 files) and `branches-grid/` (5) are single components with internal parts. Ticket 03 replaced the unit of measure: a folder is an **exported unit**. |
| "The following are exempt … **Next.js Convention Files**" | Names files but not *which rules* they escape. It exempts Atomic Structure and Colocation only — never function style. `SpecialistsWrapper` in `perangkat/page.tsx` drifted through exactly this hole. |
| "**Arrow Functions:** Always write functions and components in arrow-format" | No exception for generics. `DataTable<TData, TValue>` in a `.tsx` needs a parser workaround (`<TData,>` or `extends unknown`) because `<TData>` parses as JSX. The workaround is uglier than what it fixes. |

A fourth gap has no single wrong sentence — it is an **omission**: nothing said
where shared authorization belongs. That silence let a byte-identical
`checkAccess()` reach five files unflagged (ticket 02). → §8.

### 3. Scope

Rules govern **component code**: `src/app/**/_components/` and
`src/components/`. Not dashboard-scoped — `(main)` measured as the *most*
compliant area (~25 folders, all barrelled, all kebab-case, zero `index.tsx`),
so scoping to the dashboard would license the cleanest area to drift.

`src/lib/` keeps its own flat per-domain convention and is out of scope
(see §1).

### 4. A folder is an exported unit

> A component folder is **one unit exported through its barrel**. Sibling
> `.tsx` files are legitimate as long as they are consumed only by their
> sibling parent. The moment a file is imported from outside its folder, it
> graduates to its own folder with its own barrel.

Replaces "One component or function per folder". Consequence, unchanged from
ticket 03: **none of the 7 "flattened" folders are split** — they were never
drift.

### 5. Barrels

Required on **every folder containing `.tsx`**, no exceptions.

**Grouping folders are exempt** — a folder holding only other component
folders is not an exported unit and needs no barrel. Defined by *content, not
name*, so it stays true as the tree grows. Current instances: `base-ui/`, `ui/`,
and `src/components/` itself once §0c lands.

Rejected: requiring grouping barrels. They are the barrel most likely to rot —
someone adds a component, forgets to register it, and the failure is silent —
and they buy nothing, because §6's violation shape does not depend on them.

### 6. Cross-route imports — stated mechanically

Ticket 03 rested the whole case for universal barrels on violations being
**greppable**. That claim is load-bearing enough to be discharged here rather
than deferred to ticket 06 — if it could not be written as a matchable pattern,
universal barrels would collapse into mere tidiness.

> An import violates if its path enters another route's `_components/` **and**
> points deeper than that component's folder. Relative paths and the `~/` alias
> are the same violation in two spellings.
>
> ✗ `../../kader/_components/MembersPageContent`
> ✗ `~/app/(dashboard)/dashboard/kader/_components/add-form/action`
> ✓ `~/app/(dashboard)/dashboard/kader/_components/bulk-upload`

Both spellings are named deliberately: ticket 01 found **three of five**
reach-ins escaped the original audit because only relative paths were grepped.

Ticket 06 now chooses an *enforcer* (ESLint rule, CI script, manual grep) — it
no longer has to work out *what* is being enforced.

### 7. Ownership

**Promotion bar — generic AND used by 2+ routes.** Both, not either. "2+ routes"
alone would promote `MembersPageContent`; "generic" alone grows
`src/components/` ahead of demand. The pair is exactly what separates
`RegionCombobox` (promotes) from `MembersPageContent` (does not).

**Owning route + sanctioned consumers** — new vocabulary, the thing the old
colocation rule could not express:

> Shared code may deliberately stay inside its **owning route**'s
> `_components/` when it is too route-shaped for `src/components/`. Other
> routes are then **sanctioned consumers**: they import through the folder
> barrel and nothing else. Ownership stays with the route; consumers acquire no
> say over its shape.

Reference: `MembersPageContent` is owned by `kader`, consumed by `alumni` and
`perangkat`.

### 8. Authorization

The `action.ts`-per-component rule **stands as written** — ticket 02 confirmed
these files are co-located, not shared. What is added is the missing sentence:

> Shared **authorization** logic lives in `src/lib/auth/` and is never
> duplicated across route-level action files. `readActiveSession` is the only
> sanctioned way to read a session.

Do not claim a speedup for this: ticket 02 checked the Next.js docs and
**withdrew** the performance argument — React `cache()` memoizes within a render
pass, and Server Actions run in a separate phase. The case is that one
`root`/`humas` rule copied three times must be edited in three places.

### 9. Files that may sit at a `_components/` root

Extends ticket 02, which ruled root-level `action.ts` a violation.

> A companion file may sit at a `_components/` root **only if it is free of
> side effects** — types and constants only; no `'use server'`, no session
> read, no DB access. Prefix it `_`. Anything that *does* something belongs to
> one component folder.

`articles/_components/_constants.ts` has exactly this shape, and `articles` is
the reference implementation — a rule that makes the reference
non-compliant is the rule that is wrong. Ticket 02's verdict was never about
location: what made root-level `action.ts` dangerous was three copies of an
authorization rule needing lockstep edits. That is a claim about behaviour, and
a constants module cannot trigger it.

### 10. Filenames

- **kebab-case**, always.
- **No `index.tsx`** — the implementation file is `<folder-name>.tsx`;
  `index.ts` is a barrel and nothing else.
- **Sibling names are domain-specific, not role-generic.** A name stating only
  its role (`form`, `card`, `list`, `item`, `content`, `wrapper`) takes its
  parent component's name as a prefix.
- **Sanctioned idioms**: `columns.tsx` (TanStack column defs, 4 folders) and
  `*-client.tsx` (RSC/client boundary, 6 folders). The latter is a role suffix,
  but the role it names is a rendering boundary.
- React component identifiers stay **PascalCase**. Only the *filename*
  convention is at issue — `MembersPageContent` the component keeps its name;
  `MembersPageContent.tsx` the file does not.

### 11. Companion files

Documented list, `schema.ts` added: `index.ts`, `action.ts`, `data.ts`,
`schema.ts` (Zod schemas, split from `action.ts` when they earn their own file),
`store.ts`, `types.ts`, `constants.ts`, `utils.ts`, `*.test.ts`.

**`_data/` — route-level cached reads.** A `_data/` folder at a route or route-group
root holds `'use cache'` read functions shared by that route's pages. Undocumented
until now despite being what commit `fdd609a` routed `page.tsx` DB reads through.
It is the sanctioned home for the `cacheTag` half of the
`cacheTag`/`updateTag` pairing; `action.ts` keeps `updateTag`.

### 12. Arrow-function exception

> Generic components in `.tsx` may use function declarations, because generic
> arrow syntax requires a parser workaround (`<T,>` or `extends unknown`).
> Reference: `DataTable<TData, TValue>`.

And the boundary the old exemption list left unstated:

> The Next.js convention-file exemption covers **Atomic Structure and
> Colocation only**. `page.tsx`, `layout.tsx` and friends are *not* exempt from
> the arrow-function rule.

### 13. Reference implementations

- **`articles`** — folder shape, barrels, `schema.ts`, per-component `action.ts`.
- **`(main)`** — the naming and barrel rules at scale; measured fully compliant.
- **`src/components/region-combobox/`** (once promoted) — what clearing the
  promotion bar looks like.
- **`kader/_components/members-page-content/`** (once foldered) — owning route
  + sanctioned consumers.

### Conflicts checked

This ticket was the first read of all four decisions as one document. Two
conflicts surfaced, both in §1 — "no exceptions" vs. grouping folders, and
"repo-wide" vs. `src/lib/`. Both were in ticket 03, both from measuring only
`src/app/**/_components/`, and both are resolved above. No conflict was found
between tickets 01, 02 and 03.

### Execution load added by this ticket

2 bare `src/components/` files → folders + barrels (§0c). Everything else is
text. Ticket 03's measured load stands otherwise unchanged.

### Not decided here

The enforcement *mechanism* — ticket 06 picks the tool. §6 hands it a violation
pattern to enforce rather than a prose rule to interpret.

**Applying this diff to the real `AGENTS.md` belongs to the execution effort.**
This map produces decisions, not code, and `AGENTS.md` is live instruction for
every session in this repo — editing it here would change agent behaviour
mid-map.
