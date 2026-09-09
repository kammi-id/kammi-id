# 05 — Wire the type check into CI and rewrite AGENTS.md

**What to build:** Two things that together make the conventions trustworthy: CI
starts running the type check, and AGENTS.md starts describing the tree that
actually exists.

A developer opening a pull request gets type errors from the build rather than
from a colleague. A developer reading AGENTS.md can act on it without
cross-checking against the code.

**Blocked by:** 01, 02, 03, 04 — AGENTS.md must describe the finished tree, and
the type check should go green on the restructured code.

**Status:** done — f9b5123

**The CI gap is the higher-value half.** The type checker is the primary guard
for this entire effort, and CI has never run it despite the script existing. It
currently holds only when someone remembers to run it locally. Adding the step is
one line and it enforces nothing this effort decided — do it regardless of how
the AGENTS.md rewrite goes.

**AGENTS.md is a rewrite of its organisation section, not an amendment.** The old
section's *shape* is what let the drift through: its exemption list names files
without naming which rules they escape, and a component drifted through exactly
that hole. Adding another bullet to a broken frame repeats the mistake.

The full decided text is in the source decision ticket on the AGENTS.md
amendment. Carry it across rather than re-deriving it; every decision in it was
settled deliberately. The parts most easily got wrong:

- The organisation unit is an **exported unit**, not one file per folder.
- Barrels are required on component folders, with **grouping folders exempt** —
  defined by content, not by name.
- Scope is **component code**; the library directory keeps its flat convention.
- Rules are **not** dashboard-scoped — the public-facing routes are included.
- The convention-file exemption covers structure and colocation **only**. Route
  convention files are *not* exempt from the function-style rule.
- Generic components may use function declarations. The generic data-table is
  the reference case and is **not** to be converted.

This ticket also fixes the three route convention files that use function
declarations without being generic — the only real function-style violations in
the codebase. Ticket 06 deliberately does not enforce this rule, so this is the
one and only pass over it.

AGENTS.md is live instruction for every session in this repo, which is why it is
touched here and not earlier: editing it sooner would change agent behaviour
underneath tickets 01–04.

- [ ] CI runs the type check on pull requests
- [ ] The organisation section of AGENTS.md is rewritten, carrying the decided
      text across
- [ ] The exemption list states which rules each exemption covers
- [ ] The generics exception to the function-style rule is documented, and the
      data-table is named as the reference case
- [ ] Reference implementations are named for folder shape, naming at scale,
      ownership, and the promotion bar
- [ ] The three non-generic function-declaration components are converted to
      arrow functions; the generic data-table is untouched
- [ ] The type check, lint, format check and full test suite all pass
- [ ] A manual dashboard login confirms the converted components still render
