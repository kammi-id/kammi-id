# 01 — Barrel & file shape: route component folders

**What to build:** Every component folder under a route's `_components/`
directory becomes an exported unit — an implementation file named for its
folder, reached through a barrel. A developer importing any of these components
gets one obvious path and never has to guess an internal filename.

Nine mechanical items, one repeated pattern:

- Four folders whose implementation file is named `index` are renamed to match
  their folder, and each gains a barrel that re-exports it.
- Two folders that have no barrel gain one.
- Three component files sitting bare at a `_components/` root are promoted into
  their own folders with barrels. One of them also needs a kebab-case rename.

**Blocked by:** None — can start immediately.

**Status:** done — 94a0ca5

Two of the promoted components — the member-page composite and the specialist
summary — are consumed by other routes. Their barrels are what make ticket 03
possible, so this ticket must land before any import is repointed.

Every importer of the renamed folders already targets the folder rather than the
file, so this ticket should change **zero** call sites. If you find yourself
editing an import, stop and re-check: either the barrel is wrong, or you have
found a case this ticket did not anticipate.

Files prefixed to mark them side-effect-free (types and constants only) are
**not** violations and stay where they are.

- [ ] No component folder under a route `_components/` has an implementation
      file named `index` — `index.ts` is a barrel and nothing else
- [ ] Every component folder under a route `_components/` exposes a barrel
- [ ] No bare component file sits directly at a `_components/` root
- [ ] All affected filenames are kebab-case; React component identifiers keep
      their PascalCase names
- [ ] The member-page composite and the specialist summary are each reachable
      through a barrel
- [ ] No import statement anywhere in the repo was modified
- [ ] The type check passes
- [ ] The existing test suite passes unchanged
