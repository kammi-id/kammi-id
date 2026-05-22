# Integrate Add Member Button and Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the "Add Member" button and sheet into the dashboard to allow authorized users to add new members.

**Architecture:** Use `nanostores` for state management of the sheet's open/close state. The `MembersTable` component will be updated to include the "Tambah Kader" button as an `actionElement` for the `DataTable`. The `Sheet` component from `shadcn/ui` will host the `AddMemberForm`.

**Tech Stack:** Next.js (App Router), React, Shadcn UI, Nanostores, Hugeicons.

---

### Task 1: Update MembersTable Props and Imports

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/members-table.tsx`

- [ ] **Step 1: Add imports and update props interface**

```tsx
'use client'

import * as React from 'react'
import { useStore } from '@nanostores/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '~/components/shadcn/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/shadcn/ui/sheet'
import { DataTable } from '../../_components/data-table'
import { getColumns, type MemberOrganization } from './columns'
import { AddMemberForm } from './add-form'
import { memberSheetStore } from './add-form/store'

interface MembersTableProps {
  data: MemberOrganization[]
  nameHeader: string
  pageCount: number
  totalCount: number
  basePath: string
  userRole: string
  parentOrgId: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/members-table.tsx
git commit -m "refactor: add imports and update MembersTableProps"
```

### Task 2: Implement Add Member Button and Sheet in MembersTable

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/members-table.tsx`

- [ ] **Step 1: Update MembersTable implementation**

```tsx
export const MembersTable = ({
  data,
  nameHeader,
  pageCount,
  totalCount,
  basePath,
  userRole,
  parentOrgId
}: MembersTableProps) => {
  const columns = getColumns(nameHeader, basePath)
  const isOpen = useStore(memberSheetStore)
  const canAdd =
    userRole === 'bpw' ||
    userRole === 'root' ||
    userRole === 'bph' ||
    userRole === 'bpk'

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey='name'
        pageCount={pageCount}
        totalCount={totalCount}
        actionElement={
          canAdd && (
            <Button
              size='sm'
              className='h-8 gap-2'
              onClick={() => memberSheetStore.set(true)}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                className='size-4'
              />
              Tambah Kader
            </Button>
          )
        }
      />
      <Sheet open={isOpen} onOpenChange={memberSheetStore.set}>
        <SheetContent className='sm:max-w-[450px]'>
          <SheetHeader>
            <SheetTitle>Tambah Data Kader</SheetTitle>
            <SheetDescription>
              Masukkan informasi dasar kader baru untuk pendaftaran.
            </SheetDescription>
          </SheetHeader>
          <div className='py-6'>
            <AddMemberForm organizationId={parentOrgId} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/members-table.tsx
git commit -m "feat: implement Add Member button and sheet in MembersTable"
```

### Task 3: Pass Props to MembersTable in Page

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/[[...slug]]/page.tsx`

- [ ] **Step 1: Update MembersTable usage in MembersPage**

```tsx
<MembersTable
  data={memberData}
  nameHeader={nameHeader}
  pageCount={pageCount}
  totalCount={totalCount}
  basePath={basePath}
  userRole={user.role}
  parentOrgId={currentOrg.id}
/>
```

- [ ] **Step 2: Verify changes and commit**

```bash
git add src/app/(dashboard)/dashboard/members/[[...slug]]/page.tsx
git commit -m "feat: pass userRole and parentOrgId to MembersTable"
```
