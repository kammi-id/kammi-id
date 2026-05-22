---
name: Add Member Form Layout and Field Refactor
description: Fix overflow issue with Submit button and reorganize Status & Certification fields in AddMemberForm.
type: design
date: 2026-04-20
---

# Design: Add Member Form Layout and Field Refactor

## Problem Statement

1. **UI Overflow**: The "Simpan" (Submit) button in `AddMemberForm` is hidden at the bottom of the sheet when the form content is long, because the entire form is wrapped in a `ScrollArea` from the parent component.
2. **Field Alignment**: The "Status & Sertifikasi" fields need to be consistently aligned with labels on the left and switches on the right, with a specific order.

## Proposed Solution

### 1. Layout Structure Overhaul (Fix Overflow)

Shift the scrolling responsibility from the parent component to the form itself to allow for a sticky footer.

#### Changes in `src/app/(dashboard)/dashboard/members/_components/individual-table.tsx`

- Remove the `<ScrollArea>` component that wraps `<AddMemberForm />`.
- Ensure the `SheetContent` provides a stable height for the form to fill.

#### Changes in `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

- Update the `<form>` element to use a flexbox layout:
  - `className='flex flex-col h-full max-h-[calc(100vh-120px)]'` (or similar height constraint based on sheet header).
- Wrap all input sections (Data Diri, Alamat, Status & Sertifikasi) in a scrollable container:
  - `<div className='flex-1 overflow-y-auto p-6 space-y-6'>`
- Move the action buttons (Batal, Simpan) into a sticky footer:
  - `<div className='flex justify-end gap-3 p-6 border-t bg-background sticky bottom-0'>`

### 2. Status & Certification Field Reorganization

Ensure a strict order and visual consistency for the certification and status switches.

#### Field Order

1. **Pemandu** (`isCertifiedMentor`)
2. **Instruktur** (`isCertifiedInstructor`)
3. _Visual Separator_ (`<div className='my-2' />`)
4. **Alumni** (`isAlumn`)
5. **Non-Aktif** (`isNonActive`)
6. **Skorsing** (`isSuspended`)

#### Visual Layout

Each field row must use:

- `className='flex items-center justify-between gap-4'`
- This ensures the `FieldLabel` is pushed to the left and the `Switch` (inside a div) is pushed to the right.

## Acceptance Criteria

- [ ] The "Simpan" and "Batal" buttons are always visible at the bottom of the sheet regardless of content length.
- [ ] The "Status & Sertifikasi" fields follow the specified order.
- [ ] All switches in the "Status & Sertifikasi" section are aligned to the right.
- [ ] No regressions in form submission or data handling.
