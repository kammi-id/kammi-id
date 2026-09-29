# Delete Member (Soft Delete) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Hapus Anggota" (delete member) action to the member detail page,
restricted to `root` and in-scope `bpk` users, gated by typing the member's register
number to confirm, performing a soft delete (mark member deleted + remove their login
account).

**Architecture:** Add a nullable `deleted_at` column to `member`. Add a
`deleteMember()` query function that soft-deletes the member and removes their
`user` row in one transaction. Filter all member reads to exclude soft-deleted rows.
Add a new colocated component (`delete-member-button`) following the existing
`reset-password` pattern (AlertDialog + server action), wired into the profile page
behind a new "Danger Zone" section.

**Tech Stack:** Next.js (App Router, Server Actions), Drizzle ORM (Postgres), Zod,
shadcn/ui (BaseUI primitives) — `AlertDialog`, `Input`, `Button`. Bun test for the
DB-layer test.

---

## Task 1: Add `deletedAt` column to member schema + migration

**Files:**

- Modify: `src/db/schema/member.sql.ts`

- [ ] **Step 1: Add the column**

Edit `src/db/schema/member.sql.ts` — add `deletedAt` after `yearOfEntry`:

```ts
  yearOfEntry: t.integer('year_of_entry').notNull(),
  deletedAt: t.timestamp('deleted_at')
}))
```

(Remove the trailing comma from `yearOfEntry`'s line as needed so the object stays
valid — i.e. `yearOfEntry: t.integer('year_of_entry').notNull(),` followed by the new
line, then `}))`.)

- [ ] **Step 2: Generate the migration**

Run: `bun run db:generate`

Expected: a new folder appears under `src/db/__migrations/` (timestamp-prefixed) with
a `.sql` file containing `ALTER TABLE "member" ADD COLUMN "deleted_at" timestamp;`.

- [ ] **Step 3: Apply the migration locally**

Run: `bun run db:migrate`

Expected: command completes without error, confirming the new column exists in the
local database.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema/member.sql.ts src/db/__migrations
git commit -m "feat: add deleted_at column to member for soft delete"
```

---

## Task 2: `deleteMember` query function + filter soft-deleted members from reads

**Files:**

- Modify: `src/db/query/member.ts`
- Modify: `src/db/query/cte/member.ts` (add `deletedAt` is already included via
  `getColumns(member)` — no change needed there, just confirm)
- Test: `tests/delete-member.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/delete-member.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { sql, eq } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import {
  createMember,
  deleteMember,
  readMember,
  readMemberByRegisterNumber
} from '~/db/query/member'
import { user as userTable } from '~/db/schema/user.sql'

describe('deleteMember', () => {
  let orgId: string

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

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

  it('marks the member as deleted and removes their login account', async () => {
    const created = await createTestMember('PK99-0001')

    const [userBefore] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, created.id))
    expect(userBefore).toBeDefined()

    await deleteMember(created.id)

    const [userAfter] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, created.id))
    expect(userAfter).toBeUndefined()
  })

  it('excludes deleted members from readMember', async () => {
    const created = await createTestMember('PK99-0002')
    await deleteMember(created.id)

    const results = await readMember({ id: [created.id] })
    expect(results).toHaveLength(0)
  })

  it('returns null from readMemberByRegisterNumber for deleted members', async () => {
    const created = await createTestMember('PK99-0003')
    await deleteMember(created.id)

    const found = await readMemberByRegisterNumber('PK99-0003')
    expect(found).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/delete-member.test.ts`
Expected: FAIL — `deleteMember is not a function` (or similar import error), since
`deleteMember` doesn't exist yet.

- [ ] **Step 3: Implement `deleteMember` and filter reads**

In `src/db/query/member.ts`:

1. Update the drizzle-orm import to include `isNull`:

```ts
import {
  inArray,
  eq,
  and,
  ilike,
  sql,
  desc,
  isNull,
  type SQL
} from 'drizzle-orm'
```

2. Add the `deleteMember` function near `updateMember` (after it):

```ts
export const deleteMember = async (id: string): Promise<void> => {
  await db.transaction(async (tx) => {
    await tx
      .update(member)
      .set({ deletedAt: new Date() })
      .where(eq(member.id, id))

    await tx.delete(userTable).where(eq(userTable.connectedMemberId, id))
  })
}
```

Add the required import for the user table at the top of the file (alongside the
other schema imports):

```ts
import { user as userTable } from '../schema/user.sql'
```

3. In `readMember`, add the soft-delete filter to the `where` array — find this block:

```ts
if (memberFilters.gender)
  where.push(eq(withMemberCTE.gender, memberFilters.gender))
```

and add immediately after it:

```ts
where.push(isNull(withMemberCTE.deletedAt))
```

4. In `readMemberByRegisterNumber`, add the same filter to the `.where()`:

```ts
export const readMemberByRegisterNumber = async (
  registerNumber: string
): Promise<Member | null> => {
  const [found] = await db
    .with(withMemberCTE)
    .select()
    .from(withMemberCTE)
    .where(
      and(
        eq(withMemberCTE.registerNumber, registerNumber),
        isNull(withMemberCTE.deletedAt)
      )
    )
    .limit(1)
  return found ?? null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/delete-member.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full existing access-control test to check for regressions**

Run: `bun test tests/access-control.test.ts`
Expected: PASS (no changes to org logic, but confirms nothing broke from the new
import/filter).

- [ ] **Step 6: Commit**

```bash
git add src/db/query/member.ts tests/delete-member.test.ts
git commit -m "feat: add deleteMember query and exclude soft-deleted members from reads"
```

---

## Task 3: `deleteMemberAction` server action

**Files:**

- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/action.ts`

- [ ] **Step 1: Write the action**

Create `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/action.ts`:

```ts
'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath, updateTag } from 'next/cache'
import { db } from '~/db/db'
import { member as memberTable } from '~/db/schema/member.sql'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'
import { deleteMember } from '~/db/query/member'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'action', 'member'])

type DeleteMemberResult = {
  success: boolean
  message: string
}

export const deleteMemberAction = async (
  memberId: string,
  confirmInput: string
): Promise<DeleteMemberResult> => {
  const session = await readActiveSession()
  if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }

  const { user } = session
  if (!['root', 'bpk'].includes(user.role)) {
    return { success: false, message: 'Role tidak diizinkan untuk aksi ini' }
  }

  const [memberRow] = await db
    .select({
      id: memberTable.id,
      name: memberTable.name,
      registerNumber: memberTable.registerNumber,
      organizationId: memberTable.organizationId
    })
    .from(memberTable)
    .where(eq(memberTable.id, memberId))
    .limit(1)

  if (!memberRow) return { success: false, message: 'Kader tidak ditemukan' }

  const inScope = await isOrgInScope(user, memberRow.organizationId)
  if (!inScope) {
    return {
      success: false,
      message: 'Kader ini bukan dalam scope organisasi antum'
    }
  }

  if (confirmInput !== memberRow.registerNumber) {
    return {
      success: false,
      message: 'Nomor anggota yang dimasukkan tidak sesuai'
    }
  }

  await deleteMember(memberRow.id)

  updateTag('kader')
  revalidatePath('/dashboard/kader')
  revalidatePath('/dashboard/alumni')
  revalidatePath('/dashboard/pemandu')
  revalidatePath('/dashboard/instruktur')
  revalidatePath('/dashboard/profile')

  logger.info('Kader dihapus', {
    actorId: user.id,
    actorRole: user.role,
    memberId: memberRow.id,
    registerNumber: memberRow.registerNumber
  })

  return { success: true, message: 'Anggota berhasil dihapus' }
}
```

- [ ] **Step 2: Type-check**

Run: `bun run typecheck` (or `bunx tsc --noEmit` if no dedicated script — check
`package.json` `scripts` first with `grep typecheck package.json`)
Expected: no new type errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/action.ts"
git commit -m "feat: add deleteMemberAction server action"
```

---

## Task 4: `DeleteMemberButton` client component + barrel export

**Files:**

- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/delete-member-button.tsx`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/index.ts`

- [ ] **Step 1: Write the component**

Create `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/delete-member-button.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/shadcn/ui/alert-dialog'
import { deleteMemberAction } from './action'

interface DeleteMemberButtonProps {
  memberId: string
  registerNumber: string
  name: string
}

export const DeleteMemberButton = ({
  memberId,
  registerNumber,
  name
}: DeleteMemberButtonProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmValue, setConfirmValue] = useState('')

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteMemberAction(memberId, confirmValue)
      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/kader')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) setConfirmValue('')
      }}
    >
      <AlertDialogTrigger
        render={<Button variant='destructive' size='sm' disabled={isPending} />}
      >
        {isPending ? (
          <HugeiconsIcon
            icon={Loading03Icon}
            className='mr-2 size-3.5 animate-spin'
          />
        ) : (
          <HugeiconsIcon icon={Delete02Icon} className='mr-2 size-3.5' />
        )}
        Hapus Anggota
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini akan menghapus data anggota ini dari dashboard dan
            menonaktifkan akun login-nya secara permanen. Untuk melanjutkan,
            ketik nomor anggota{' '}
            <span className='font-geist-mono font-medium'>
              {registerNumber}
            </span>{' '}
            di bawah ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='confirm-register-number'>Nomor Anggota</Label>
          <Input
            id='confirm-register-number'
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={registerNumber}
            autoComplete='off'
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleConfirm}
            disabled={isPending || confirmValue !== registerNumber}
          >
            Ya, Hapus Anggota
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Verify the icons exist**

Run: `grep -rn "Delete02Icon\|Loading03Icon" node_modules/@hugeicons/core-free-icons/dist/index.d.ts | head -5`
Expected: both icon names are found. If `Delete02Icon` does not exist, run
`grep -in "delete" node_modules/@hugeicons/core-free-icons/dist/index.d.ts | head -10`
and substitute the closest matching delete/trash icon name in the component above.

- [ ] **Step 3: Create the barrel export**

Create `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/index.ts`:

```ts
export * from './delete-member-button'
```

- [ ] **Step 4: Type-check**

Run: `bunx tsc --noEmit`
Expected: no new type errors in the new files.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button"
git commit -m "feat: add DeleteMemberButton confirmation dialog"
```

---

## Task 5: Add "Danger Zone" slot to `ProfileInlineEditForm`

**Files:**

- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-inline-edit-form/profile-inline-edit-form.tsx`

- [ ] **Step 1: Add the `dangerZoneSlot` prop**

In `profile-inline-edit-form.tsx`, update the props interface (around line 27-36):

```tsx
interface ProfileInlineEditFormProps {
  member: Member
  canEdit: boolean
  trainingHistory: MemberTrainingHistory
  academicHistory: MemberAcademic[]
  careerHistory: MemberCareer[]
  organizationHistory: MemberOrganizationHistory[]
  orgHierarchySlot?: ReactNode
  adminActionsSlot?: ReactNode
  dangerZoneSlot?: ReactNode
}
```

And destructure it in the component signature (around line 38-47):

```tsx
export const ProfileInlineEditForm = ({
  member,
  canEdit,
  trainingHistory,
  academicHistory,
  careerHistory,
  organizationHistory,
  orgHierarchySlot,
  adminActionsSlot,
  dangerZoneSlot
}: ProfileInlineEditFormProps) => {
```

- [ ] **Step 2: Render the Danger Zone section**

Find the `<OrganizationSection />` block (around line 138-140):

```tsx
<div className='mt-8'>
  <OrganizationSection />
</div>
```

Add the danger zone immediately after it, still inside `<main>`:

```tsx
;<div className='mt-8'>
  <OrganizationSection />
</div>
{
  dangerZoneSlot && (
    <div className='border-destructive/30 bg-destructive/5 mt-8 rounded-2xl border p-4'>
      <h3 className='text-destructive text-sm font-semibold'>Zona Berbahaya</h3>
      <p className='text-muted-foreground mt-1 text-sm'>
        Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
      </p>
      <div className='mt-3'>{dangerZoneSlot}</div>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `bunx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-inline-edit-form/profile-inline-edit-form.tsx"
git commit -m "feat: add danger zone slot to profile inline edit form"
```

---

## Task 6: Wire `DeleteMemberButton` into the profile page

**Files:**

- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx`

- [ ] **Step 1: Import `isOrgInScope` and `DeleteMemberButton`**

At the top of `page.tsx`, add to the existing `~/db/query/organization` import and add
a new import:

```tsx
import { readOrgHierarchyChain, isOrgInScope } from '~/db/query/organization'
import { DeleteMemberButton } from './_components/delete-member-button'
```

(This replaces the existing single-named import of `readOrgHierarchyChain` from
`~/db/query/organization` — merge into one import statement.)

- [ ] **Step 2: Compute `canDelete` and build the slot**

After the existing `userCanEdit` / `adminActionsSlot` block (around line 58-68), add:

```tsx
const canDelete =
  session?.user.role === 'root' ||
  (session?.user.role === 'bpk' &&
    member.organization?.id !== undefined &&
    (await isOrgInScope(session.user, member.organization.id)))

const dangerZoneSlot = canDelete ? (
  <DeleteMemberButton
    memberId={member.id}
    registerNumber={member.registerNumber}
    name={member.name}
  />
) : null
```

- [ ] **Step 3: Pass the slot to `ProfileInlineEditForm`**

In the returned JSX, add `dangerZoneSlot={dangerZoneSlot}` alongside the other slot
props:

```tsx
return (
  <ProfileInlineEditForm
    member={member}
    canEdit={userCanEdit}
    trainingHistory={trainingHistory}
    academicHistory={academicHistory}
    careerHistory={careerHistory}
    organizationHistory={organizationHistory}
    adminActionsSlot={adminActionsSlot}
    dangerZoneSlot={dangerZoneSlot}
    orgHierarchySlot={
      orgChain.length > 0 ? (
        <ProfileOrgHierarchy
          chain={orgChain}
          currentOrgId={member.organization?.id ?? ''}
        />
      ) : null
    }
  />
)
```

- [ ] **Step 4: Type-check**

Run: `bunx tsc --noEmit`
Expected: no new type errors. Note `session.user.role === 'bpk'` narrows
`session` to non-null within that branch via the `&&` chain — if TypeScript complains
about `session` possibly being `undefined` in the `isOrgInScope(session.user, ...)`
call, rewrite the `canDelete` computation as:

```tsx
let canDelete = false
if (session?.user.role === 'root') {
  canDelete = true
} else if (session?.user.role === 'bpk' && member.organization?.id) {
  canDelete = await isOrgInScope(session.user, member.organization.id)
}
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx"
git commit -m "feat: wire delete member button into profile page"
```

---

## Task 7: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Use the preview tooling to start the dev server (`preview_start`) if not already
running.

- [ ] **Step 2: Log in as a `root` or `bpk` user**

Navigate to `/login` and sign in with a seeded `root` or `bpk` account (check
`src/scripts/seed.ts` for seeded credentials if needed:
`grep -n "root\|bpk" src/scripts/seed.ts`).

- [ ] **Step 3: Open a member's profile**

Navigate to `/dashboard/kader`, open any member's detail page
(`/dashboard/profile/<registerNumber>`).

- [ ] **Step 4: Verify the Danger Zone renders**

Use `preview_snapshot` to confirm a "Zona Berbahaya" section with a "Hapus Anggota"
button appears at the bottom of the page.

- [ ] **Step 5: Verify the confirm dialog gating**

Click "Hapus Anggota". Confirm the dialog opens, shows the register number, and that
"Ya, Hapus Anggota" is disabled. Type an incorrect value with `preview_fill` and
confirm the button stays disabled. Type the exact register number and confirm the
button becomes enabled.

- [ ] **Step 6: Verify deletion**

Click "Ya, Hapus Anggota". Confirm:

- A success toast appears.
- The page redirects to `/dashboard/kader`.
- The deleted member no longer appears in the kader listing
  (`preview_snapshot` on `/dashboard/kader`).
- Navigating directly to the deleted member's old profile URL
  (`/dashboard/profile/<registerNumber>`) returns a 404 page.

- [ ] **Step 7: Verify login is disabled**

Log out and attempt to log in with the deleted member's old `registerNumber` /
password. Confirm login fails with "Username atau password salah."

- [ ] **Step 8: Verify role restriction**

Log in as a `member` or other non-root/bpk role and confirm the Danger Zone /
"Hapus Anggota" button is not visible on any profile page.

---

## Self-Review Notes

- Spec coverage: visibility rules (root / in-scope bpk), type-to-confirm dialog,
  soft delete + login removal, listing/detail exclusion, redirect + revalidation —
  all covered across Tasks 1-6.
- `deleteMember`, `readMember`, `readMemberByRegisterNumber` signatures are reused
  consistently (Task 2 defines them, Task 3 calls `deleteMember`).
- `DeleteMemberButton` props (`memberId`, `registerNumber`, `name`) match what
  Task 6 passes from `page.tsx`.
- `dangerZoneSlot` prop name matches between Task 5 (definition) and Task 6 (usage).
- Out of scope items (restore UI, bulk delete) intentionally not included.
