# What exactly changes in AGENTS.md?

Type: grilling
Status: open
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

Watch for the case where the decisions conflict with each other in wording even
though they were individually sensible — this ticket is the first time all three
are read as one document, and is the place to catch that.

If it turns out the section needs a structural rewrite rather than amendments,
say so here; that possibility is currently sitting in the map's
**Not yet specified**.

## Answer

_unresolved_
