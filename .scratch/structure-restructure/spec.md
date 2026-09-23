# Spec: Structure & convention restructure (I1 execution)

Status: done — keenam tiketnya mendarat (94a0ca5, 3b627a8, 21ace5a, b296524,
f9b5123, 82be4b7). `check:structure`, `check:lint`, dan `check:types` ketiganya
hijau di CI.

Collapses the six resolved decision tickets of
`.scratch/structure-convention/map.md` into a buildable plan. That map decided;
this spec builds. Every decision below is already settled — if this spec and a
ticket disagree, the ticket wins and this spec is wrong.

## Problem Statement

Developers and coding agents working in this codebase cannot tell what the
conventions are, because the written conventions and the actual tree disagree.

Concretely, someone adding a component today faces:

- **AGENTS.md says "One component or function per folder"**, but the reference
  implementation (`articles`) has folders with five files in them. So the rule
  is either wrong or universally ignored, and a newcomer cannot tell which.
- **No stated rule about reaching into another route's internals**, so five
  imports now point at files deep inside other routes' component folders. Two
  of them import another route's `action.ts` directly.
- **The same authorization check, copy-pasted into three files.** A change to
  who may edit site settings currently requires three synchronised edits, and
  nothing anywhere says where shared authorization is supposed to live.
- **An exemption list that names files but not which rules they escape.** A
  component drifted to a non-standard function style through exactly that gap.
- **Nothing mechanical checks any of it.** Drift is found by reading, which is
  why it accumulated silently until an audit went looking.

The cost is not aesthetic. It is that every new feature copies whichever nearby
pattern it happens to land next to, and the conventions drift further from the
document that is supposed to define them.

## Solution

Bring the tree and the written conventions into agreement, then make the
agreement mechanically enforced so it stays true.

Four sequential commits:

- **A — File shape.** Every component folder becomes an exported unit with a
  barrel. Renames and new re-export files only.
- **B — Import boundaries.** The imports reaching into other routes' internals
  are repointed at barrels.
- **C — Authorization.** The three copied access checks collapse into one shared
  helper built on the existing session reader, covered by a test.
- **D — Convention and enforcement.** AGENTS.md is rewritten to match the tree;
  lint rules and a structure script begin failing CI on regressions; the type
  check is finally wired into CI.

Afterwards a developer can read AGENTS.md, trust it, and have CI tell them when
they have broken it.

## User Stories

1. As a developer new to this codebase, I want AGENTS.md to describe the tree I
   actually see, so that I can trust it instead of pattern-matching on whatever
   file I opened first.
2. As a coding agent starting a session, I want the conventions stated
   unambiguously, so that I do not propagate drift into every new feature I
   write.
3. As a developer adding a component, I want one stated rule for where it goes,
   so that I do not have to infer it from three inconsistent neighbours.
4. As a developer importing shared code, I want every component folder to expose
   a barrel, so that I have one obvious import path rather than guessing at
   internal filenames.
5. As a developer, I want reaching into another route's internals to be a
   visible error, so that I do not create a coupling nobody intended.
6. As a maintainer of the `kader` route, I want other routes to consume my
   components only through the barrel, so that I can restructure the internals
   without breaking `perangkat` and `alumni`.
7. As a developer on the `perangkat` route, I want a sanctioned way to consume
   `kader`'s member-page composite, so that I am not forced either to duplicate
   it or to reach into a private file.
8. As a security-conscious maintainer, I want the `root`/`humas` access rule for
   site settings written once, so that tightening it cannot leave two stale
   copies behind.
9. As a developer changing who may edit site settings, I want to edit one file,
   so that I cannot half-apply the change.
10. As a reviewer, I want the authorization consolidation to arrive as its own
    commit containing only deletions and one new export, so that any behavioural
    change is visible as an anomaly in the diff.
11. As a user editing my own account, I want my account actions to keep working
    without an organisational role, so that the consolidation does not
    accidentally gate self-service behind an admin privilege.
12. As a developer, I want the shared authorization helper named for the
    privilege it grants, so that I am not tempted to reuse it for a check that
    is merely authentication.
13. As a developer, I want the shared helper built on the existing session
    reader, so that there is one sanctioned way to read a session rather than
    two.
14. As a developer running the test suite, I want the role gate covered by a
    test, so that a future edit that widens it fails loudly.
15. As a developer, I want a component's implementation file named after its
    folder, so that my editor's file switcher shows me distinct names instead of
    a column of `index`.
16. As a developer scanning a folder, I want `index.ts` to mean "barrel and
    nothing else", so that I know where the implementation is without opening
    anything.
17. As a developer, I want filenames in one consistent case, so that imports do
    not break when the repo is checked out on a case-insensitive filesystem.
18. As a developer, I want sibling files named for their domain rather than
    their role, so that `form.tsx` in twelve folders stops being twelve
    different things with one name.
19. As a developer using TanStack Table, I want `columns.tsx` to remain a
    sanctioned name, so that a widely-understood idiom is not renamed for
    consistency's sake.
20. As a developer writing a generic component, I want to keep a function
    declaration, so that I do not need a parser workaround to satisfy a style
    rule.
21. As a developer writing a `page.tsx`, I want to know the convention-file
    exemption does not excuse me from the function-style rule, so that I do not
    repeat the drift that started this.
22. As a developer grouping related components in a folder, I want that folder
    exempt from needing a barrel, so that I am not forced to maintain a
    registry that silently rots when someone forgets to add to it.
23. As a developer, I want `src/lib/` left alone, so that a rule aimed at
    component code does not churn thirty-six unrelated import sites.
24. As a developer, I want the conventions to apply to the public-facing routes
    too, so that the cleanest area of the codebase is not licensed to drift.
25. As a developer opening a pull request, I want CI to fail when I break a
    structural convention, so that I learn it from the build rather than from
    review.
26. As a reviewer, I want structural violations caught mechanically, so that I
    can spend review attention on behaviour.
27. As a developer, I want the enforcement to warn before it errors, so that
    turning it on does not block everyone's work on day one.
28. As a developer, I want the structure checker's output to double as the
    restructuring worklist, so that I know when the migration is finished.
29. As a developer, I want the type check to run in CI, so that the guard this
    whole effort depends on is not merely a thing people remember to run.
30. As a developer, I want the type checker to catch every file-move mistake, so
    that a thin test suite is not the only thing standing between me and a
    broken build.
31. As a developer, I want the restructure split into reviewable commits, so
    that a large uniform rename does not hide a subtle behavioural change.
32. As a developer, I want barrels to exist before imports are repointed at
    them, so that no commit in the sequence leaves the tree failing to compile.
33. As a developer, I want the caching layer's read/write split preserved, so
    that the restructure does not break the revalidation behaviour retrofitted
    earlier.
34. As a developer, I want AGENTS.md changed only in the final commit, so that
    the instructions guiding my session do not shift underneath me mid-effort.
35. As a maintainer, I want the reference implementations named in the
    conventions, so that "do it like this" points at real code.

## Implementation Decisions

### Scope

Rules govern **component code**: route-level `_components/` directories and the
shared component root. `src/lib/` keeps its flat per-domain convention and is
out of scope. Rules are not dashboard-scoped — the public-facing route group
measured as the most compliant area, so exempting it would license the cleanest
code to drift.

### The unit of organisation

A component folder is **one unit exported through its barrel**. Sibling files
are legitimate as long as they are consumed only by their sibling parent; the
moment a file is imported from outside its folder, it graduates to its own
folder with its own barrel. This replaces "one component or function per
folder", which the reference implementation never obeyed.

Consequence: the seven so-called "flattened" folders are correct as they stand
and are **not** split.

### Barrels

Required on every folder that directly contains a component file. **Grouping
folders** — folders holding only other component folders — are exempt, because
they are not exported units. The exemption is defined by *content, not name*, so
it stays true as the tree grows. Requiring grouping barrels was rejected: they
are the barrel most likely to rot silently, and the import rule does not depend
on them.

### Cross-route imports

An import is a violation if it resolves into a component directory that is not
the importer's own and does not terminate at a direct child of that directory.
Relative and aliased spellings are the same violation; three of five known
reach-ins escaped an earlier audit because only relative paths were searched.

Two module-level decisions follow:

- **Owning route + sanctioned consumers.** Shared code may deliberately stay
  inside its owning route when it is too route-shaped to promote. Other routes
  become sanctioned consumers: they import through the barrel and nothing else.
  Ownership stays with the route; consumers acquire no say over its shape.
- **Promotion bar: generic AND used by two or more routes.** Both conditions,
  not either. "Two or more routes" alone would promote a route-shaped composite;
  "generic" alone grows the shared root ahead of demand.

### Authorization

The shared helper lives in the auth module and is built on the **existing
session reader**, which is already request-cached and already has ~40 callers.
The three copied checks are byte-identical, and their session-reading half is
character-for-character the existing reader — so this is a **move, not a
rewrite**. What the copies add on top is a role comparison and an organisation
extraction; that tail is the only new code.

Two constraints:

- **The helper is named for the privilege it grants**, not for the act of
  checking. A generic name is what would invite misuse.
- **Account self-service is not folded in.** Those actions check
  *authentication* only, with no role comparison, which is correct for a user
  editing their own record. It is not a variant of the shared rule; it is a
  different kind of check.

Do not claim a performance benefit for the consolidation — the request-cache
argument was examined and withdrawn. The case is that one rule copied three
times must be edited in three places.

### Companion files

Documented conventions: barrel, action, data, schema, store, types, constants,
utils, tests. A route-level `_data/` folder holds the cached read functions and
is the sanctioned home for cache tagging; the action layer keeps cache
invalidation. This split must survive the restructure.

A companion file may sit at a `_components/` root **only if it is free of side
effects** — types and constants only, prefixed to mark it as such. Anything that
*does* something belongs to a component folder. This is why a root-level action
file is a violation while a root-level constants file is not.

### Naming

Kebab-case filenames throughout. No `index` implementation files — the
implementation is named for its folder and `index.ts` is a barrel only. Sibling
names are domain-specific rather than role-generic. Sanctioned idioms: the
TanStack column-definition file, and the client-boundary suffix. React component
identifiers stay PascalCase — only the *filename* convention is at issue.

### Function style

Arrow functions throughout, with one exception: **generic components may use
function declarations**, because generic arrow syntax in a `.tsx` file needs a
parser workaround uglier than the problem it solves.

The convention-file exemption covers structure and colocation **only**. Route
convention files are not exempt from the function-style rule; leaving that
boundary unstated is how the original drift happened.

### Enforcement

Split by rule rather than forced onto one tool:

- **Cross-route imports** → the existing ESLint setup's restricted-import
  patterns. No new dependency.
- **Barrel presence, implementation-file naming, bare files at a
  `_components/` root, kebab-case** → a single structure-checking script run in
  CI. These are filesystem questions, and a linter cannot see a *missing* file.
  One script, one tree walk, because they are all the same question asked of one
  directory listing.
- **Function style** → **not enforced.** Only three violations exist, all in
  route convention files, all fixed once by this effort. An AST rule would have
  to encode the generics exception to catch three one-line files.

The import rule bans **deep relative** component imports outright, which is
stricter than strictly necessary: a glob cannot tell a route's own directory
from another's, so ownership-aware matching would need real path resolution. The
stricter form costs exactly one already-scheduled edit. A custom resolving rule
was rejected as more untested tooling than the problem justifies.

The structure script must special-case two things, both invisible to a naive
glob: **grouping folders** are exempt from needing barrels, and
**prefixed side-effect-free files** are exempt from the bare-file and
kebab-case rules. A naive check reports four naming violations of which three
are sanctioned — including one in the reference implementation. A rule that
cries wolf on the reference gets deleted within a month.

### Sequencing

Four commits, ordered by **dependency, not comfort**:

| Commit | Contents |
| --- | --- |
| **A** | Implementation-file renames, missing barrels, bare files promoted to folders, one sibling rename |
| **B** | Repoint the deep cross-route imports at barrels |
| **C** | Consolidate the three access checks into the shared helper, with its test |
| **D** | AGENTS.md rewrite; enforcement tooling; wire the type check into CI; flip enforcement warn → error |

A must precede B because an import cannot point at a barrel that does not exist
yet. This is also the one place the mechanical pass and the ownership decision
meet: the member-page composite and the specialist summary get their barrels in
A, and the routes consuming them are repointed in B — deliberately split so the
barrel exists before anything targets it.

Splitting A per-area was rejected: it multiplies commits without changing what a
reviewer verifies, since A is one pattern repeated about a dozen times.

**AGENTS.md is untouched until D.** It is live instruction for every session in
this repo; editing it mid-effort would change agent behaviour underneath the
earlier commits.

**Enforcement lands warn-only at the start of D** so the script's output serves
as the worklist, and flips to error at the end of D once the tree is clean.
Landing it as an error first would fail the build on known violations; landing
it after risks it never landing.

### Measured load

Nineteen items. Note that the earlier "four renames" and "seven new barrels"
counts **overlap** — four folders need both, and the same edit clears both. Real
barrel-only additions: two. The generic data-table component is explicitly **not
changed**; it is the sanctioned function-declaration exception.

## Testing Decisions

**What makes a good test here:** assert externally observable behaviour — what
an action returns or refuses to do for a given session — never which helper it
called or how it read the cookie. The restructure must be invisible to the test
suite; a test that breaks because a file moved was testing the wrong thing.

**The seam: one, and it already exists.** Four action tests already stub the
session reader at the auth-module boundary and drive actions with a fabricated
session, including assertions on the `root`/`humas` roles. No new seam is
introduced. This is the highest available seam — one module boundary covering
every access check in the codebase.

**What gets tested: the shared authorization helper only.** One test file
asserting the role gate:

- a `root` session resolves to the caller's organisation
- a `humas` session resolves likewise
- a non-privileged role is refused
- an absent session is refused
- a session lacking a connected organisation is refused

Testing the three site-settings action files individually was rejected: they
export twelve actions between them, and the helper test covers the gate all
twelve share. Broad action coverage belongs to the separate testing-gap effort,
not to this restructure.

**No new tests for commits A, B, or D.** Every item is a rename or a re-export
fully covered by the type checker, which commit D wires into CI. Writing tests
to guard verbatim file moves would spend the testing budget on the safest part
of the effort.

**Prior art:** the bulk-upload and delete-member action tests are the closest
models — same seam, same session-fabrication pattern, same role assertions,
including database truncation between cases. Follow their shape.

**Browser verification:** not required for A through C, none of which changes
rendered output. Do one manual dashboard login after D, which is where the
function-style conversions to route convention files land. Credentials are not a
blocker: the seed script writes a credentials file on every run. Note that the
existing end-to-end test is not cover here — despite its name it only asserts
the public home page's title and exercises no login flow.

## Out of Scope

- **Broad action-layer test coverage.** Roughly fifteen action files have no
  tests. That is a known separate concern; this spec adds exactly one test file
  and deliberately does not open that backlog.
- **Restructuring `src/lib/`.** Consistently flat, out of scope by decision.
- **Splitting the seven multi-file component folders.** Ruled correct as they
  stand — they were never drift.
- **Changing the generic data-table component's function style.** A sanctioned
  exception, not a violation.
- **A pre-commit hook.** No hook manager exists in the repo, and introducing one
  is a tooling decision beyond this effort. CI closes the loop.
- **Any behavioural change to authorization.** The role gate must mean exactly
  what it means today. This effort moves it; it does not tighten or loosen it.
- **Changing the caching architecture.** The read/write tag split is a
  constraint to preserve, not a thing to revisit.

## Further Notes

**On the map's recurring lesson.** Six decision tickets each overturned at least
one claim they inherited — an authorization leak that turned out to be misread,
a performance rationale that did not survive the docs, drift counts overstated
three- to fourfold, and a violation pattern that could not tell a route's own
directory from another's. Twice the overturned claim was the map's *own* prior
decision. The habit that produced those corrections is worth carrying into
execution: **measure the tree before acting on a number in this document.**

The load figures here are measured, but they were measured on a specific commit.
Re-count before relying on them.

**Two counts in the source tickets are known to be wrong** and are corrected
here: the copied access check appears in three files, not five (an earlier
ticket conflated it with the two account self-service session reads), and the
rename and barrel counts overlap rather than summing.

**A pre-existing gap this effort closes incidentally.** CI never ran the type
check, despite the script existing. The whole restructure leans on the type
checker as its primary guard, so wiring it in is arguably the single
highest-value line in commit D — and it enforces nothing this map decided.

**The strictest enforcement rule is deliberately over-strict.** Banning deep
relative component imports outright forbids a route from deep-importing its own
component folder, which is not itself harmful. It costs one edit today and keeps
the rule a one-liner. If it ever becomes obstructive, the escape hatch is a real
resolving rule — but do not build that until the pain is real.
