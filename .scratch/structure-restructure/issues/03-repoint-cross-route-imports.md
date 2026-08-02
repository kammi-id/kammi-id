# 03 — Repoint cross-route imports at barrels

**What to build:** No file in the codebase reaches into another route's
component internals. The imports that currently do are repointed at the owning
folder's barrel, so a route maintainer can restructure their internals without
breaking a consumer they never knew about.

Four imports move:

- Two reach into a `kader` component's internal action and store files from
  other routes.
- One reaches past the shared data-table's barrel at the dashboard level.
- One reaches into a sibling's internal column definitions by relative path.

**Blocked by:** 01 — the barrels those imports will target are created there.

**Status:** ready-for-agent

This is where the barrel-only rule becomes real, and it is the one place the
mechanical pass and the ownership decision meet.

Two things worth knowing before you start:

**The dashboard-level shared component directory is legitimate.** It belongs to
a route group rather than a single route, so every import of it is cross-route
*and* sanctioned. Only the one that points *past* its barrel is a violation.

**A route importing its own `_components/` by relative path is fine today**, and
there are several such imports. Ticket 06 will ban the deep form of that
spelling outright — but the only such case is the column-definition import
already listed above. Do not go hunting for others.

If an internal file turns out to have no barrel to import through, that is a
gap in ticket 01, not a licence to reach in. Go back and add the barrel.

- [ ] No import resolves into a component directory it does not own and points
      deeper than a direct child of that directory
- [ ] The routes consuming the member-page composite reach it through its barrel
- [ ] The shared data-table is imported through its barrel
- [ ] The column-definition import targets a barrel rather than an internal file
- [ ] No component's public surface changed — only the paths used to reach it
- [ ] The type check passes
- [ ] The existing test suite passes unchanged
