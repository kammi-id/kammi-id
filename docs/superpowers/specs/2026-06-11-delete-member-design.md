# Delete Member (Soft Delete) — Design

## Goal

Allow `root` and `bpk` (within their organization scope) to permanently remove a member
from the dashboard, with explicit type-to-confirm protection, from the member detail
page (`/dashboard/profile/[registerNumber]`).

## Behavior

1. A "Hapus Anggota" (destructive) button is added to a new "Danger Zone" section at
   the very bottom of the member detail page.
2. Visibility:
   - `root`: always visible.
   - `bpk`: visible only if the member's organization is within the user's scope
     (`isOrgInScope`).
   - All other roles: not visible.
3. Clicking the button opens a confirmation dialog (AlertDialog + Input, following the
   pattern in `reset-password-button.tsx`):
   - Shows the member's name and register number (NIA).
   - Requires the admin to type the exact register number into a text field.
   - The confirm button stays disabled until the typed value matches exactly.
4. On confirm, a server action re-validates everything (session, role, scope, register
   number match) and performs a soft delete:
   - Sets `member.deleted_at = now()`.
   - Deletes the `user` row(s) where `connected_member_id = member.id` (login account
     removed — onDelete cascade on `user` cleans up sessions etc.).
5. On success: revalidate relevant caches/paths, redirect to `/dashboard/kader`, show a
   success toast.
6. Soft-deleted members:
   - Excluded from `readMember` (listing) results by default.
   - `readMemberByRegisterNumber` returns `null` for them, so direct profile access
     results in `notFound()`.
   - Related records (training history, academic, career, organization history) are
     NOT deleted — they remain in the DB but become unreachable via the UI. No restore
     UI is provided in this iteration; restoration (if ever needed) is a manual DB
     operation by `root`.

## Schema Change

`src/db/schema/member.sql.ts`: add nullable column

```ts
deletedAt: t.timestamp('deleted_at')
```

Generate a drizzle migration for this change.

## Data Layer (`src/db/query/member.ts`)

- New function `deleteMember(id: string): Promise<void>`:
  - In a transaction:
    - `update member set deleted_at = now() where id = :id`
    - `delete from user where connected_member_id = :id`
- `readMember` (listing): add `isNull(withMemberCTE.deletedAt)` to the default where
  clause (always applied, not optional).
- `readMemberByRegisterNumber`: add `isNull(withMemberCTE.deletedAt)` to its where
  clause.

## New Component: `_components/delete-member-button/`

Follows the atomic folder pattern (mirrors `reset-password/`):

- `index.ts` — barrel export
- `action.ts` — server action `deleteMemberAction`
- `delete-member-button.tsx` — client component

### `action.ts`

`deleteMemberAction(memberId: string, registerNumber: string, confirmInput: string)`:

1. `readActiveSession()` — must exist.
2. Role check: `['root', 'bpk'].includes(user.role)`, else return error.
3. Fetch member row (`id`, `registerNumber`, `organizationId`, `name`).
4. `isOrgInScope(user, member.organizationId)` — else return "out of scope" error.
5. Validate `confirmInput === member.registerNumber` (zod or plain check) — else return
   "confirmation mismatch" error.
6. Call `deleteMember(memberId)`.
7. `updateTag('kader')` + `revalidatePath` for the same paths used by the
   kader add-form action, plus `/dashboard/profile`.
8. Return `{ success: true }`.

On the client, a successful response triggers `router.push('/dashboard/kader')` and a
success toast; failure shows an error toast with the returned message.

### `delete-member-button.tsx`

- `'use client'`, props: `memberId`, `registerNumber`, `name`.
- AlertDialog (open/close state controlled locally so it doesn't auto-close on submit
  while pending).
- Dialog body: description text + `Input` bound to local state for the confirmation
  value.
- `AlertDialogAction` (variant destructive) disabled unless
  `confirmValue === registerNumber` and not pending; on click calls the server action
  via `useTransition`.
- Loading state mirrors `ResetPasswordButton` (spinner icon + disabled state).

## Page Wiring (`page.tsx`)

- Compute `canDelete`:
  - `session.user.role === 'root'` → true
  - `session.user.role === 'bpk'` → `await isOrgInScope(session.user, member.organization.id)`
  - else → false
- If `canDelete`, build:
  ```tsx
  <DeleteMemberButton
    memberId={member.id}
    registerNumber={member.registerNumber}
    name={member.name}
  />
  ```
- Pass this as a new `dangerZoneSlot` prop to `ProfileInlineEditForm`.

## `profile-inline-edit-form.tsx`

- Add `dangerZoneSlot?: ReactNode` to props.
- Render it at the bottom of `<main>`, after `<OrganizationSection />`, wrapped in a
  bordered/destructive-styled "Danger Zone" container with a heading
  (e.g. "Zona Berbahaya") and short explanatory text, only rendered when
  `dangerZoneSlot` is non-null.

## Out of Scope

- Restoring soft-deleted members via UI.
- Bulk delete.
- Changes to `isSuspended` / `isNonActive` semantics.
