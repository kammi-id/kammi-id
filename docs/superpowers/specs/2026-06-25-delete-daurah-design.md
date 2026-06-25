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

This spec fixes the cascade bug as part of wiring up the first real UI for this action.

## Behavior

1. A "Hapus Daurah" (destructive) button is added to the title row of the training
   detail page header, next to the type/status badges.
2. Visibility (`canManage`, already computed in `page.tsx` via `isOrgInScope`):
   - `root`: always visible.
   - `bpk`: visible only if the training's organization is within the user's scope.
   - All other roles: not visible.
3. Clicking the button opens a confirmation dialog (AlertDialog + Input, same pattern as
   `delete-member-button.tsx`):
   - Shows the training name.
   - Explains that this permanently deletes the training **and all peserta/instruktur
     records attached to it**.
   - Requires the admin to type the exact training name into a text field.
   - The confirm button stays disabled until the typed value matches exactly.
4. On confirm, a server action re-validates everything (session, scope via
   `assertCanManage`, name match) and performs a hard delete in a transaction:
   - Delete `trainingAttendants` rows where `trainingId = :id`.
   - Delete `trainingInstructors` rows where `trainingId = :id`.
   - Delete the `training` row.
5. On success: revalidate `/dashboard/trainings`, redirect to `/dashboard/trainings`,
   show a success toast.
6. No soft-delete: training has no `deletedAt` column and none is added. This matches
   the existing hard-delete convention for this entity and avoids a schema migration.

## Data Layer (`src/db/query/training.ts`)

Replace `trainingQuery.delete`:

```ts
delete: async (id: string) => {
  return await db.transaction(async (tx) => {
    await tx.delete(trainingAttendants).where(eq(trainingAttendants.trainingId, id))
    await tx.delete(trainingInstructors).where(eq(trainingInstructors.trainingId, id))
    const [deleted] = await tx.delete(training).where(eq(training.id, id)).returning()
    return deleted
  })
}
```

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
4. Validate `confirmInput === training.name` — else return a "confirmation mismatch"
   error message.
5. Call `trainingQuery.delete(id)`.
6. `revalidatePath('/dashboard/trainings')`.
7. `logger.info('Daurah dihapus', { actorId: user.id, actorRole: user.role, trainingId: id, name })`.
8. Return `{ success: true, message: 'Daurah berhasil dihapus' }`.

## New Component: `_components/training-detail-view/delete-training-button/`

Atomic folder, mirrors `delete-member-button/`:

- `index.ts` — barrel export
- `delete-training-button.tsx` — client component

No separate `action.ts` in this folder — the action stays in the parent
`training-detail-view/action.ts` alongside the other training actions, consistent with
how `removeAttendantAction` / `removeInstructorAction` already live there.

### `delete-training-button.tsx`

- `'use client'`, props: `trainingId`, `name`.
- AlertDialog (open state controlled locally, resets `confirmValue` on close).
- Dialog body: description explaining permanent deletion of the training plus all
  peserta/instruktur records + `Input` bound to local state for the confirmation value.
- `AlertDialogAction` (variant destructive) disabled unless `confirmValue === name` and
  not pending; on click calls `deleteTrainingAction(trainingId, confirmValue)` via
  `useTransition`.
- On success: toast + `router.push('/dashboard/trainings')`.
- On failure: error toast with the returned message.
- Loading state mirrors `DeleteMemberButton` (spinner icon + disabled trigger).

## Wiring (`training-detail-view.tsx`)

- Import `DeleteTrainingButton`.
- Render it in the title row (top-right, next to the type badge / status badge), only
  when `canManage` is true:
  ```tsx
  {canManage && (
    <DeleteTrainingButton trainingId={training.id} name={training.name} />
  )}
  ```

## Out of Scope

- Soft-delete / restore for trainings.
- Bulk delete.
- Changes to kader (individual member) deletion — already implemented and correct.
