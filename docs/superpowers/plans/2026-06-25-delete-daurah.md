# Delete Daurah Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let `root`/in-scope `bpk` users permanently delete an empty daurah (training) from its detail page, via a dot-menu item that requires removing all attendants/instructors first and typing the exact training name to confirm.

**Architecture:** A query-layer helper (`trainingQuery.hasDependents`) checks for remaining attendants/instructors; the existing `deleteTrainingAction` server action gains auth, scope, dependents, and confirm-name checks before calling the existing `trainingQuery.delete`; a new `DeleteTrainingButton` client component wraps a `DropdownMenu` (dot-menu trigger) + `AlertDialog` (type-to-confirm) and is wired into `TrainingDetailView`'s title row.

**Tech Stack:** Next.js Server Actions, Drizzle ORM, Bun test runner, Base UI (`@base-ui/react`) via shadcn `DropdownMenu`/`AlertDialog` components.

**Spec:** `docs/superpowers/specs/2026-06-25-delete-daurah-design.md`

---

## File Structure

- Modify: `src/db/query/training.ts` — add `trainingQuery.hasDependents(id)`.
- Create: `tests/delete-training.test.ts` — covers `hasDependents` and the existing `trainingQuery.delete`.
- Modify: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/action.ts` — rewrite `deleteTrainingAction` with auth/scope/dependents/confirm checks and audit logging.
- Create: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/delete-training-button/delete-training-button.tsx` — dot-menu + confirm dialog client component.
- Create: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/delete-training-button/index.ts` — barrel export.
- Modify: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx` — import and render `DeleteTrainingButton` in the title row.

---

### Task 1: Query-layer dependents check

**Files:**

- Modify: `src/db/query/training.ts:377-383` (right after `delete`)
- Test: `tests/delete-training.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/delete-training.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import { createMember } from '~/db/query/member'
import { trainingQuery } from '~/db/query/training'

describe('trainingQuery.hasDependents', () => {
  let orgId: string

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "user", "member", training, training_attendants, training_instructors, organization CASCADE`
    )

    const [org] = await createOrganization({
      name: 'PK Test',
      slug: 'pk-test',
      code: 'PK-99',
      type: 'pk',
      parentId: null,
      isNonActive: false
    })
    orgId = org.id
  })

  const createTestTraining = async () => {
    return await trainingQuery.create({
      organizationId: orgId,
      name: 'DM1 Batch 1',
      startDate: '2026-01-01',
      endDate: '2026-01-03',
      type: 'dm1',
      registrationStartDate: null,
      registrationDeadline: null
    })
  }

  const createTestMember = async (registerNumber: string) => {
    const [created] = await createMember({
      name: 'Anggota Test',
      registerNumber,
      organizationId: orgId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2020
    })
    return created
  }

  it('returns false when a training has no attendants or instructors', async () => {
    const training = await trainingQuery.create({
      organizationId: orgId,
      name: 'DM1 Batch 1',
      startDate: '2026-01-01',
      endDate: '2026-01-03',
      type: 'dm1',
      registrationStartDate: null,
      registrationDeadline: null
    })

    const result = await trainingQuery.hasDependents(training.id)
    expect(result).toBe(false)
  })

  it('returns true when a training has an attendant', async () => {
    const training = await createTestTraining()
    const member = await createTestMember('PK99-0001')
    await trainingQuery.addAttendant(training.id, member.id)

    const result = await trainingQuery.hasDependents(training.id)
    expect(result).toBe(true)
  })

  it('returns true when a training has an instructor', async () => {
    const training = await createTestTraining()
    const member = await createTestMember('PK99-0002')
    await trainingQuery.addInstructor(training.id, member.id, 'lecturer')

    const result = await trainingQuery.hasDependents(training.id)
    expect(result).toBe(true)
  })

  it('returns false again once attendants and instructors are removed', async () => {
    const training = await createTestTraining()
    const member = await createTestMember('PK99-0003')
    await trainingQuery.addAttendant(training.id, member.id)
    await trainingQuery.removeAttendant(training.id, member.id)

    const result = await trainingQuery.hasDependents(training.id)
    expect(result).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/delete-training.test.ts`
Expected: FAIL with `trainingQuery.hasDependents is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/db/query/training.ts`, add right after the `delete` function (currently ending at line 383):

```ts
  hasDependents: async (id: string): Promise<boolean> => {
    const [attendantRow] = await db
      .select({ cnt: count() })
      .from(trainingAttendants)
      .where(eq(trainingAttendants.trainingId, id))
    const [instructorRow] = await db
      .select({ cnt: count() })
      .from(trainingInstructors)
      .where(eq(trainingInstructors.trainingId, id))

    return (attendantRow?.cnt ?? 0) > 0 || (instructorRow?.cnt ?? 0) > 0
  },
```

`count` and `eq` are already imported at the top of this file (used elsewhere), no new imports needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/delete-training.test.ts`
Expected: 4 pass

- [ ] **Step 5: Commit**

```bash
git add src/db/query/training.ts tests/delete-training.test.ts
git commit -m "feat: add trainingQuery.hasDependents check"
```

---

### Task 2: Harden `deleteTrainingAction`

**Files:**

- Modify: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/action.ts:216-229`

This action reads the session and queries the DB directly (same shape as `deleteMemberAction` in `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/action.ts`). It is not unit-tested in this codebase's convention — no existing action that calls `readActiveSession()` has a test (verified: `grep -rl readActiveSession tests/` returns nothing). Verification for this task is manual, in Task 5.

- [ ] **Step 1: Replace `deleteTrainingAction`**

Replace lines 216-229 of `action.ts`:

```ts
export const deleteTrainingAction = async (
  id: string,
  confirmInput: string
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user)
      return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const [t] = await db
      .select({
        id: trainingTable.id,
        name: trainingTable.name,
        organizationId: trainingTable.organizationId
      })
      .from(trainingTable)
      .where(eq(trainingTable.id, id))
      .limit(1)

    if (!t) return { success: false, message: 'Daurah tidak ditemukan.' }

    const allowed = await isOrgInScope(user, t.organizationId)
    if (!allowed) {
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses untuk mengelola daurah ini.'
      }
    }

    const hasDependents = await trainingQuery.hasDependents(id)
    if (hasDependents) {
      return {
        success: false,
        message:
          'Hapus semua peserta dan instruktur terlebih dahulu sebelum menghapus daurah ini.'
      }
    }

    if (confirmInput !== t.name) {
      return {
        success: false,
        message: 'Nama daurah yang dimasukkan tidak sesuai'
      }
    }

    await trainingQuery.delete(id)
    revalidatePath('/dashboard/trainings')

    logger.info('Daurah dihapus', {
      actorId: user.id,
      actorRole: user.role,
      trainingId: id,
      name: t.name
    })

    return { success: true, message: 'Daurah berhasil dihapus' }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected error occurred while deleting training'
    }
  }
}
```

No new imports are needed — `readActiveSession`, `isOrgInScope`, `db`, `eq`, `trainingTable`, `trainingQuery`, `revalidatePath`, and `logger` are all already imported at the top of this file (see lines 1-21).

- [ ] **Step 2: Typecheck**

Run: `bun run check:types`
Expected: no new type errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/trainings/_components/training-detail-view/action.ts
git commit -m "fix: enforce scope, empty-training, and name-confirm checks on deleteTrainingAction"
```

---

### Task 3: `DeleteTrainingButton` component

**Files:**

- Create: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/delete-training-button/delete-training-button.tsx`
- Create: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/delete-training-button/index.ts`

- [ ] **Step 1: Create the component**

`delete-training-button.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MoreVerticalCircle01Icon,
  Delete02Icon,
  Loading03Icon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/shadcn/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/shadcn/ui/alert-dialog'
import { deleteTrainingAction } from '../action'

interface DeleteTrainingButtonProps {
  trainingId: string
  name: string
  attendantCount: number
  instructorCount: number
}

export const DeleteTrainingButton = ({
  trainingId,
  name,
  attendantCount,
  instructorCount
}: DeleteTrainingButtonProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [alertOpen, setAlertOpen] = useState(false)
  const [confirmValue, setConfirmValue] = useState('')

  const handleMenuItemClick = () => {
    if (attendantCount > 0 || instructorCount > 0) {
      toast.error(
        'Hapus semua peserta dan instruktur terlebih dahulu sebelum menghapus daurah ini.'
      )
      return
    }
    setAlertOpen(true)
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteTrainingAction(trainingId, confirmValue)
      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/trainings')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Menu daurah'
              disabled={isPending}
            />
          }
        >
          {isPending ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              className='size-4 animate-spin'
            />
          ) : (
            <HugeiconsIcon icon={MoreVerticalCircle01Icon} className='size-4' />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem variant='destructive' onClick={handleMenuItemClick}>
            <HugeiconsIcon icon={Delete02Icon} />
            Hapus Daurah
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={alertOpen}
        onOpenChange={(open) => {
          setAlertOpen(open)
          if (!open) setConfirmValue('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data daurah ini secara permanen dan
              tidak dapat dibatalkan. Untuk melanjutkan, ketik nama daurah{' '}
              <span className='font-geist-mono font-medium'>{name}</span> di
              bawah ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='confirm-training-name'>Nama Daurah</Label>
            <Input
              id='confirm-training-name'
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              placeholder={name}
              autoComplete='off'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={handleConfirm}
              disabled={isPending || confirmValue !== name}
            >
              Ya, Hapus Daurah
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

`index.ts`:

```ts
export * from './delete-training-button'
```

- [ ] **Step 2: Typecheck**

Run: `bun run check:types`
Expected: no new type errors (in particular, confirm `icon-sm` is a valid `Button` `size` value and `variant='destructive'` is valid on `DropdownMenuItem` — both already verified present in `src/components/shadcn/ui/button/button.tsx` and `src/components/shadcn/ui/dropdown-menu.tsx`)

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/delete-training-button"
git commit -m "feat: add DeleteTrainingButton dot-menu with type-to-confirm dialog"
```

---

### Task 4: Wire into `TrainingDetailView`

**Files:**

- Modify: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx`

- [ ] **Step 1: Import the component**

Add near the other local imports (after the line `import { DM1BulkUploadButton } from './dm1-bulk-upload-button'` at line 56):

```ts
import { DeleteTrainingButton } from './delete-training-button'
```

- [ ] **Step 2: Render it in the title row**

In the "Title row" block (lines 389-405), add the button next to the badges. Replace:

```tsx
{
  /* Title row */
}
;<div className='flex flex-col gap-2'>
  <div className='flex flex-wrap items-center gap-2'>
    <Badge
      variant='outline'
      className='border-primary/20 bg-primary/5 text-primary font-geist-mono text-[11px] font-bold uppercase'
    >
      {typeLabels[trainingType] ?? trainingType}
    </Badge>
    <StatusBadge startDate={training.startDate} endDate={training.endDate} />
  </div>
  <h1 className='font-heading text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>
    {training.name}
  </h1>
</div>
```

with:

```tsx
{
  /* Title row */
}
;<div className='flex flex-col gap-2'>
  <div className='flex flex-wrap items-center justify-between gap-2'>
    <div className='flex flex-wrap items-center gap-2'>
      <Badge
        variant='outline'
        className='border-primary/20 bg-primary/5 text-primary font-geist-mono text-[11px] font-bold uppercase'
      >
        {typeLabels[trainingType] ?? trainingType}
      </Badge>
      <StatusBadge startDate={training.startDate} endDate={training.endDate} />
    </div>
    {canManage && (
      <DeleteTrainingButton
        trainingId={training.id}
        name={training.name}
        attendantCount={attendantCount}
        instructorCount={instructorCount}
      />
    )}
  </div>
  <h1 className='font-heading text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>
    {training.name}
  </h1>
</div>
```

`attendantCount` and `instructorCount` are already computed earlier in this component (lines 252-253: `const attendantCount = attendants.length` / `const instructorCount = instructors.length`), and `canManage` is already a prop of `TrainingDetailView`.

- [ ] **Step 3: Typecheck**

Run: `bun run check:types`
Expected: no new type errors

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx"
git commit -m "feat: wire DeleteTrainingButton into training detail page header"
```

---

### Task 5: Manual browser verification

This is a UI feature — verify it in a running dev server before calling the work done.

- [ ] **Step 1: Start the dev server**

Use the preview tool to start the app (or `bun dev` if no preview tool is available in this environment).

- [ ] **Step 2: Verify the blocked path**

As a `root` or in-scope `bpk` user, navigate to a training detail page (`/dashboard/trainings/[branch]/[id]`) that still has at least one attendant or instructor. Open the dot-menu (top-right of the title row) and click "Hapus Daurah".

Expected: an error toast reading "Hapus semua peserta dan instruktur terlebih dahulu sebelum menghapus daurah ini." appears; no dialog opens.

- [ ] **Step 3: Verify the happy path**

Remove all attendants and instructors from that training (using the existing remove buttons in the Peserta/Perangkat Daurah panels). Open the dot-menu again and click "Hapus Daurah".

Expected: a confirmation dialog opens showing the training name and an input. Typing anything other than the exact name keeps "Ya, Hapus Daurah" disabled. Typing the exact name enables it. Clicking it shows a success toast and redirects to `/dashboard/trainings`; the deleted training no longer appears in that list.

- [ ] **Step 4: Verify the scope gate**

As a `bpk` user whose scope does NOT include this training's organization (or as any role other than `root`/`bpk`), confirm the dot-menu does not render at all on a training detail page (gated by `canManage`, computed server-side in `page.tsx` via `isOrgInScope`).

- [ ] **Step 5: Check for console/runtime errors**

Use the preview tool's console/log inspection (or browser devtools if no preview tool) to confirm no new errors were introduced during steps 2-4.
