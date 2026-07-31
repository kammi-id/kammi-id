# Who owns the cross-route shared components?

Type: grilling
Status: open

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

That last row is the sharp end: `profile` invokes a **server action** owned by
`kader`. That is an authorization-relevant boundary, not just a file-location
smell — an action written against kader's assumptions is being called from a
route with a different access profile.

Decide, per category (page-level composite / leaf UI widget / server action):

1. Does the shared thing get **promoted** to `src/components/` (and actions to
   `src/lib/` or a shared `_actions`), or does the owning route **keep** it and
   callers grow their own?
2. If promoted — what is the promotion bar? "Used by 2+ routes" is the obvious
   rule but would also drag in things that are only coincidentally similar.
3. Does the answer differ for the server action versus the UI components, given
   the authorization angle?
4. Is the `~/` alias itself part of the problem — it makes a reach-in look like
   a legitimate shared import at the call site. Should cross-route `~/app/...`
   imports be treated as a distinct violation?

Note `MembersPageContent.tsx` is 355 lines and serves 3 routes; whatever is
decided here is the largest single piece of the eventual execution effort.

## Answer

_unresolved_
