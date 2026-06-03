# Profile History Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Riwayat Akademik, Riwayat Karir, and Riwayat Organisasi sections to the kader profile page, each backed by a dedicated DB table and featuring add/edit/delete via Sheet.

**Architecture:** Three new Drizzle tables, three new query files, three new section components with self-contained Sheet forms and per-section server action files. Data fetched server-side in `page.tsx` and distributed via the existing `ProfileEditContext`. University institution search uses api.co.id via a new `UniversityCombobox` component.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (bun-sql), PostgreSQL, Zod, BaseUI-backed shadcn/ui (Sheet, Select, Checkbox, Combobox), api.co.id, sonner toasts.

---

## File Map

| Action | Path |
|--------|------|
| CREATE | `src/db/schema/academic.sql.ts` |
| CREATE | `src/db/schema/career.sql.ts` |
| CREATE | `src/db/schema/organization-history.sql.ts` |
| CREATE | `src/db/query/academic.ts` |
| CREATE | `src/db/query/career.ts` |
| CREATE | `src/db/query/organization-history.ts` |
| CREATE | `src/lib/api/university.ts` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox/university-combobox.tsx` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox/action.ts` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox/index.ts` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/academic-section.tsx` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/action.ts` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/index.ts` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section/career-section.tsx` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section/action.ts` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section/index.ts` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/organization-section.tsx` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/action.ts` |
| CREATE | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/index.ts` |
| MODIFY | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-edit-context/profile-edit-context.tsx` |
| MODIFY | `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-inline-edit-form/profile-inline-edit-form.tsx` |
| MODIFY | `src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx` |

---

## Task 1: DB Schema — Three New Tables

**Files:**
- Create: `src/db/schema/academic.sql.ts`
- Create: `src/db/schema/career.sql.ts`
- Create: `src/db/schema/organization-history.sql.ts`

- [ ] **Step 1: Create `src/db/schema/academic.sql.ts`**

```ts
import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { member } from './member.sql'

export const memberAcademic = pgTable('member_academic', (t) => ({
  id: t
    .uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  memberId: t
    .uuid('member_id')
    .notNull()
    .references(() => member.id),
  degree: t
    .text('degree', {
      enum: ['d1', 'd2', 'd3', 'd4', 's1', 's2', 's3', 'profesi']
    })
    .notNull(),
  studyProgram: t.text('study_program').notNull(),
  institutionName: t.text('institution_name').notNull(),
  institutionData: t.jsonb('institution_data').notNull(),
  yearStart: t.integer('year_start').notNull(),
  yearEnd: t.integer('year_end'),
  isGraduated: t.boolean('is_graduated').notNull()
}))
```

- [ ] **Step 2: Create `src/db/schema/career.sql.ts`**

```ts
import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { member } from './member.sql'

export const memberCareer = pgTable('member_career', (t) => ({
  id: t
    .uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  memberId: t
    .uuid('member_id')
    .notNull()
    .references(() => member.id),
  profession: t.text('profession').notNull(),
  company: t.text('company').notNull(),
  yearStart: t.integer('year_start').notNull(),
  yearEnd: t.integer('year_end')
}))
```

- [ ] **Step 3: Create `src/db/schema/organization-history.sql.ts`**

```ts
import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { member } from './member.sql'

export const memberOrganizationHistory = pgTable(
  'member_organization_history',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    memberId: t
      .uuid('member_id')
      .notNull()
      .references(() => member.id),
    position: t.text('position').notNull(),
    organization: t.text('organization').notNull(),
    yearStart: t.integer('year_start').notNull(),
    yearEnd: t.integer('year_end')
  })
)
```

- [ ] **Step 4: Push schema to database**

```bash
bun db:push
```

Expected: Drizzle prompts to create 3 new tables — confirm each. Final output: `Your schema is now in sync with the database.`

- [ ] **Step 5: Commit**

```bash
git add src/db/schema/academic.sql.ts src/db/schema/career.sql.ts src/db/schema/organization-history.sql.ts
git commit -m "feat(db): add member_academic, member_career, member_organization_history tables"
```

---

## Task 2: University API Lib + Fetch Action

**Files:**
- Create: `src/lib/api/university.ts`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox/action.ts`

- [ ] **Step 1: Create `src/lib/api/university.ts`**

```ts
export interface UniversityItem {
  group: string
  address: string
  name: string
  short_name: string
  province: string
  province_code: string
  regency: string
  regency_code: string
  long: number
  lat: number
  university_type: string
}

interface UniversityApiResponse {
  data: UniversityItem[]
  is_success: boolean
  message: string
}

const BASE_URL = 'https://use.api.co.id'

export const universityApi = {
  async search(name: string): Promise<UniversityItem[]> {
    const token = process.env.API_CO_ID_TOKEN
    if (!token) throw new Error('API_CO_ID_TOKEN is missing')

    const url = `${BASE_URL}/regional/indonesia/universities?name=${encodeURIComponent(name)}`
    const response = await fetch(url, {
      headers: {
        'x-api-co-id': token,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 86400 }
    })

    if (!response.ok) {
      throw new Error(`University API error: ${response.status} ${response.statusText}`)
    }

    const result = (await response.json()) as UniversityApiResponse
    if (!result.is_success) {
      throw new Error(result.message || 'API returned is_success: false')
    }
    return result.data
  }
}
```

- [ ] **Step 2: Create university-combobox directory and action**

```bash
mkdir -p "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox"
```

- [ ] **Step 3: Write `university-combobox/action.ts`**

```ts
'use server'

import { universityApi, type UniversityItem } from '~/lib/api/university'

export type FetchUniversitiesResult =
  | { success: true; data: UniversityItem[] }
  | { success: false; message: string }

export const fetchUniversitiesAction = async (
  name: string
): Promise<FetchUniversitiesResult> => {
  try {
    const data = await universityApi.search(name)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal memuat data universitas.'
    }
  }
}
```

- [ ] **Step 4: Verify type check passes**

```bash
bun check:types
```

Expected: No errors related to the new files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/university.ts "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox/action.ts"
git commit -m "feat(api): add university search API lib and server action"
```

---

## Task 3: UniversityCombobox Component

**Files:**
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox/university-combobox.tsx`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox/index.ts`

- [ ] **Step 1: Write `university-combobox.tsx`**

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { fetchUniversitiesAction } from './action'
import type { UniversityItem } from '~/lib/api/university'

interface UniversityComboboxProps {
  nameField: string
  dataField: string
  defaultInstitutionName?: string
  defaultInstitutionData?: UniversityItem | null
}

export const UniversityCombobox = ({
  nameField,
  dataField,
  defaultInstitutionName = '',
  defaultInstitutionData = null
}: UniversityComboboxProps) => {
  const [query, setQuery] = useState(defaultInstitutionName)
  const [results, setResults] = useState<UniversityItem[]>([])
  const [selected, setSelected] = useState<UniversityItem | null>(defaultInstitutionData)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetchUniversitiesAction(query)
      setLoading(false)
      if (res.success) setResults(res.data)
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleValueChange = (name: string | null) => {
    if (!name) {
      setSelected(null)
      return
    }
    const uni = results.find((r) => r.name === name) ?? null
    setSelected(uni)
    if (uni) setQuery(uni.name)
  }

  return (
    <>
      <Combobox value={selected?.name ?? ''} onValueChange={handleValueChange}>
        <ComboboxInput
          placeholder='Cari nama institusi...'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ComboboxContent>
          <ComboboxList>
            {loading ? (
              <div className='text-muted-foreground animate-pulse p-4 text-center text-sm'>
                Mencari...
              </div>
            ) : results.length === 0 ? (
              <ComboboxEmpty>
                {query.length < 2
                  ? 'Ketik minimal 2 karakter.'
                  : 'Institusi tidak ditemukan.'}
              </ComboboxEmpty>
            ) : (
              <ComboboxGroup>
                {results.map((uni) => (
                  <ComboboxItem key={`${uni.name}-${uni.regency_code}`} value={uni.name}>
                    {uni.name}
                    {uni.short_name && uni.short_name !== uni.name && (
                      <span className='text-muted-foreground ml-1 text-xs'>
                        ({uni.short_name})
                      </span>
                    )}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <input type='hidden' name={nameField} value={selected?.name ?? ''} />
      <input
        type='hidden'
        name={dataField}
        value={selected ? JSON.stringify(selected) : ''}
      />
    </>
  )
}
```

- [ ] **Step 2: Write `university-combobox/index.ts`**

```ts
export * from './university-combobox'
```

- [ ] **Step 3: Type check**

```bash
bun check:types
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/university-combobox/"
git commit -m "feat(profile): add UniversityCombobox component with debounced search"
```

---

## Task 4: Academic — Query Layer + Server Actions

**Files:**
- Create: `src/db/query/academic.ts`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/action.ts`

- [ ] **Step 1: Write `src/db/query/academic.ts`**

```ts
import { db } from '../db'
import { memberAcademic } from '../schema/academic.sql'
import { and, eq, desc } from 'drizzle-orm'

export type MemberAcademic = typeof memberAcademic.$inferSelect

export type MemberAcademicInsert = {
  degree: 'd1' | 'd2' | 'd3' | 'd4' | 's1' | 's2' | 's3' | 'profesi'
  studyProgram: string
  institutionName: string
  institutionData: Record<string, unknown>
  yearStart: number
  yearEnd: number | null
  isGraduated: boolean
}

export const readMemberAcademic = async (
  memberId: string
): Promise<MemberAcademic[]> => {
  return db
    .select()
    .from(memberAcademic)
    .where(eq(memberAcademic.memberId, memberId))
    .orderBy(desc(memberAcademic.yearStart))
}

export const createMemberAcademic = async (
  data: MemberAcademicInsert,
  memberId: string
): Promise<void> => {
  await db.insert(memberAcademic).values({ ...data, memberId })
}

export const updateMemberAcademic = async (
  data: MemberAcademicInsert,
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .update(memberAcademic)
    .set(data)
    .where(and(eq(memberAcademic.id, id), eq(memberAcademic.memberId, memberId)))
}

export const deleteMemberAcademic = async (
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .delete(memberAcademic)
    .where(and(eq(memberAcademic.id, id), eq(memberAcademic.memberId, memberId)))
}
```

- [ ] **Step 2: Create `academic-section/` directory**

```bash
mkdir -p "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section"
```

- [ ] **Step 3: Write `academic-section/action.ts`**

```ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  createMemberAcademic,
  updateMemberAcademic,
  deleteMemberAcademic
} from '~/db/query/academic'

export type AcademicActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const degreeEnum = ['d1', 'd2', 'd3', 'd4', 's1', 's2', 's3', 'profesi'] as const

const academicSchema = z.object({
  id: z.string().uuid().optional(),
  degree: z.enum(degreeEnum),
  studyProgram: z.string().min(1, 'Program studi wajib diisi.'),
  institutionName: z.string().min(1, 'Institusi wajib diisi.'),
  institutionData: z.string().min(1, 'Data institusi wajib diisi.').transform((val, ctx) => {
    try {
      return JSON.parse(val) as Record<string, unknown>
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data institusi tidak valid.' })
      return z.NEVER
    }
  }),
  yearStart: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  yearEnd: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z.coerce.number().int().min(1900).max(new Date().getFullYear() + 10).nullable()
  ),
  isGraduated: z.preprocess((val) => val === 'true' || val === true, z.boolean())
})

const canEdit = (
  session: { user: { role: string; connectedMember?: { id: string } | null } },
  memberId: string
) => {
  const { role, connectedMember } = session.user
  if (role === 'root' || role === 'bpk') return true
  if (role === 'member' && connectedMember?.id === memberId) return true
  return false
}

export const saveAcademicAction = async (
  memberId: string,
  prevState: AcademicActionState,
  formData: FormData
): Promise<AcademicActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = academicSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { id, ...data } = parsed.data
  if (id) {
    await updateMemberAcademic(data, id, memberId)
  } else {
    await createMemberAcademic(data, memberId)
  }

  revalidatePath(`/dashboard/profile/${memberId}`)
  return { success: true, message: id ? 'Data akademik diperbarui.' : 'Data akademik ditambahkan.' }
}

export const deleteAcademicAction = async (
  memberId: string,
  id: string
): Promise<AcademicActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  await deleteMemberAcademic(id, memberId)
  revalidatePath(`/dashboard/profile/${memberId}`)
  return { success: true, message: 'Data akademik dihapus.' }
}
```

- [ ] **Step 4: Type check**

```bash
bun check:types
```

- [ ] **Step 5: Commit**

```bash
git add src/db/query/academic.ts "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/action.ts"
git commit -m "feat(profile): add academic query layer and server actions"
```

---

## Task 5: Career — Query Layer + Server Actions

**Files:**
- Create: `src/db/query/career.ts`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section/action.ts`

- [ ] **Step 1: Write `src/db/query/career.ts`**

```ts
import { db } from '../db'
import { memberCareer } from '../schema/career.sql'
import { and, eq, desc } from 'drizzle-orm'

export type MemberCareer = typeof memberCareer.$inferSelect

export type MemberCareerInsert = {
  profession: string
  company: string
  yearStart: number
  yearEnd: number | null
}

export const readMemberCareer = async (memberId: string): Promise<MemberCareer[]> => {
  return db
    .select()
    .from(memberCareer)
    .where(eq(memberCareer.memberId, memberId))
    .orderBy(desc(memberCareer.yearStart))
}

export const createMemberCareer = async (
  data: MemberCareerInsert,
  memberId: string
): Promise<void> => {
  await db.insert(memberCareer).values({ ...data, memberId })
}

export const updateMemberCareer = async (
  data: MemberCareerInsert,
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .update(memberCareer)
    .set(data)
    .where(and(eq(memberCareer.id, id), eq(memberCareer.memberId, memberId)))
}

export const deleteMemberCareer = async (
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .delete(memberCareer)
    .where(and(eq(memberCareer.id, id), eq(memberCareer.memberId, memberId)))
}
```

- [ ] **Step 2: Create `career-section/` directory**

```bash
mkdir -p "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section"
```

- [ ] **Step 3: Write `career-section/action.ts`**

```ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { createMemberCareer, updateMemberCareer, deleteMemberCareer } from '~/db/query/career'

export type CareerActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const careerSchema = z.object({
  id: z.string().uuid().optional(),
  profession: z.string().min(1, 'Profesi wajib diisi.'),
  company: z.string().min(1, 'Perusahaan wajib diisi.'),
  yearStart: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  yearEnd: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z.coerce.number().int().min(1900).max(new Date().getFullYear() + 10).nullable()
  )
})

const canEdit = (
  session: { user: { role: string; connectedMember?: { id: string } | null } },
  memberId: string
) => {
  const { role, connectedMember } = session.user
  if (role === 'root' || role === 'bpk') return true
  if (role === 'member' && connectedMember?.id === memberId) return true
  return false
}

export const saveCareerAction = async (
  memberId: string,
  prevState: CareerActionState,
  formData: FormData
): Promise<CareerActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = careerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { id, ...data } = parsed.data
  if (id) {
    await updateMemberCareer(data, id, memberId)
  } else {
    await createMemberCareer(data, memberId)
  }

  revalidatePath(`/dashboard/profile/${memberId}`)
  return { success: true, message: id ? 'Riwayat karir diperbarui.' : 'Riwayat karir ditambahkan.' }
}

export const deleteCareerAction = async (
  memberId: string,
  id: string
): Promise<CareerActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  await deleteMemberCareer(id, memberId)
  revalidatePath(`/dashboard/profile/${memberId}`)
  return { success: true, message: 'Riwayat karir dihapus.' }
}
```

- [ ] **Step 4: Type check**

```bash
bun check:types
```

- [ ] **Step 5: Commit**

```bash
git add src/db/query/career.ts "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section/action.ts"
git commit -m "feat(profile): add career query layer and server actions"
```

---

## Task 6: Organization History — Query Layer + Server Actions

**Files:**
- Create: `src/db/query/organization-history.ts`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/action.ts`

- [ ] **Step 1: Write `src/db/query/organization-history.ts`**

```ts
import { db } from '../db'
import { memberOrganizationHistory } from '../schema/organization-history.sql'
import { and, eq, desc } from 'drizzle-orm'

export type MemberOrganizationHistory = typeof memberOrganizationHistory.$inferSelect

export type MemberOrganizationHistoryInsert = {
  position: string
  organization: string
  yearStart: number
  yearEnd: number | null
}

export const readMemberOrganizationHistory = async (
  memberId: string
): Promise<MemberOrganizationHistory[]> => {
  return db
    .select()
    .from(memberOrganizationHistory)
    .where(eq(memberOrganizationHistory.memberId, memberId))
    .orderBy(desc(memberOrganizationHistory.yearStart))
}

export const createMemberOrganizationHistory = async (
  data: MemberOrganizationHistoryInsert,
  memberId: string
): Promise<void> => {
  await db.insert(memberOrganizationHistory).values({ ...data, memberId })
}

export const updateMemberOrganizationHistory = async (
  data: MemberOrganizationHistoryInsert,
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .update(memberOrganizationHistory)
    .set(data)
    .where(
      and(
        eq(memberOrganizationHistory.id, id),
        eq(memberOrganizationHistory.memberId, memberId)
      )
    )
}

export const deleteMemberOrganizationHistory = async (
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .delete(memberOrganizationHistory)
    .where(
      and(
        eq(memberOrganizationHistory.id, id),
        eq(memberOrganizationHistory.memberId, memberId)
      )
    )
}
```

- [ ] **Step 2: Create `organization-section/` directory**

```bash
mkdir -p "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section"
```

- [ ] **Step 3: Write `organization-section/action.ts`**

```ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  createMemberOrganizationHistory,
  updateMemberOrganizationHistory,
  deleteMemberOrganizationHistory
} from '~/db/query/organization-history'

export type OrgHistoryActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

const orgHistorySchema = z.object({
  id: z.string().uuid().optional(),
  position: z.string().min(1, 'Jabatan wajib diisi.'),
  organization: z.string().min(1, 'Nama organisasi wajib diisi.'),
  yearStart: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  yearEnd: z.preprocess(
    (val) => (val === '' || val == null ? null : val),
    z.coerce.number().int().min(1900).max(new Date().getFullYear() + 10).nullable()
  )
})

const canEdit = (
  session: { user: { role: string; connectedMember?: { id: string } | null } },
  memberId: string
) => {
  const { role, connectedMember } = session.user
  if (role === 'root' || role === 'bpk') return true
  if (role === 'member' && connectedMember?.id === memberId) return true
  return false
}

export const saveOrgHistoryAction = async (
  memberId: string,
  prevState: OrgHistoryActionState,
  formData: FormData
): Promise<OrgHistoryActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData.entries())
  const parsed = orgHistorySchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { id, ...data } = parsed.data
  if (id) {
    await updateMemberOrganizationHistory(data, id, memberId)
  } else {
    await createMemberOrganizationHistory(data, memberId)
  }

  revalidatePath(`/dashboard/profile/${memberId}`)
  return {
    success: true,
    message: id ? 'Riwayat organisasi diperbarui.' : 'Riwayat organisasi ditambahkan.'
  }
}

export const deleteOrgHistoryAction = async (
  memberId: string,
  id: string
): Promise<OrgHistoryActionState> => {
  const session = await readActiveSession()
  if (!session) return { success: false, message: 'Tidak terautentikasi.' }
  if (!canEdit(session, memberId)) return { success: false, message: 'Akses ditolak.' }

  await deleteMemberOrganizationHistory(id, memberId)
  revalidatePath(`/dashboard/profile/${memberId}`)
  return { success: true, message: 'Riwayat organisasi dihapus.' }
}
```

- [ ] **Step 4: Type check**

```bash
bun check:types
```

- [ ] **Step 5: Commit**

```bash
git add src/db/query/organization-history.ts "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/action.ts"
git commit -m "feat(profile): add organization history query layer and server actions"
```

---

## Task 7: Extend ProfileEditContext + page.tsx

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-edit-context/profile-edit-context.tsx`
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx`

- [ ] **Step 1: Update `profile-edit-context.tsx`** — add the three new lists to context

Replace the entire file content:

```tsx
'use client'

import { createContext, use } from 'react'
import type { Member } from '~/db/query/member'
import type { MemberTrainingHistory } from '~/db/query/training'
import type { MemberAcademic } from '~/db/query/academic'
import type { MemberCareer } from '~/db/query/career'
import type { MemberOrganizationHistory } from '~/db/query/organization-history'

interface ProfileEditContextValue {
  member: Member
  trainingHistory: MemberTrainingHistory
  academicHistory: MemberAcademic[]
  careerHistory: MemberCareer[]
  organizationHistory: MemberOrganizationHistory[]
  canEdit: boolean
  isEditing: boolean
  isPending: boolean
  fieldErrors?: Record<string, string[]>
}

const ProfileEditContext = createContext<ProfileEditContextValue | null>(null)

export const ProfileEditProvider = ProfileEditContext.Provider

export const useProfileEdit = (): ProfileEditContextValue => {
  const ctx = use(ProfileEditContext)
  if (!ctx)
    throw new Error('useProfileEdit must be used within ProfileEditProvider')
  return ctx
}
```

- [ ] **Step 2: Update `page.tsx`** — fetch three new datasets and pass to form

Replace the entire file content:

```tsx
import { notFound } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { readMemberByRegisterNumber } from '~/db/query/member'
import { readMemberTrainingHistory } from '~/db/query/training'
import { readOrgHierarchyChain } from '~/db/query/organization'
import { readMemberAcademic } from '~/db/query/academic'
import { readMemberCareer } from '~/db/query/career'
import { readMemberOrganizationHistory } from '~/db/query/organization-history'
import { ProfileInlineEditForm } from './_components/profile-inline-edit-form'
import { ProfileOrgHierarchy } from './_components/profile-org-hierarchy'
import { ResetPasswordButton } from './_components/reset-password'

const canEdit = (
  session: Awaited<ReturnType<typeof readActiveSession>>,
  memberId: string
): boolean => {
  if (!session) return false
  const { role, connectedMember } = session.user
  if (role === 'root' || role === 'bpk') return true
  if (
    role === 'member' &&
    (connectedMember as { id: string } | null)?.id === memberId
  )
    return true
  return false
}

const ProfilePage = async ({
  params
}: {
  params: Promise<{ registerNumber: string }>
}) => {
  const { registerNumber } = await params

  const [session, member] = await Promise.all([
    readActiveSession(),
    readMemberByRegisterNumber(decodeURIComponent(registerNumber))
  ])

  if (!member) notFound()

  const [trainingHistory, orgChain, academicHistory, careerHistory, organizationHistory] =
    await Promise.all([
      readMemberTrainingHistory(member.id),
      member.organization?.id
        ? readOrgHierarchyChain(member.organization.id)
        : Promise.resolve([]),
      readMemberAcademic(member.id),
      readMemberCareer(member.id),
      readMemberOrganizationHistory(member.id)
    ])

  const userCanEdit = canEdit(session, member.id)

  const adminActionsSlot =
    userCanEdit &&
    session?.user.role === 'bpk' &&
    session.user.connectedOrganization ? (
      <ResetPasswordButton
        memberId={member.id}
        organizationId={session.user.connectedOrganization.id}
      />
    ) : null

  return (
    <ProfileInlineEditForm
      member={member}
      canEdit={userCanEdit}
      trainingHistory={trainingHistory}
      academicHistory={academicHistory}
      careerHistory={careerHistory}
      organizationHistory={organizationHistory}
      adminActionsSlot={adminActionsSlot}
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
}

export default ProfilePage
```

- [ ] **Step 3: Type check**

```bash
bun check:types
```

Expected: Errors about `ProfileInlineEditForm` missing props — these are fixed in the next task.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-edit-context/profile-edit-context.tsx" "src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx"
git commit -m "feat(profile): extend ProfileEditContext and page.tsx with academic/career/org history"
```

---

## Task 8: AcademicSection Component

**Files:**
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/academic-section.tsx`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/index.ts`

- [ ] **Step 1: Write `academic-section.tsx`**

```tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PencilEdit01Icon, Tick01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Separator } from '~/components/shadcn/ui/separator'
import { Field, FieldLabel, FieldError } from '~/components/shadcn/ui/field'
import { Checkbox } from '~/components/shadcn/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '~/components/shadcn/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '~/components/shadcn/ui/sheet'
import { UniversityCombobox } from '../university-combobox'
import { saveAcademicAction, deleteAcademicAction } from './action'
import { useProfileEdit } from '../profile-edit-context'
import type { MemberAcademic } from '~/db/query/academic'
import type { UniversityItem } from '~/lib/api/university'

const degreeLabels: Record<string, string> = {
  d1: 'Diploma 1 (D1)',
  d2: 'Diploma 2 (D2)',
  d3: 'Diploma 3 (D3)',
  d4: 'Diploma 4 / Sarjana Terapan (D4)',
  s1: 'Sarjana (S1)',
  s2: 'Magister (S2)',
  s3: 'Doktor (S3)',
  profesi: 'Profesi / Spesialis'
}

const SectionDivider = ({ title, count }: { title: string; count?: number }) => (
  <div className='mt-6 mb-1 first:mt-0'>
    <div className='flex items-center gap-2'>
      <h2 className='text-foreground/60 font-geist-mono text-[11px] font-medium tracking-widest uppercase'>
        {title}
      </h2>
      {count !== undefined && count > 0 && (
        <span className='font-geist-mono text-muted-foreground/60 text-xs'>({count})</span>
      )}
    </div>
    <Separator className='mt-2' />
  </div>
)

const yearDisplay = (yearStart: number, yearEnd: number | null) =>
  yearEnd ? `${yearStart}–${yearEnd}` : `${yearStart}–sekarang`

interface AcademicSheetFormProps {
  memberId: string
  entry: MemberAcademic | null
  onClose: () => void
}

const AcademicSheetForm = ({ memberId, entry, onClose }: AcademicSheetFormProps) => {
  const boundAction = saveAcademicAction.bind(null, memberId)
  const [state, formAction, isPending] = useActionState(boundAction, {})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDegree, setSelectedDegree] = useState(entry?.degree ?? 's1')
  const [yearEnd, setYearEnd] = useState(entry?.yearEnd?.toString() ?? '')
  const [isGraduated, setIsGraduated] = useState(entry?.isGraduated ?? false)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Data berhasil disimpan.')
      onClose()
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, onClose])

  const handleYearEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setYearEnd(val)
    setIsGraduated(val.trim() !== '')
  }

  const handleDelete = async () => {
    if (!entry) return
    setIsDeleting(true)
    const result = await deleteAcademicAction(memberId, entry.id)
    setIsDeleting(false)
    if (result.success) {
      toast.success(result.message ?? 'Data dihapus.')
      onClose()
    } else {
      toast.error(result.message ?? 'Gagal menghapus data.')
    }
  }

  const defaultInstitutionData =
    entry?.institutionData ? (entry.institutionData as UniversityItem) : null

  return (
    <form action={formAction} className='flex flex-col gap-4 p-4'>
      {entry && <input type='hidden' name='id' value={entry.id} />}

      <Field>
        <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
          Jenjang
        </FieldLabel>
        <Select value={selectedDegree} onValueChange={setSelectedDegree}>
          <SelectTrigger>
            <SelectValue placeholder='Pilih jenjang' />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(degreeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type='hidden' name='degree' value={selectedDegree} />
        <FieldError errors={state.errors?.degree?.map((m) => ({ message: m }))} />
      </Field>

      <Field>
        <FieldLabel htmlFor='studyProgram' className='font-geist-mono text-xs tracking-wide uppercase'>
          Program Studi
        </FieldLabel>
        <Input
          id='studyProgram'
          name='studyProgram'
          placeholder='Contoh: Teknik Informatika'
          defaultValue={entry?.studyProgram ?? ''}
          required
        />
        <FieldError errors={state.errors?.studyProgram?.map((m) => ({ message: m }))} />
      </Field>

      <Field>
        <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
          Institusi
        </FieldLabel>
        <UniversityCombobox
          nameField='institutionName'
          dataField='institutionData'
          defaultInstitutionName={entry?.institutionName ?? ''}
          defaultInstitutionData={defaultInstitutionData}
        />
        <FieldError errors={state.errors?.institutionName?.map((m) => ({ message: m }))} />
      </Field>

      <div className='flex gap-3'>
        <Field className='flex-1'>
          <FieldLabel htmlFor='yearStart' className='font-geist-mono text-xs tracking-wide uppercase'>
            Tahun Mulai
          </FieldLabel>
          <Input
            id='yearStart'
            name='yearStart'
            type='number'
            min='1900'
            max={new Date().getFullYear()}
            defaultValue={entry?.yearStart ?? ''}
            required
          />
          <FieldError errors={state.errors?.yearStart?.map((m) => ({ message: m }))} />
        </Field>

        <Field className='flex-1'>
          <FieldLabel htmlFor='yearEnd' className='font-geist-mono text-xs tracking-wide uppercase'>
            Tahun Selesai
          </FieldLabel>
          <Input
            id='yearEnd'
            name='yearEnd'
            type='number'
            min='1900'
            max={new Date().getFullYear() + 10}
            value={yearEnd}
            onChange={handleYearEndChange}
            placeholder='Masih berjalan'
          />
          <FieldError errors={state.errors?.yearEnd?.map((m) => ({ message: m }))} />
        </Field>
      </div>

      <Field>
        <label className='flex cursor-pointer items-center gap-2'>
          <Checkbox
            checked={isGraduated}
            onCheckedChange={(checked) => setIsGraduated(checked === true)}
          />
          <input type='hidden' name='isGraduated' value={isGraduated ? 'true' : 'false'} />
          <span className='text-sm'>Lulus</span>
        </label>
      </Field>

      <SheetFooter className='mt-2 flex-col gap-2 sm:flex-col'>
        <Button type='submit' disabled={isPending} className='w-full'>
          {isPending ? 'Menyimpan...' : entry ? 'Simpan Perubahan' : 'Tambah'}
        </Button>

        {entry && (
          <div className='border-t pt-3'>
            {!confirmDelete ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-destructive hover:text-destructive w-full'
                onClick={() => setConfirmDelete(true)}
              >
                Hapus Data Ini
              </Button>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground flex-1 text-xs'>Yakin ingin menghapus?</span>
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setConfirmDelete(false)}
                >
                  Batal
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetFooter>
    </form>
  )
}

export const AcademicSection = () => {
  const { member, academicHistory, canEdit } = useProfileEdit()
  const [open, setOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MemberAcademic | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const handleAdd = () => {
    setEditingEntry(null)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  const handleEdit = (entry: MemberAcademic) => {
    setEditingEntry(entry)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  const handleClose = () => setOpen(false)

  return (
    <section>
      <div className='flex items-center justify-between'>
        <SectionDivider title='Riwayat Akademik' count={academicHistory.length} />
        {canEdit && (
          <Button variant='ghost' size='sm' type='button' onClick={handleAdd} className='mt-5'>
            <HugeiconsIcon icon={Add01Icon} className='mr-1 size-3.5' />
            Tambah
          </Button>
        )}
      </div>

      {academicHistory.length === 0 ? (
        <p className='text-muted-foreground py-4 text-sm'>Belum ada riwayat akademik.</p>
      ) : (
        <div
          className='border-border overflow-x-auto rounded-lg border'
          role='region'
          aria-label='Riwayat akademik'
        >
          <table className='w-full min-w-[520px] text-sm'>
            <thead>
              <tr className='border-border border-b'>
                {['Jenjang', 'Program Studi', 'Institusi', 'Tahun', 'Lulus'].map((h) => (
                  <th
                    key={h}
                    scope='col'
                    className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase first:pl-4'
                  >
                    {h}
                  </th>
                ))}
                {canEdit && <th scope='col' className='px-4 py-2.5' />}
              </tr>
            </thead>
            <tbody className='divide-border/60 divide-y'>
              {academicHistory.map((entry) => (
                <tr key={entry.id} className='hover:bg-muted/30 transition-colors'>
                  <td className='text-muted-foreground font-geist-mono px-4 py-3 text-xs'>
                    {entry.degree.toUpperCase()}
                  </td>
                  <td className='text-foreground px-4 py-3 font-medium'>{entry.studyProgram}</td>
                  <td className='text-foreground/80 px-4 py-3 text-sm'>{entry.institutionName}</td>
                  <td className='text-muted-foreground px-4 py-3 text-sm'>
                    {yearDisplay(entry.yearStart, entry.yearEnd)}
                  </td>
                  <td className='px-4 py-3 text-center'>
                    {entry.isGraduated ? (
                      <HugeiconsIcon icon={Tick01Icon} className='size-4 text-[var(--status-training-pass)] mx-auto' />
                    ) : (
                      <HugeiconsIcon icon={Cancel01Icon} className='size-4 text-[var(--status-training-fail)] mx-auto' />
                    )}
                  </td>
                  {canEdit && (
                    <td className='px-4 py-3 text-right'>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        type='button'
                        onClick={() => handleEdit(entry)}
                        aria-label='Edit riwayat akademik'
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} className='size-3.5' />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader className='px-4 pt-4'>
            <SheetTitle>
              {editingEntry ? 'Edit Riwayat Akademik' : 'Tambah Riwayat Akademik'}
            </SheetTitle>
          </SheetHeader>
          <AcademicSheetForm
            key={sheetKey}
            memberId={member.id}
            entry={editingEntry}
            onClose={handleClose}
          />
        </SheetContent>
      </Sheet>
    </section>
  )
}
```

- [ ] **Step 2: Write `academic-section/index.ts`**

```ts
export * from './academic-section'
```

- [ ] **Step 3: Type check**

```bash
bun check:types
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/academic-section/"
git commit -m "feat(profile): add AcademicSection component with Sheet form"
```

---

## Task 9: CareerSection Component

**Files:**
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section/career-section.tsx`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section/index.ts`

- [ ] **Step 1: Write `career-section.tsx`**

```tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Separator } from '~/components/shadcn/ui/separator'
import { Field, FieldLabel, FieldError } from '~/components/shadcn/ui/field'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '~/components/shadcn/ui/sheet'
import { saveCareerAction, deleteCareerAction } from './action'
import { useProfileEdit } from '../profile-edit-context'
import type { MemberCareer } from '~/db/query/career'

const SectionDivider = ({ title, count }: { title: string; count?: number }) => (
  <div className='mt-6 mb-1 first:mt-0'>
    <div className='flex items-center gap-2'>
      <h2 className='text-foreground/60 font-geist-mono text-[11px] font-medium tracking-widest uppercase'>
        {title}
      </h2>
      {count !== undefined && count > 0 && (
        <span className='font-geist-mono text-muted-foreground/60 text-xs'>({count})</span>
      )}
    </div>
    <Separator className='mt-2' />
  </div>
)

const yearDisplay = (yearStart: number, yearEnd: number | null) =>
  yearEnd ? `${yearStart}–${yearEnd}` : `${yearStart}–sekarang`

interface CareerSheetFormProps {
  memberId: string
  entry: MemberCareer | null
  onClose: () => void
}

const CareerSheetForm = ({ memberId, entry, onClose }: CareerSheetFormProps) => {
  const boundAction = saveCareerAction.bind(null, memberId)
  const [state, formAction, isPending] = useActionState(boundAction, {})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Data berhasil disimpan.')
      onClose()
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, onClose])

  const handleDelete = async () => {
    if (!entry) return
    setIsDeleting(true)
    const result = await deleteCareerAction(memberId, entry.id)
    setIsDeleting(false)
    if (result.success) {
      toast.success(result.message ?? 'Data dihapus.')
      onClose()
    } else {
      toast.error(result.message ?? 'Gagal menghapus data.')
    }
  }

  return (
    <form action={formAction} className='flex flex-col gap-4 p-4'>
      {entry && <input type='hidden' name='id' value={entry.id} />}

      <Field>
        <FieldLabel htmlFor='profession' className='font-geist-mono text-xs tracking-wide uppercase'>
          Profesi
        </FieldLabel>
        <Input
          id='profession'
          name='profession'
          placeholder='Contoh: Software Engineer'
          defaultValue={entry?.profession ?? ''}
          required
        />
        <FieldError errors={state.errors?.profession?.map((m) => ({ message: m }))} />
      </Field>

      <Field>
        <FieldLabel htmlFor='company' className='font-geist-mono text-xs tracking-wide uppercase'>
          Perusahaan / Institusi
        </FieldLabel>
        <Input
          id='company'
          name='company'
          placeholder='Contoh: PT. Maju Bersama'
          defaultValue={entry?.company ?? ''}
          required
        />
        <FieldError errors={state.errors?.company?.map((m) => ({ message: m }))} />
      </Field>

      <div className='flex gap-3'>
        <Field className='flex-1'>
          <FieldLabel htmlFor='yearStart' className='font-geist-mono text-xs tracking-wide uppercase'>
            Tahun Mulai
          </FieldLabel>
          <Input
            id='yearStart'
            name='yearStart'
            type='number'
            min='1900'
            max={new Date().getFullYear()}
            defaultValue={entry?.yearStart ?? ''}
            required
          />
          <FieldError errors={state.errors?.yearStart?.map((m) => ({ message: m }))} />
        </Field>

        <Field className='flex-1'>
          <FieldLabel htmlFor='yearEnd' className='font-geist-mono text-xs tracking-wide uppercase'>
            Tahun Selesai
          </FieldLabel>
          <Input
            id='yearEnd'
            name='yearEnd'
            type='number'
            min='1900'
            max={new Date().getFullYear() + 10}
            defaultValue={entry?.yearEnd ?? ''}
            placeholder='Masih berjalan'
          />
          <FieldError errors={state.errors?.yearEnd?.map((m) => ({ message: m }))} />
        </Field>
      </div>

      <SheetFooter className='mt-2 flex-col gap-2 sm:flex-col'>
        <Button type='submit' disabled={isPending} className='w-full'>
          {isPending ? 'Menyimpan...' : entry ? 'Simpan Perubahan' : 'Tambah'}
        </Button>

        {entry && (
          <div className='border-t pt-3'>
            {!confirmDelete ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-destructive hover:text-destructive w-full'
                onClick={() => setConfirmDelete(true)}
              >
                Hapus Data Ini
              </Button>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground flex-1 text-xs'>Yakin ingin menghapus?</span>
                <Button type='button' variant='destructive' size='sm' onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
                <Button type='button' variant='outline' size='sm' onClick={() => setConfirmDelete(false)}>
                  Batal
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetFooter>
    </form>
  )
}

export const CareerSection = () => {
  const { member, careerHistory, canEdit } = useProfileEdit()
  const [open, setOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MemberCareer | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const handleAdd = () => {
    setEditingEntry(null)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  const handleEdit = (entry: MemberCareer) => {
    setEditingEntry(entry)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  return (
    <section>
      <div className='flex items-center justify-between'>
        <SectionDivider title='Riwayat Karir' count={careerHistory.length} />
        {canEdit && (
          <Button variant='ghost' size='sm' type='button' onClick={handleAdd} className='mt-5'>
            <HugeiconsIcon icon={Add01Icon} className='mr-1 size-3.5' />
            Tambah
          </Button>
        )}
      </div>

      {careerHistory.length === 0 ? (
        <p className='text-muted-foreground py-4 text-sm'>Belum ada riwayat karir.</p>
      ) : (
        <div className='border-border overflow-x-auto rounded-lg border' role='region' aria-label='Riwayat karir'>
          <table className='w-full min-w-[400px] text-sm'>
            <thead>
              <tr className='border-border border-b'>
                {['Profesi', 'Perusahaan', 'Tahun'].map((h) => (
                  <th key={h} scope='col' className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'>
                    {h}
                  </th>
                ))}
                {canEdit && <th scope='col' className='px-4 py-2.5' />}
              </tr>
            </thead>
            <tbody className='divide-border/60 divide-y'>
              {careerHistory.map((entry) => (
                <tr key={entry.id} className='hover:bg-muted/30 transition-colors'>
                  <td className='text-foreground px-4 py-3 font-medium'>{entry.profession}</td>
                  <td className='text-foreground/80 px-4 py-3 text-sm'>{entry.company}</td>
                  <td className='text-muted-foreground px-4 py-3 text-sm'>{yearDisplay(entry.yearStart, entry.yearEnd)}</td>
                  {canEdit && (
                    <td className='px-4 py-3 text-right'>
                      <Button variant='ghost' size='icon-sm' type='button' onClick={() => handleEdit(entry)} aria-label='Edit riwayat karir'>
                        <HugeiconsIcon icon={PencilEdit01Icon} className='size-3.5' />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader className='px-4 pt-4'>
            <SheetTitle>{editingEntry ? 'Edit Riwayat Karir' : 'Tambah Riwayat Karir'}</SheetTitle>
          </SheetHeader>
          <CareerSheetForm key={sheetKey} memberId={member.id} entry={editingEntry} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </section>
  )
}
```

- [ ] **Step 2: Write `career-section/index.ts`**

```ts
export * from './career-section'
```

- [ ] **Step 3: Type check**

```bash
bun check:types
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/career-section/"
git commit -m "feat(profile): add CareerSection component with Sheet form"
```

---

## Task 10: OrganizationSection Component

**Files:**
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/organization-section.tsx`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/index.ts`

- [ ] **Step 1: Write `organization-section.tsx`**

```tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Separator } from '~/components/shadcn/ui/separator'
import { Field, FieldLabel, FieldError } from '~/components/shadcn/ui/field'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '~/components/shadcn/ui/sheet'
import { saveOrgHistoryAction, deleteOrgHistoryAction } from './action'
import { useProfileEdit } from '../profile-edit-context'
import type { MemberOrganizationHistory } from '~/db/query/organization-history'

const SectionDivider = ({ title, count }: { title: string; count?: number }) => (
  <div className='mt-6 mb-1 first:mt-0'>
    <div className='flex items-center gap-2'>
      <h2 className='text-foreground/60 font-geist-mono text-[11px] font-medium tracking-widest uppercase'>
        {title}
      </h2>
      {count !== undefined && count > 0 && (
        <span className='font-geist-mono text-muted-foreground/60 text-xs'>({count})</span>
      )}
    </div>
    <Separator className='mt-2' />
  </div>
)

const yearDisplay = (yearStart: number, yearEnd: number | null) =>
  yearEnd ? `${yearStart}–${yearEnd}` : `${yearStart}–sekarang`

interface OrgSheetFormProps {
  memberId: string
  entry: MemberOrganizationHistory | null
  onClose: () => void
}

const OrgSheetForm = ({ memberId, entry, onClose }: OrgSheetFormProps) => {
  const boundAction = saveOrgHistoryAction.bind(null, memberId)
  const [state, formAction, isPending] = useActionState(boundAction, {})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Data berhasil disimpan.')
      onClose()
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state, onClose])

  const handleDelete = async () => {
    if (!entry) return
    setIsDeleting(true)
    const result = await deleteOrgHistoryAction(memberId, entry.id)
    setIsDeleting(false)
    if (result.success) {
      toast.success(result.message ?? 'Data dihapus.')
      onClose()
    } else {
      toast.error(result.message ?? 'Gagal menghapus data.')
    }
  }

  return (
    <form action={formAction} className='flex flex-col gap-4 p-4'>
      {entry && <input type='hidden' name='id' value={entry.id} />}

      <Field>
        <FieldLabel htmlFor='position' className='font-geist-mono text-xs tracking-wide uppercase'>
          Jabatan
        </FieldLabel>
        <Input
          id='position'
          name='position'
          placeholder='Contoh: Ketua Umum'
          defaultValue={entry?.position ?? ''}
          required
        />
        <FieldError errors={state.errors?.position?.map((m) => ({ message: m }))} />
      </Field>

      <Field>
        <FieldLabel htmlFor='organization' className='font-geist-mono text-xs tracking-wide uppercase'>
          Nama Organisasi
        </FieldLabel>
        <Input
          id='organization'
          name='organization'
          placeholder='Contoh: HMI Komisariat Teknik'
          defaultValue={entry?.organization ?? ''}
          required
        />
        <FieldError errors={state.errors?.organization?.map((m) => ({ message: m }))} />
      </Field>

      <div className='flex gap-3'>
        <Field className='flex-1'>
          <FieldLabel htmlFor='yearStart' className='font-geist-mono text-xs tracking-wide uppercase'>
            Tahun Mulai
          </FieldLabel>
          <Input
            id='yearStart'
            name='yearStart'
            type='number'
            min='1900'
            max={new Date().getFullYear()}
            defaultValue={entry?.yearStart ?? ''}
            required
          />
          <FieldError errors={state.errors?.yearStart?.map((m) => ({ message: m }))} />
        </Field>

        <Field className='flex-1'>
          <FieldLabel htmlFor='yearEnd' className='font-geist-mono text-xs tracking-wide uppercase'>
            Tahun Selesai
          </FieldLabel>
          <Input
            id='yearEnd'
            name='yearEnd'
            type='number'
            min='1900'
            max={new Date().getFullYear() + 10}
            defaultValue={entry?.yearEnd ?? ''}
            placeholder='Masih berjalan'
          />
          <FieldError errors={state.errors?.yearEnd?.map((m) => ({ message: m }))} />
        </Field>
      </div>

      <SheetFooter className='mt-2 flex-col gap-2 sm:flex-col'>
        <Button type='submit' disabled={isPending} className='w-full'>
          {isPending ? 'Menyimpan...' : entry ? 'Simpan Perubahan' : 'Tambah'}
        </Button>

        {entry && (
          <div className='border-t pt-3'>
            {!confirmDelete ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-destructive hover:text-destructive w-full'
                onClick={() => setConfirmDelete(true)}
              >
                Hapus Data Ini
              </Button>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='text-muted-foreground flex-1 text-xs'>Yakin ingin menghapus?</span>
                <Button type='button' variant='destructive' size='sm' onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
                <Button type='button' variant='outline' size='sm' onClick={() => setConfirmDelete(false)}>
                  Batal
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetFooter>
    </form>
  )
}

export const OrganizationSection = () => {
  const { member, organizationHistory, canEdit } = useProfileEdit()
  const [open, setOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MemberOrganizationHistory | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const handleAdd = () => {
    setEditingEntry(null)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  const handleEdit = (entry: MemberOrganizationHistory) => {
    setEditingEntry(entry)
    setSheetKey((k) => k + 1)
    setOpen(true)
  }

  return (
    <section>
      <div className='flex items-center justify-between'>
        <SectionDivider title='Riwayat Organisasi' count={organizationHistory.length} />
        {canEdit && (
          <Button variant='ghost' size='sm' type='button' onClick={handleAdd} className='mt-5'>
            <HugeiconsIcon icon={Add01Icon} className='mr-1 size-3.5' />
            Tambah
          </Button>
        )}
      </div>

      {organizationHistory.length === 0 ? (
        <p className='text-muted-foreground py-4 text-sm'>Belum ada riwayat organisasi.</p>
      ) : (
        <div className='border-border overflow-x-auto rounded-lg border' role='region' aria-label='Riwayat organisasi'>
          <table className='w-full min-w-[400px] text-sm'>
            <thead>
              <tr className='border-border border-b'>
                {['Jabatan', 'Organisasi', 'Tahun'].map((h) => (
                  <th key={h} scope='col' className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'>
                    {h}
                  </th>
                ))}
                {canEdit && <th scope='col' className='px-4 py-2.5' />}
              </tr>
            </thead>
            <tbody className='divide-border/60 divide-y'>
              {organizationHistory.map((entry) => (
                <tr key={entry.id} className='hover:bg-muted/30 transition-colors'>
                  <td className='text-foreground px-4 py-3 font-medium'>{entry.position}</td>
                  <td className='text-foreground/80 px-4 py-3 text-sm'>{entry.organization}</td>
                  <td className='text-muted-foreground px-4 py-3 text-sm'>{yearDisplay(entry.yearStart, entry.yearEnd)}</td>
                  {canEdit && (
                    <td className='px-4 py-3 text-right'>
                      <Button variant='ghost' size='icon-sm' type='button' onClick={() => handleEdit(entry)} aria-label='Edit riwayat organisasi'>
                        <HugeiconsIcon icon={PencilEdit01Icon} className='size-3.5' />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader className='px-4 pt-4'>
            <SheetTitle>{editingEntry ? 'Edit Riwayat Organisasi' : 'Tambah Riwayat Organisasi'}</SheetTitle>
          </SheetHeader>
          <OrgSheetForm key={sheetKey} memberId={member.id} entry={editingEntry} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </section>
  )
}
```

- [ ] **Step 2: Write `organization-section/index.ts`**

```ts
export * from './organization-section'
```

- [ ] **Step 3: Type check**

```bash
bun check:types
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/organization-section/"
git commit -m "feat(profile): add OrganizationSection component with Sheet form"
```

---

## Task 11: Wire Into ProfileInlineEditForm

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-inline-edit-form/profile-inline-edit-form.tsx`

- [ ] **Step 1: Update `profile-inline-edit-form.tsx`** — add new props and render sections

Replace the entire file content:

```tsx
'use client'

import { useActionState, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  PencilEdit01Icon,
  FloppyDiskIcon,
  Cancel01Icon
} from '@hugeicons/core-free-icons'
import { updateMemberProfileAction } from '../action'
import { ProfileEditProvider } from '../profile-edit-context'
import { ProfileHeader } from '../profile-header'
import { ProfileInfo } from '../profile-info'
import { ProfileSidebar } from '../profile-sidebar'
import { ProfileTrainingHistory } from '../profile-training-history'
import { AcademicSection } from '../academic-section'
import { CareerSection } from '../career-section'
import { OrganizationSection } from '../organization-section'
import type { Member } from '~/db/query/member'
import type { MemberTrainingHistory } from '~/db/query/training'
import type { MemberAcademic } from '~/db/query/academic'
import type { MemberCareer } from '~/db/query/career'
import type { MemberOrganizationHistory } from '~/db/query/organization-history'

interface ProfileInlineEditFormProps {
  member: Member
  canEdit: boolean
  trainingHistory: MemberTrainingHistory
  academicHistory: MemberAcademic[]
  careerHistory: MemberCareer[]
  organizationHistory: MemberOrganizationHistory[]
  orgHierarchySlot?: ReactNode
  adminActionsSlot?: ReactNode
}

export const ProfileInlineEditForm = ({
  member,
  canEdit,
  trainingHistory,
  academicHistory,
  careerHistory,
  organizationHistory,
  orgHierarchySlot,
  adminActionsSlot
}: ProfileInlineEditFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const boundAction = updateMemberProfileAction.bind(null, member.id)
  const [state, formAction, isPending] = useActionState(boundAction, {})

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? 'Data berhasil diperbarui.')
      setIsEditing(false)
    } else if (state.message && !state.errors) {
      toast.error(state.message)
    }
  }, [state])

  const handleReset = useCallback(() => {
    setFormKey((k) => k + 1)
    setIsEditing(false)
  }, [])

  const editSlot = canEdit ? (
    isEditing ? null : (
      <Button
        variant='outline'
        size='sm'
        type='button'
        onClick={() => setIsEditing(true)}
      >
        <HugeiconsIcon icon={PencilEdit01Icon} className='mr-1.5 size-3.5' />
        Edit Profil
      </Button>
    )
  ) : null

  const editActionsSlot = isEditing ? (
    <div className='flex items-center gap-2'>
      <Button
        variant='outline'
        size='sm'
        type='button'
        onClick={handleReset}
        disabled={isPending}
      >
        <HugeiconsIcon icon={Cancel01Icon} className='mr-1.5 size-3.5' />
        Reset
      </Button>
      <Button
        size='sm'
        type='submit'
        form='profile-edit-form'
        disabled={isPending}
      >
        <HugeiconsIcon icon={FloppyDiskIcon} className='mr-1.5 size-3.5' />
        {isPending ? 'Menyimpan...' : 'Simpan Profil'}
      </Button>
    </div>
  ) : null

  return (
    <ProfileEditProvider
      value={{
        member,
        trainingHistory,
        academicHistory,
        careerHistory,
        organizationHistory,
        canEdit,
        isEditing,
        isPending,
        fieldErrors: state.errors
      }}
    >
      <form id='profile-edit-form' action={formAction}>
        <ProfileHeader
          editSlot={editSlot}
          editActionsSlot={editActionsSlot}
          adminActionsSlot={adminActionsSlot}
        />

        <div className='px-6 py-8'>
          <div className='mx-auto max-w-5xl'>
            <div className='flex flex-col gap-8 lg:flex-row lg:gap-10'>
              <main className='min-w-0 flex-1'>
                <ProfileInfo key={`info-${formKey}`} />
                <div className='mt-8'>
                  <AcademicSection />
                </div>
                <div className='mt-8'>
                  <CareerSection />
                </div>
                <div className='mt-8'>
                  <OrganizationSection />
                </div>
                <div className='mt-8'>
                  <ProfileTrainingHistory />
                </div>
              </main>

              <aside className='w-full lg:w-64 lg:shrink-0'>
                <ProfileSidebar
                  key={`sidebar-${formKey}`}
                  orgHierarchySlot={orgHierarchySlot}
                />
              </aside>
            </div>
          </div>
        </div>
      </form>
    </ProfileEditProvider>
  )
}
```

- [ ] **Step 2: Type check**

```bash
bun check:types
```

Expected: No errors.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/dashboard/profile/13012026001` in Chrome.

Verify:
- Three new empty sections appear: "Riwayat Akademik", "Riwayat Karir", "Riwayat Organisasi"
- "Tambah" buttons are visible (logged in as bpk-kammi with canEdit)
- "Riwayat Dauroh" is still below the three new sections
- Click "Tambah" on each section → Sheet slides in from right
- Fill and submit Riwayat Karir form → entry appears in table, Sheet closes, toast shown
- Click entry's edit icon → Sheet opens pre-filled
- Delete flow: click "Hapus Data Ini" → confirm prompt appears → confirm → entry removed

- [ ] **Step 4: Check for Next.js errors**

In browser console (or via playwright-cli console), verify no hydration errors or route errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-inline-edit-form/profile-inline-edit-form.tsx"
git commit -m "feat(profile): wire AcademicSection, CareerSection, OrganizationSection into profile page"
```

---

## Done

All 11 tasks complete. The profile page now has:
- **Riwayat Akademik** with university combobox (api.co.id), degree select, is_graduated auto-sync
- **Riwayat Karir** with profession + company + year range
- **Riwayat Organisasi** with position + org name + year range
- All three support add/edit/delete via Sheet, visible only when `canEdit`
- Ordered before Riwayat Dauroh in the page layout
