# Profile History Sections: Riwayat Akademik, Karir & Organisasi

**Date:** 2026-06-01  
**Status:** Approved

## Overview

Add three new list-based history sections to the kader profile page:

1. **Riwayat Akademik** — academic records with university lookup via api.co.id
2. **Riwayat Karir** — career records (free-text institution)
3. **Riwayat Organisasi** — non-KAMMI organization records

All three sections sit between "Kontak & Alamat" and "Riwayat Dauroh" in the main content area. Add/edit/delete use a **Sheet** (not Dialog), visible only when `canEdit === true`.

---

## Database Schema

### `member_academic`

```sql
id               uuid PRIMARY KEY DEFAULT uuidv7()
member_id        uuid NOT NULL REFERENCES member(id)
degree           text NOT NULL  -- enum: 'd1','d2','d3','d4','s1','s2','s3','profesi'
study_program    text NOT NULL
institution_name text NOT NULL  -- denormalized for fast display
institution_data jsonb NOT NULL -- all fields from university API
year_start       integer NOT NULL
year_end         integer        -- NULL = ongoing
is_graduated     boolean NOT NULL
```

**degree enum values:** `d1`, `d2`, `d3`, `d4`, `s1`, `s2`, `s3`, `profesi`

**institution_data JSONB shape** (all fields from `GET /regional/indonesia/universities`):

```json
{
  "group": "UNIVERSITAS",
  "address": "JLN. SALEMBA RAYA NO. 4",
  "name": "UNIVERSITAS INDONESIA",
  "short_name": "UI",
  "province": "DKI JAKARTA",
  "province_code": "31",
  "regency": "KOTA ADM. JAKARTA PUSAT",
  "regency_code": "3171",
  "long": 106.8301,
  "lat": -6.3619,
  "university_type": "PERGURUAN TINGGI"
}
```

### `member_career`

```sql
id           uuid PRIMARY KEY DEFAULT uuidv7()
member_id    uuid NOT NULL REFERENCES member(id)
profession   text NOT NULL
company      text NOT NULL
year_start   integer NOT NULL
year_end     integer  -- NULL = ongoing
```

### `member_organization_history`

```sql
id            uuid PRIMARY KEY DEFAULT uuidv7()
member_id     uuid NOT NULL REFERENCES member(id)
position      text NOT NULL   -- Jabatan
organization  text NOT NULL   -- Nama Organisasi
year_start    integer NOT NULL
year_end      integer  -- NULL = ongoing
```

> Table named `member_organization_history` to avoid collision with existing `organization` table.

---

## API Layer: University Search

**File:** `src/lib/api/university.ts`

Same pattern as `src/lib/api/region.ts` — same base URL (`https://use.api.co.id`), same `x-api-co-id` header, same `API_CO_ID_TOKEN` env var.

```
GET /regional/indonesia/universities?name={query}
```

- `name`: case-insensitive partial match on university name or short name
- Pagination fixed at 100 items/page — no page param needed for search UX
- Cache: `force-cache` + `revalidate: 86400` (1 day — shorter than region since university data can change)

**Export:** `universityApi.search(name: string): Promise<UniversityItem[]>`

**Server action:** `fetchUniversitiesAction(name: string)` added to the profile action file — same pattern as `fetchProvincesAction` in the kader add-form.

---

## Database Query Layer

**`src/db/query/academic.ts`**

- `readMemberAcademic(memberId: string): Promise<MemberAcademic[]>`
- `createMemberAcademic(data, memberId): Promise<void>`
- `updateMemberAcademic(data, id, memberId): Promise<void>`
- `deleteMemberAcademic(id, memberId): Promise<void>`

**`src/db/query/career.ts`**

- `readMemberCareer(memberId: string): Promise<MemberCareer[]>`
- `createMemberCareer(data, memberId): Promise<void>`
- `updateMemberCareer(data, id, memberId): Promise<void>`
- `deleteMemberCareer(id, memberId): Promise<void>`

**`src/db/query/organization-history.ts`**

- `readMemberOrganizationHistory(memberId: string): Promise<MemberOrganizationHistory[]>`
- `createMemberOrganizationHistory(data, memberId): Promise<void>`
- `updateMemberOrganizationHistory(data, id, memberId): Promise<void>`
- `deleteMemberOrganizationHistory(id, memberId): Promise<void>`

---

## Server Actions

Added to `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/action.ts`:

- `fetchUniversitiesAction(name: string)` — proxies university API
- `createAcademicAction`, `updateAcademicAction`, `deleteAcademicAction`
- `createCareerAction`, `updateCareerAction`, `deleteCareerAction`
- `createOrganizationHistoryAction`, `updateOrganizationHistoryAction`, `deleteOrganizationHistoryAction`

All mutating actions: auth check → permission check (`canEditMember`) → Zod parse → DB write → `revalidatePath('/dashboard/profile')`.

---

## UI Components

### Layout (page.tsx)

Fetch academic, career, and organization history data server-side alongside existing queries. Pass to `ProfileInlineEditForm` as new props. Extend `ProfileEditContext` to carry all three lists.

### Page Layout (main content area)

```
Data Diri
Kontak & Alamat
Riwayat Akademik    ← new
Riwayat Karir       ← new
Riwayat Organisasi  ← new
Riwayat Dauroh      ← existing (moved down)
```

### Section Components

Each section (`academic-section`, `career-section`, `organization-section`) follows the same structure:

**View state:**

- `SectionDivider` with title + count badge
- Table listing entries (columns vary per section, see below)
- Empty state text if no entries
- "+ Tambah" button (visible only when `canEdit`)
- Each row has an edit icon/click handler

**Edit state (Sheet):**

- Sheet opens from the right
- Form inside Sheet handles both add and edit (pre-filled for edit)
- "Hapus" button inside Sheet with inline confirm (two-step: click → confirm text appears)
- On submit: calls server action, closes sheet on success, shows toast

### Academic Section Table Columns

| NIK | Jenjang | Program Studi      | Institusi                  | Tahun     | Status |
| --- | ------- | ------------------ | -------------------------- | --------- | ------ |
| —   | S1      | Teknik Informatika | Universitas Indonesia (UI) | 2020–2024 | Lulus  |

### Career Section Table Columns

| Profesi           | Perusahaan       | Tahun         |
| ----------------- | ---------------- | ------------- |
| Software Engineer | PT. Maju Bersama | 2022–sekarang |

### Organization History Table Columns

| Jabatan | Organisasi            | Tahun     |
| ------- | --------------------- | --------- |
| Ketua   | HMI Komisariat Teknik | 2021–2022 |

### University Combobox (`university-combobox/`)

New component mirroring `RegionCombobox`:

- Search input inside a Popover
- Debounced fetch via `fetchUniversitiesAction` on input change (≥2 chars)
- Shows `name (short_name)` in list, e.g. "UNIVERSITAS INDONESIA (UI)"
- On select: stores full `institution_data` as JSON in hidden input, `institution_name` in another hidden input

### Sheet Form: Riwayat Akademik

Fields (in order):

1. **Jenjang** — Select with 8 options:
   - Diploma 1 (D1), Diploma 2 (D2), Diploma 3 (D3), Diploma 4/Sarjana Terapan (D4), Sarjana (S1), Magister (S2), Doktor (S3), Profesi/Spesialis
2. **Program Studi** — Input text
3. **Institusi** — `UniversityCombobox` (search-as-you-type)
4. **Tahun Mulai** — Input number
5. **Tahun Selesai** — Input number, optional (placeholder: "Masih berjalan")
6. **Lulus** — Checkbox:
   - Default `true` when year_end is filled, `false` when empty
   - Auto-updates when year_end changes, but user can override

### Sheet Form: Riwayat Karir

Fields:

1. **Profesi** — Input text
2. **Perusahaan/Institusi** — Input text
3. **Tahun Mulai** — Input number
4. **Tahun Selesai** — Input number, optional

### Sheet Form: Riwayat Organisasi

Fields:

1. **Jabatan** — Input text
2. **Nama Organisasi** — Input text
3. **Tahun Mulai** — Input number
4. **Tahun Selesai** — Input number, optional

---

## Permission

Follows existing `canEdit` flag from `ProfileEditProvider` context — same as "Edit Profil" button. No separate permission layer needed.

---

## Files Created / Modified

```
src/db/schema/academic.sql.ts                          NEW
src/db/schema/career.sql.ts                            NEW
src/db/schema/organization-history.sql.ts              NEW
src/db/query/academic.ts                               NEW
src/db/query/career.ts                                 NEW
src/db/query/organization-history.ts                   NEW
src/lib/api/university.ts                              NEW

src/app/(dashboard)/dashboard/profile/[registerNumber]/
  page.tsx                                             MODIFIED
  _components/action.ts                                MODIFIED
  _components/profile-edit-context/
    profile-edit-context.tsx                           MODIFIED
  _components/profile-inline-edit-form/
    profile-inline-edit-form.tsx                       MODIFIED
  _components/university-combobox/
    university-combobox.tsx                            NEW
    index.ts                                           NEW
  _components/academic-section/
    academic-section.tsx                               NEW
    index.ts                                           NEW
  _components/career-section/
    career-section.tsx                                 NEW
    index.ts                                           NEW
  _components/organization-section/
    organization-section.tsx                           NEW
    index.ts                                           NEW
```

---

## Migration

Run `bun db:push` (or generate + migrate) after adding the three new schema files. No seed data required.
