# Add Member Form Layout and Field Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the overflow issue where the "Simpan" button is hidden and reorganize the "Status & Sertifikasi" fields for better alignment and order.

**Architecture:** Move the scrolling responsibility from the parent `IndividualMemberTable` into the `AddMemberForm` itself. The form will use a flexbox layout with a scrollable content area and a sticky footer for action buttons.

**Tech Stack:** React, Tailwind CSS, Shadcn UI.

---

### Task 1: Remove Outer ScrollArea from IndividualMemberTable

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/individual-table.tsx`

- [ ] **Step 1: Remove ScrollArea wrapper**

Replace lines 64-68:

```tsx
<ScrollArea className='h-full pr-4'>
  <div className='py-6'>
    <AddMemberForm organizationId={parentOrgId} />
  </div>
</ScrollArea>
```

with:

```tsx
<div className='h-full overflow-hidden'>
  <AddMemberForm organizationId={parentOrgId} />
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/individual-table.tsx
git commit -m "fix: remove outer ScrollArea from IndividualMemberTable to allow internal form scrolling"
```

---

### Task 2: Implement Flex Layout and Sticky Footer in AddMemberForm

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

- [ ] **Step 1: Update form container and wrap content in scrollable div**

Modify the `<form>` and its children.
Change line 174:

```tsx
    <form id='add-member-form' action={action} className='space-y-6 p-6'>
```

to:

```tsx
    <form id='add-member-form' action={action} className='flex flex-col h-full max-h-[calc(100vh-120px)]'>
```

And wrap everything from line 175 to 414 in a scrollable `div`:

```tsx
<div className='flex-1 space-y-6 overflow-y-auto p-6'>
  <input type='hidden' name='organizationId' value={organizationId} />
  {editData && <input type='hidden' name='id' value={editData.id} />}

  <FieldGroup>{/* ... Data Diri section ... */}</FieldGroup>

  <FieldGroup>{/* ... Alamat section ... */}</FieldGroup>

  <FieldGroup>{/* ... Status & Sertifikasi section ... */}</FieldGroup>
</div>
```

- [ ] **Step 2: Implement Sticky Footer for buttons**

Replace lines 416-424:

```tsx
<div className='flex justify-end gap-3 pt-4'>
  <Button type='button' variant='outline' onClick={() => closeMemberSheet()}>
    Batal
  </Button>
  <Button type='submit' disabled={isPending}>
    {isPending && (
      <HugeiconsIcon icon={Loading03Icon} className='mr-2 animate-spin' />
    )}
    {editData ? 'Simpan Perubahan' : 'Simpan Kader'}
  </Button>
</div>
```

with:

```tsx
<div className='bg-background sticky bottom-0 flex justify-end gap-3 border-t p-6'>
  <Button type='button' variant='outline' onClick={() => closeMemberSheet()}>
    Batal
  </Button>
  <Button type='submit' disabled={isPending}>
    {isPending && (
      <HugeiconsIcon icon={Loading03Icon} className='mr-2 animate-spin' />
    )}
    {editData ? 'Simpan Perubahan' : 'Simpan Kader'}
  </Button>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx
git commit -m "fix: implement sticky footer and internal scrolling in AddMemberForm"
```

---

### Task 3: Reorganize Status & Certification Fields

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

- [ ] **Step 1: Update field order and alignment**

Replace the "Status & Sertifikasi" `FieldGroup` (lines 352-414) with the following:

```tsx
<FieldGroup>
  <div className='mb-4 text-sm font-medium'>Status & Sertifikasi</div>
  <div className='flex flex-col gap-4'>
    <Field className='flex items-center justify-between gap-4'>
      <FieldLabel htmlFor='isCertifiedMentor'>Pemandu</FieldLabel>
      <div className='flex items-center gap-2'>
        <Switch
          id='isCertifiedMentor'
          checked={isCertifiedMentor}
          onCheckedChange={setIsCertifiedMentor}
        />
        <input
          type='hidden'
          name='isCertifiedMentor'
          value={isCertifiedMentor ? 'true' : 'false'}
        />
      </div>
    </Field>
    <Field className='flex items-center justify-between gap-4'>
      <FieldLabel htmlFor='isCertifiedInstructor'>Instruktur</FieldLabel>
      <div className='flex items-center gap-2'>
        <Switch
          id='isCertifiedInstructor'
          checked={isCertifiedInstructor}
          onCheckedChange={setIsCertifiedInstructor}
        />
        <input
          type='hidden'
          name='isCertifiedInstructor'
          value={isCertifiedInstructor ? 'true' : 'false'}
        />
      </div>
    </Field>

    <div className='my-2' />

    <Field className='flex items-center justify-between gap-4'>
      <FieldLabel htmlFor='isAlumn'>Alumni</FieldLabel>
      <div className='flex items-center gap-2'>
        <Switch id='isAlumn' checked={isAlumn} onCheckedChange={setIsAlumn} />
        <input
          type='hidden'
          name='isAlumn'
          value={isAlumn ? 'true' : 'false'}
        />
      </div>
    </Field>
    <Field className='flex items-center justify-between gap-4'>
      <FieldLabel htmlFor='isNonActive'>Non-Aktif</FieldLabel>
      <div className='flex items-center gap-2'>
        <Switch
          id='isNonActive'
          checked={isNonActive}
          onCheckedChange={setIsNonActive}
        />
        <input
          type='hidden'
          name='isNonActive'
          value={isNonActive ? 'true' : 'false'}
        />
      </div>
    </Field>
    <Field className='flex items-center justify-between gap-4'>
      <FieldLabel htmlFor='isSuspended'>Skorsing</FieldLabel>
      <div className='flex items-center gap-2'>
        <Switch
          id='isSuspended'
          checked={isSuspended}
          onCheckedChange={setIsSuspended}
        />
        <input
          type='hidden'
          name='isSuspended'
          value={isSuspended ? 'true' : 'false'}
        />
      </div>
    </Field>
  </div>
</FieldGroup>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx
git commit -m "style: reorganize status and certification fields and fix alignment"
```
