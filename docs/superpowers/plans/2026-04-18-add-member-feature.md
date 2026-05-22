# Add Member Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Add Member" feature with a sequential registration number generator and a UI identical to the "Add Branch" feature.

**Architecture:** Centralized registration number generator in a utility file, Server Actions for data mutations, and a Sheet-based UI using nanostores for state management.

**Tech Stack:** Next.js (Server Actions), Drizzle ORM, nanostores, shadcn/ui (Sheet), Zod.

---

### Task 1: Registration Number Utility

**Files:**

- Create: `src/lib/utils/member.ts`
- Test: `src/lib/utils/member.test.ts`

- [ ] **Step 1: Write the utility function**
      Create `src/lib/utils/member.ts` with the logic to parse organization codes and generate the sequential number.

```typescript
import { db } from '~/db/db'
import { member } from '~/db/schema/member.sql'
import { organization } from '~/db/schema/organization.sql'
import { eq, and, sql, desc, ilike } from 'drizzle-orm'

export async function generateRegisterNumber(
  organizationId: string,
  year: number
) {
  // 1. Get organization details including parent
  const [org] = await db!
    .select()
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1)

  if (!org) throw new Error('Organization not found')
  if (org.type === 'pp') throw new Error('Cannot register members under PP')

  let pwCode = ''
  let pdCode = ''

  if (org.type === 'pw') {
    // PK under PW: PW from code suffix, PD=00
    // Example: 'PW1' -> XX=01
    const match = org.code.match(/PW(\d+)/)
    pwCode = match ? match[1].padStart(2, '0') : '00'
    pdCode = '00'
  } else if (org.type === 'pdln') {
    // PDLN: PW=99, PD from code suffix
    // Example: 'PD.LN-8' -> XX=99, YY=08
    const match = org.code.match(/-(\d+)/)
    pwCode = '99'
    pdCode = match ? match[1].padStart(2, '0') : '00'
  } else {
    // PD or PK: Extract from code (e.g., '19.PD-1' -> XX=19, YY=01)
    const match = org.code.match(/(\d+)\.PD-(\d+)/)
    if (match) {
      pwCode = match[1].padStart(2, '0')
      pdCode = match[2].padStart(2, '0')
    } else {
      // Fallback: try to find parent PD if this is a PK
      if (org.parentId) {
        const [parent] = await db!
          .select()
          .from(organization)
          .where(eq(organization.id, org.parentId))
          .limit(1)
        if (parent && parent.type === 'pd') {
          const pMatch = parent.code.match(/(\d+)\.PD-(\d+)/)
          if (pMatch) {
            pwCode = pMatch[1].padStart(2, '0')
            pdCode = pMatch[2].padStart(2, '0')
          }
        }
      }
    }
  }

  const prefix = `${pwCode}${pdCode}${year}`

  // 2. Find max sequential number for this prefix
  const [lastMember] = await db!
    .select({ registerNumber: member.registerNumber })
    .from(member)
    .where(ilike(member.registerNumber, `${prefix}%`))
    .orderBy(desc(member.registerNumber))
    .limit(1)

  let nextSeq = 1
  if (lastMember) {
    const lastSeqStr = lastMember.registerNumber.slice(-3)
    nextSeq = parseInt(lastSeqStr) + 1
  }

  return `${prefix}${nextSeq.toString().padStart(3, '0')}`
}
```

- [ ] **Step 2: Commit utility**

```bash
git add src/lib/utils/member.ts
git commit -m "feat: add registration number generator utility"
```

---

### Task 2: UI State Management (Nanostores)

**Files:**

- Create: `src/app/(dashboard)/dashboard/members/_components/add-form/store.ts`

- [ ] **Step 1: Create the store**
      Create `src/app/(dashboard)/dashboard/members/_components/add-form/store.ts` to manage Sheet open/close state.

```typescript
import { atom } from 'nanostores'

export const memberSheetStore = atom<boolean>(false)

export const openMemberSheet = () => {
  memberSheetStore.set(true)
}

export const closeMemberSheet = () => {
  memberSheetStore.set(false)
}
```

- [ ] **Step 2: Commit store**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/store.ts
git commit -m "feat: add nanostore for member sheet"
```

---

### Task 3: Server Action for Member Creation

**Files:**

- Create: `src/app/(dashboard)/dashboard/members/_components/add-form/action.ts`

- [ ] **Step 1: Implement createMemberAction**
      Implement the action that generates the number, creates the member, and creates the user account.

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath, updateTag } from 'next/cache'
import { createMember } from '~/db/query/member'
import { generateRegisterNumber } from '~/lib/utils/member'
import { readActiveSession } from '~/lib/auth/cookies'

const memberSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi.'),
  gender: z.enum(['ikhwan', 'akhwat']),
  status: z.enum(['ab1', 'ab2', 'ab3']),
  yearOfEntry: z.coerce.number().min(1900).max(new Date().getFullYear()),
  organizationId: z.string().uuid()
})

export type MemberFormState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

export async function createMemberAction(
  prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi' }

  const validated = memberSchema.safeParse(
    Object.fromEntries(formData.entries())
  )
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
      message: 'Validasi gagal.'
    }
  }

  try {
    const registerNumber = await generateRegisterNumber(
      validated.data.organizationId,
      validated.data.yearOfEntry
    )

    await createMember({
      ...validated.data,
      registerNumber,
      isAlumn: false,
      isSuspended: false,
      isNonActive: false
    })

    updateTag('members')
    revalidatePath('/dashboard/members')

    return { success: true, message: 'Kader berhasil ditambahkan!' }
  } catch (error: any) {
    console.error(error)
    return {
      success: false,
      message: error.message || 'Gagal menambahkan kader.'
    }
  }
}
```

- [ ] **Step 2: Commit action**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/action.ts
git commit -m "feat: add createMemberAction with auto-gen register number"
```

---

### Task 4: AddMemberForm Component

**Files:**

- Create: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

- [ ] **Step 1: Create the form component**
      Implement the UI with shadcn components.

```tsx
'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { createMemberAction, type MemberFormState } from './action'
import { memberSheetStore } from './store'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'

export const AddMemberForm = ({
  organizationId
}: {
  organizationId: string
}) => {
  const [state, action, isPending] = useActionState(createMemberAction, {})

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      memberSheetStore.set(false)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <form action={action} className='space-y-6 p-6'>
      <input type='hidden' name='organizationId' value={organizationId} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='name'>Nama Lengkap</FieldLabel>
          <Input
            id='name'
            name='name'
            placeholder='Masukkan nama lengkap'
            required
          />
          <FieldError
            errors={state.errors?.name?.map((m) => ({ message: m }))}
          />
        </Field>

        <div className='grid grid-cols-2 gap-4'>
          <Field>
            <FieldLabel htmlFor='gender'>Gender</FieldLabel>
            <Select name='gender' defaultValue='ikhwan'>
              <SelectTrigger>
                <SelectValue placeholder='Pilih gender' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ikhwan'>Ikhwan</SelectItem>
                <SelectItem value='akhwat'>Akhwat</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor='status'>Status</FieldLabel>
            <Select name='status' defaultValue='ab1'>
              <SelectTrigger>
                <SelectValue placeholder='Pilih status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ab1'>AB1</SelectItem>
                <SelectItem value='ab2'>AB2</SelectItem>
                <SelectItem value='ab3'>AB3</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor='yearOfEntry'>Tahun Masuk</FieldLabel>
          <Input
            id='yearOfEntry'
            name='yearOfEntry'
            type='number'
            defaultValue={new Date().getFullYear()}
            required
          />
          <FieldError
            errors={state.errors?.yearOfEntry?.map((m) => ({ message: m }))}
          />
        </Field>

        <div className='flex justify-end gap-3 pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => memberSheetStore.set(false)}
          >
            Batal
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                className='mr-2 animate-spin'
              />
            )}
            Simpan Kader
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
```

- [ ] **Step 2: Commit form**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx
git commit -m "feat: implement AddMemberForm component"
```

---

### Task 5: Integration and Final Touches

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/members-table.tsx`
- Modify: `src/app/(dashboard)/dashboard/members/[[...slug]]/page.tsx`

- [ ] **Step 1: Update MembersTable**
      Add the "Add Member" button and the Sheet container.

- [ ] **Step 2: Pass necessary props in page.tsx**
      Ensure `MembersTable` receives `userRole` and `parentOrgId`.

- [ ] **Step 3: Commit integration**

```bash
git add src/app/(dashboard)/dashboard/members/_components/members-table.tsx src/app/(dashboard)/dashboard/members/[[...slug]]/page.tsx
git commit -m "feat: integrate Add Member button and sheet into dashboard"
```
