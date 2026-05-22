# Update Add Member Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the "Add Member" form to include complete address and membership status fields, ensuring alignment with the database schema and providing a modern UI using Shadcn Combobox and Switch components.

**Architecture:**
The form will be expanded linearly with three logical groups: Basic Info, Address (Cascading Comboboxes), and Status/Certifications (Switches). Hidden fields will be used for address codes. State management for the form will be handled by React's `useActionState` and `FormData`.

**Tech Stack:** Next.js 16, React, Shadcn UI (Combobox, Switch, FieldGroup), Zod, Drizzle ORM.

---

## File Mapping

- **Modify:** `src/app/(dashboard)/dashboard/members/_components/add-form/action.ts` - Update Zod schema and server actions to handle new fields.
- **Modify:** `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx` - Update UI to include new fields and groups.
- **Modify:** `src/app/(dashboard)/dashboard/members/_components/add-form/store.ts` - Update `memberEditData` type if necessary to support new fields.

---

## Tasks

### Task 1: Update Server Action Schema and Logic

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/action.ts`

- [ ] **Step 1: Update `memberSchema` to include address and boolean flags.**

```tsx
const memberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nama wajib diisi.'),
  gender: z.enum(['ikhwan', 'akhwat']),
  status: z.enum(['ab1', 'ab2', 'ab3']),
  yearOfEntry: z.coerce.number().min(1998).max(new Date().getFullYear()),
  organizationId: z.string().uuid(),
  phone: z.string().optional().nullable(),
  // Address fields
  addressProvince: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressDistrict: z.string().optional().nullable(),
  addressSubdistrict: z.string().optional().nullable(),
  addressProvinceCode: z.string().optional().nullable(),
  addressCityCode: z.string().optional().nullable(),
  addressDistrictCode: z.string().optional().nullable(),
  addressSubdistrictCode: z.string().optional().nullable(),
  addressLine: z.string().optional().nullable(),
  // Boolean flags
  isAlumn: z.coerce.boolean().default(false),
  isSuspended: z.coerce.boolean().default(false),
  isNonActive: z.coerce.boolean().default(false),
  isCertifiedMentor: z.coerce.boolean().default(false),
  isCertifiedInstructor: z.coerce.boolean().default(false)
})
```

- [ ] **Step 2: Update `createMemberAction` to use validated data for flags.**

```tsx
// In createMemberAction try block:
await createMember({
  ...validated.data,
  registerNumber
  // Remove hardcoded defaults if they are now part of validated.data
})
```

- [ ] **Step 3: Update `updateMemberAction` to ensure boolean flags are handled.**

```tsx
// Ensure the schema handles the coercion of boolean flags correctly.
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/action.ts
git commit -m "refactor: update member schema and actions to include address and status flags"
```

### Task 2: Update AddMemberForm UI - Basic Info & Structure

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

- [ ] **Step 1: Wrap the form in `FieldGroup` sections.**

```tsx
// Divide the form into 3 sections: Data Diri, Alamat, Status & Sertifikasi
```

- [ ] **Step 2: Update `yearOfEntry` input constraints.**

```tsx
<Input
  id='yearOfEntry'
  name='yearOfEntry'
  type='number'
  min='1998'
  max={new Date().getFullYear()}
  defaultValue={editData?.yearOfEntry ?? new Date().getFullYear()}
  required
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx
git commit -m "feat: structure AddMemberForm into groups and constrain yearOfEntry"
```

### Task 3: Implement Address Fields (Comboboxes & Hidden Inputs)

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

- [ ] **Step 1: Implement `addressProvince` Combobox.**

```tsx
// Use Shadcn UI Combobox pattern (Popover + Command)
// Add <input type='hidden' name='addressProvinceCode' value={provinceCode} />
```

- [ ] **Step 2: Implement `addressCity` Combobox.**

```tsx
// Dependent on addressProvince selection
```

- [ ] **Step 3: Implement `addressDistrict` Combobox.**

```/>

```

- [ ] **Step 4: Implement `addressSubdistrict` Combobox.**

```/>

```

- [ ] **Step 5: Implement `addressLine` Input.**

```tsx
<Field>
  <FieldLabel htmlFor='addressLine'>Alamat Lengkap</FieldLabel>
  <Input
    id='addressLine'
    name='addressLine'
    placeholder='Nama jalan, nomor rumah, RT/RW'
    defaultValue={editData?.addressLine ?? ''}
  />
</Field>
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx
git commit -m "feat: add cascading address fields with hidden codes"
```

### Task 4: Implement Status & Certification Flags (Switches)

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`

HINT: Since `FormData` doesn't handle boolean switches well (they only send value if checked), I'll use a hidden input for the boolean value.

- [ ] **Step 1: Implement `isAlumn` Switch.**

```tsx
<Field>
  <FieldLabel>Alumni</FieldLabel>
  <Switch
    id='isAlumn'
    checked={editData?.isAlumn ?? false}
    onCheckedChange={(checked) => {
      // Update hidden input value or handle via state
    }}
  />
  <input
    type='hidden'
    name='isAlumn'
    value={editData?.isAlumn ? 'true' : 'false'}
  />
</Field>
```

- [ ] **Step 2: Implement `isSuspended` Switch.**
- [ ] **Step 3: Implement `isNonActive` Switch.**
- [ ] **Step 4: Implement `isCertifiedMentor` Switch.**
- [ ] **Step 5: Implement `isCertifiedInstructor` Switch.**
- [ ] **Step 6: Commit**

```bash
git add src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx
git commit -m "feat: add membership status flags using switches"
```

### Task 5: Final Verification & Cleanup

**Files:**

- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/index.tsx`
- Modify: `src/app/(dashboard)/dashboard/members/_components/add-form/action.ts`

- [ ] **Step 1: Verify all field names match the database schema exactly.**
- [ ] **Step 2: Run a test submission to verify `registerNumber` is still generated.**
- [ ] **Step 3: Commit final cleanup**

```bash
git add .
git commit -m "chore: final cleanup of Add Member form"
```
