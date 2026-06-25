# Delete Daurah (Training) — Design

## Goal

Allow `root` and `bpk` (within their organization scope) to permanently remove a daurah
(training), with explicit type-to-confirm protection, from the training detail page
(`/dashboard/trainings/[branch]/[id]`).

Kader (individual member) deletion already exists and works correctly via
`delete-member-button` (role + scope checked, type-to-confirm, soft delete) — no changes
needed there. This spec covers daurah only.

## Current State / Bug Found

`deleteTrainingAction` already exists in
`src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/action.ts`
but:

- Has no role/scope check.
- Has no confirmation.
- Is not called from any UI (`grep` confirms zero callers).
- Hard-deletes the `training` row directly. Since `trainingAttendants` and
  `trainingInstructors` reference `training.id` with no `onDelete: 'cascade'`, deleting
  any training that has participants or instructors currently throws a FK violation,
  silently swallowed into a generic "An unexpected error occurred" message.

This spec fixes that gap by **requiring** the training be empty of attendants and
instructors before deletion is allowed, rather than cascading the delete. Deletion is a
deliberate cleanup action for an empty/abandoned daurah record, not a bulk-remove tool.

## Behavior

1. The delete action is **not** exposed as a visible standalone button. It lives inside
   a dot-menu (kebab `⋮`) in the title row of the training detail page header, next to
   the type/status badges — the same dropdown-menu pattern used in
   `nav-user.tsx` (`DropdownMenu` / `DropdownMenuTrigger` / `DropdownMenuContent` /
   `DropdownMenuItem`, icon `MoreVerticalCircle01Icon`). This keeps the action available
   but intentional — no accidental clicks.
2. Visibility (`canManage`, already computed in `page.tsx` via `isOrgInScope`):
   - `root`: dot-menu shown, item enabled (subject to the empty-training rule below).
   - `bpk`: dot-menu shown only if the training's organization is within the user's
     scope.
   - All other roles: dot-menu not rendered at all.
3. Inside the dot-menu, the "Hapus Daurah" item (destructive styling) is:
   - **Disabled**, with a tooltip, when `attendantCount > 0 || instructorCount > 0`:
     "Hapus semua peserta dan instruktur terlebih dahulu sebelum menghapus daurah."
   - **Enabled** only when both counts are `0`.
4. Clicking the enabled item closes the dropdown and opens a confirmation dialog
   (AlertDialog + Input, same pattern as `delete-member-button.tsx`), rendered outside
   the `DropdownMenuContent` and controlled by local `open` state (so it doesn't get
   unmounted when the dropdown closes):
   - Shows the training name.
   - Explains that this permanently deletes the training record.
   - Requires the admin to type the exact training name into a text field.
   - The confirm button stays disabled until the typed value matches exactly.
5. On confirm, the server action re-validates everything (session, scope, the
   zero-attendants/zero-instructors rule, name match) before deleting — never trusts the
   client-side counts alone.
6. On success: revalidate `/dashboard/trainings`, redirect to `/dashboard/trainings`,
   show a success toast.
7. No soft-delete: training has no `deletedAt` column and none is added. This matches
   the existing hard-delete convention for this entity and avoids a schema migration.

## Action Layer (`action.ts`)

Update `deleteTrainingAction`:

```ts
deleteTrainingAction(id: string, confirmInput: string): Promise<ActionResponse>
```

1. Read session directly (`readActiveSession()`) instead of calling `assertCanManage`,
   so `user` is available for the audit log without a second session read.
2. Fetch the training's `id`, `name`, `organizationId` (single `select`); return a "not
   found" message if missing.
3. `isOrgInScope(user, training.organizationId)` — return its rejection message on
   failure (same copy `assertCanManage` uses: "Antum tidak memiliki hak akses untuk
   mengelola daurah ini.").
4. Count rows in `trainingAttendants` and `trainingInstructors` for this `trainingId`
   (`select count(*)` on each, or a single query with two `count` aggregates). If either
   is `> 0`, return: "Hapus semua peserta dan instruktur terlebih dahulu sebelum
   menghapus daurah ini."
5. Validate `confirmInput === training.name` — else return a "confirmation mismatch"
   error message.
6. Call `trainingQuery.delete(id)` (plain delete — no cascade needed since step 4
   guarantees no dependent rows remain).
7. `revalidatePath('/dashboard/trainings')`.
8. `logger.info('Daurah dihapus', { actorId: user.id, actorRole: user.role, trainingId: id, name })`.
9. Return `{ success: true, message: 'Daurah berhasil dihapus' }`.

`trainingQuery.delete` itself is unchanged (plain `db.delete(training).where(...)`) —
the emptiness check happens in the action before it's called.

## New Component: `_components/training-detail-view/delete-training-button/`

Atomic folder:

- `index.ts` — barrel export
- `delete-training-button.tsx` — client component

No separate `action.ts` in this folder — the action stays in the parent
`training-detail-view/action.ts` alongside the other training actions, consistent with
how `removeAttendantAction` / `removeInstructorAction` already live there.

### `delete-training-button.tsx`

- `'use client'`, props: `trainingId`, `name`, `attendantCount`, `instructorCount`.
- Renders a `DropdownMenu` with a single destructive `DropdownMenuItem` ("Hapus
  Daurah"), disabled when `attendantCount > 0 || instructorCount > 0`. Wrap the disabled
  state in a `Tooltip` (matching the `passingTooltip` pattern already used in
  `training-detail-view.tsx`) explaining why it's disabled.
- On enabled-item click: `preventDefault` the menu's default close-and-fire behavior
  only as needed to set local `alertOpen = true` (the dropdown itself is allowed to
  close normally; the `AlertDialog` is a sibling, not a child, of `DropdownMenuContent`,
  so it persists).
- `AlertDialog` (open state = `alertOpen`, resets `confirmValue` on close): description
  explaining permanent deletion + `Input` bound to local state for the confirmation
  value.
- `AlertDialogAction` (variant destructive) disabled unless `confirmValue === name` and
  not pending; on click calls `deleteTrainingAction(trainingId, confirmValue)` via
  `useTransition`.
- On success: toast + `router.push('/dashboard/trainings')`.
- On failure (including the "remove attendants/instructors first" case, as defense in
  depth if counts changed concurrently): error toast with the returned message.
- Loading state mirrors `DeleteMemberButton` (spinner icon + disabled trigger).

## Wiring (`training-detail-view.tsx`)

- Import `DeleteTrainingButton`.
- Render it in the title row (top-right, next to the type badge / status badge), only
  when `canManage` is true:
  ```tsx
  {canManage && (
    <DeleteTrainingButton
      trainingId={training.id}
      name={training.name}
      attendantCount={attendantCount}
      instructorCount={instructorCount}
    />
  )}
  ```
  (`attendantCount` / `instructorCount` are already computed in this component from
  `training.attendants` / `training.instructors`.)

## Out of Scope

- Soft-delete / restore for trainings.
- Bulk delete.
- Cascading delete of attendants/instructors — explicitly rejected; user must clear them
  out first via the existing remove-attendant/remove-instructor flows.
- Changes to kader (individual member) deletion — already implemented and correct.
