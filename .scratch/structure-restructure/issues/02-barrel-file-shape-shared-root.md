# 02 — Barrel & file shape: shared component root

**What to build:** The two components sitting as bare files at the shared
component root become proper folders with barrels, matching every other
component in the codebase. Both are widely used — around nine and ten importers
each — and every one of those importers keeps working untouched.

**Blocked by:** None — can start immediately.

**Status:** done — 3b627a8

The import paths do not change: a consumer importing the component by its name
resolves to the folder's barrel exactly as it previously resolved to the file.
That is the whole point of the barrel, and it is why a change with twenty
importers costs zero import edits.

Both components clear the promotion bar comfortably (generic, and used by far
more than two routes), so they belong at the shared root. Only their file shape
is wrong.

The shared component root **itself** is a grouping folder — it holds only other
component folders — and correctly needs no barrel of its own. Do not add one.

- [ ] Each of the two components lives in its own folder with a barrel
- [ ] No bare component file remains directly at the shared component root
- [ ] The shared component root has no barrel of its own
- [ ] No import statement anywhere in the repo was modified
- [ ] The type check passes
- [ ] The existing test suite passes unchanged
