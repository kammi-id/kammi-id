# 06 — Enforce the conventions mechanically

**What to build:** Breaking a structural convention fails CI. A developer who
reaches into another route's internals, forgets a barrel, or names a file wrong
learns it from the build rather than from review — and the drift this whole
effort cleaned up cannot silently return.

Two enforcers, split by what each rule actually is:

- **Cross-route imports** → the existing lint setup's restricted-import
  patterns. No new dependency.
- **Barrel presence, implementation-file naming, bare files at a component
  root, kebab-case** → one structure-checking script run in CI. These are
  filesystem questions and a linter cannot see a *missing* file, so they are one
  script doing one tree walk, not four separate checks.

**Blocked by:** 05 — AGENTS.md is the specification this tooling encodes.

**Status:** ready-for-agent

**Land it warn-only, then flip it to error inside this same ticket.** Install the
tooling as a warning, read its output as the worklist, clear whatever it finds,
then flip to error once it reports nothing. The window between warn and error is
one ticket — long enough to avoid blocking anyone on day one, short enough that
drift cannot creep back. Do not leave it warning permanently; a permanent warning
is how this problem arose.

**Function style is deliberately not enforced.** Ticket 05 fixes the only three
violations, and an AST rule would have to encode the generics exception to catch
three one-line files. If they recur, revisit — do not pre-emptively build it.

**Two exemptions the script must implement**, both invisible to a naive glob and
both already the cause of false positives in measurement:

- **Grouping folders** — folders holding only other component folders — need no
  barrel. Test by *content*, never by name, so the rule stays true as the tree
  grows.
- **Prefixed side-effect-free files** (types and constants at a component root)
  are exempt from the bare-file and naming rules. A naive kebab-case check
  reports four violations of which three are sanctioned, including one in the
  reference implementation. **A rule that cries wolf on the reference
  implementation gets deleted within a month** — verify against the real tree
  before wiring it into CI.

**The import rule is deliberately over-strict.** It bans deep relative component
imports outright, which also forbids a route from deep-importing its own folder —
not harmful in itself. A pattern matcher cannot tell a route's own directory from
another's, and ownership-aware matching would need real path resolution: roughly
eighty lines plus its own tests, to guard around two dozen imports in a codebase
with a thin test suite. The strict form keeps the rule a one-liner and costs one
already-fixed edit. If it ever obstructs real work, *then* build the resolving
rule.

- [ ] Reaching into another component folder past its barrel fails the lint step
- [ ] Both the relative and the aliased spelling of that violation are caught
- [ ] Importing a component through its barrel across routes still passes
- [ ] A structure script checks barrel presence, implementation-file naming,
      bare files at a component root, and kebab-case
- [ ] The script exempts grouping folders, detected by content rather than name
- [ ] The script exempts prefixed side-effect-free files
- [ ] The script reports **zero** violations against the restructured tree — in
      particular, none in the reference implementation
- [ ] Both enforcers run in CI and fail the build on violation
- [ ] Lint, format check, type check and the full test suite all pass
