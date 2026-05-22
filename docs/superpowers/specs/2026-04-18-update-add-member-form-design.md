---
name: Update Add Member Form
description: Expansion of the Add Member form to include complete address and membership status fields.
date: 2026-04-18
status: approved
---

# Design Spec: Update Add Member Form

## Overview

Expand the `AddMemberForm` to align with the `member` database schema, ensuring all necessary data (especially mandatory fields) are captured and correctly mapped.

## Requirements

- **Register Number:** Handled automatically by the server (no UI field needed).
- **Year of Entry:** Limited between 1998 and current year (2026).
- **Address:**
  - Cascading selection for Province, City, District, and Subdistrict.
  - UI uses Comboboxes.
  - Hidden fields for corresponding codes (`*Code`).
  - Text input for detailed address line.
- **Membership Status:**
  - Boolean flags for `isAlumn`, `isSuspended`, `isNonActive`, `isCertifiedMentor`, `isCertifiedInstructor`.
  - UI uses Switches.

## Architecture & Data Flow

### Client-to-Server Flow

1. User fills the form in the `AddMemberForm` component.
2. For address fields, selection in a Combobox triggers a state update (and future API call) to update the corresponding hidden `*Code` input.
3. Form submission sends `FormData` to `createMemberAction` or `updateMemberAction`.
4. Server action validates data using Zod.
5. Data is persisted to the `member` table via Drizzle ORM.

### Component Structure

The form is divided into three logical groups using `FieldGroup`:

#### 1. Data Diri (Basic Info)

- `name` (Text, Required)
- `gender` (Select: ikhwan/akhwat)
- `status` (Select: ab1/ab2/ab3)
- `phone` (Text)
- `yearOfEntry` (Number, Required, range: 1998 - current year)

#### 2. Alamat (Address)

- `addressProvince` (Combobox) $\rightarrow$ `addressProvinceCode` (Hidden)
- `addressCity` (Combobox) $\rightarrow$ `addressCityCode` (Hidden)
- `addressDistrict` (Combobox) $\rightarrow$ `addressDistrictCode` (Hidden)
- `addressSubdistrict` (Combobox) $\rightarrow$ `addressSubdistrictCode` (Hidden)
- `addressLine` (Text)

#### 3. Status & Sertifikasi (Membership Flags)

- `isAlumn` (Switch)
- `isSuspended` (Switch)
- `isNonActive` (Switch)
- `isCertifiedMentor` (Switch)
- `isCertifiedInstructor` (Switch)

## Technical Implementation Details

### Validation (Zod)

Update `memberSchema` in `action.ts` to include:

- All address fields (optional/required based on business rules).
- All boolean flags as `z.coerce.boolean()`.
- `yearOfEntry` validation: `.min(1998).max(new Date().getFullYear())`.

### UI Components (Shadcn)

- **Combobox:** Follow Shadcn UI pattern (Popover + Command).
- **Switch:** Standard Shadcn Switch component.
- **Grouping:** Use `FieldGroup` for visual separation.

## Testing Plan

- **Positive Case:** Fill all fields $\rightarrow$ verify DB entry including automatically generated `registerNumber`.
- **Range Case:** Test `yearOfEntry` with 1997 (should fail) and 2027 (should fail).
- **Cascading Case:** Change Province $\rightarrow$ verify City options update.
- **Boolean Case:** Toggle Switches $\rightarrow$ verify `true`/`false` values in DB.
- **Edit Case:** Load existing member $\rightarrow$ verify all fields (including switches/comboboxes) are correctly populated.
