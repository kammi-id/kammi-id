# 04 — Consolidate the site-settings authorization check

**What to build:** The rule for who may edit site settings is written once. A
maintainer tightening or widening that rule edits one file and it takes effect
everywhere, instead of editing three copies and hoping none was missed.

Three site-settings action files currently define a byte-identical access check
privately. They collapse into one shared helper in the auth module, covered by a
test asserting the gate.

**Blocked by:** None — can start immediately.

**Status:** done — b296524

This is deliberately independent of tickets 01–03: it touches different files
and a different concern, so it can run in parallel with the file-shape work.

**This is a move, not a rewrite.** The copied check's session-reading half is
character-for-character the existing session reader, which is already
request-cached and already has around forty callers. Build the helper on that
reader. What the copies add on top is a role comparison and an organisation
extraction — that tail is the only genuinely new code, and it must mean exactly
what it means today. This ticket does not tighten or loosen the gate.

**Keep the diff deletions-only plus one new export.** Any behavioural change then
shows up as an anomaly a reviewer can see. If the diff starts growing new logic,
something has gone wrong.

**Do not fold in account self-service.** Those actions check authentication only,
with no role comparison — correct for a user editing their own record. They are
not a variant of this rule and must be left alone.

**Name the helper for the privilege it grants**, not for the act of checking. A
generic name is exactly what would invite someone to reuse it for a check that is
merely authentication.

Do not claim a performance benefit for this change — that rationale was examined
against the framework docs and withdrawn. The case is duplication, not speed.

- [ ] One shared helper in the auth module expresses the site-settings gate
- [ ] The helper is built on the existing session reader, not on a fresh cookie
      read
- [ ] The helper's name states the privilege it grants
- [ ] All three site-settings action files use it; no private copy remains
      anywhere in the codebase
- [ ] Account self-service actions are unchanged
- [ ] A test asserts: a privileged role resolves to the caller's organisation
      (both privileged roles covered), a non-privileged role is refused, an
      absent session is refused, and a session with no connected organisation is
      refused
- [ ] The test stubs the session at the existing auth-module seam, following the
      pattern of the existing action tests
- [ ] The type check passes
- [ ] The full test suite passes
