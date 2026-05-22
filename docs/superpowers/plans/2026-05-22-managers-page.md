# Managers Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the "Pengurus Pusat" leadership form out of `/dashboard/pages/home` into its own page at `/dashboard/pages/managers`.

**Architecture:** Create a new `managers/` page directory mirroring `home/` structure. Move `saveLeadershipAction`, `leadershipSchema`, and `LeadershipForm` to the new location. Remove them from `home/`. Add a sidebar entry.

**Tech Stack:** Next.js 16 (App Router, RSC, server actions), Drizzle ORM, Zod, Shadcn UI, `@hugeicons/react`

---

## File Map

| Action | File |
|--------|------|
| CREATE | `src/app/(dashboard)/dashboard/pages/managers/_data/settings.ts` |
| CREATE | `src/app/(dashboard)/dashboard/pages/managers/_components/action.ts` |
| CREATE | `src/app/(dashboard)/dashboard/pages/managers/_components/leadership-form/leadership-form.tsx` |
| CREATE | `src/app/(dashboard)/dashboard/pages/managers/_components/leadership-form/index.ts` |
| CREATE | `src/app/(dashboard)/dashboard/pages/managers/page.tsx` |
| MODIFY | `src/app/(dashboard)/dashboard/pages/home/_data/settings.ts` |
| MODIFY | `src/app/(dashboard)/dashboard/pages/home/_components/action.ts` |
| MODIFY | `src/app/(dashboard)/dashboard/pages/home/page.tsx` |
| DELETE | `src/app/(dashboard)/dashboard/pages/home/_components/leadership-form/leadership-form.tsx` |
| DELETE | `src/app/(dashboard)/dashboard/pages/home/_components/leadership-form/index.ts` |
| MODIFY | `src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx` |

---

### Task 1: Create `managers/_data/settings.ts`

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/managers/_data/settings.ts`

- [ ] **Step 1: Create the data file**

```typescript
import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type LeadershipSettings
} from '~/db/query/site-settings'

export const getCachedLeadershipSettings = async (): Promise<LeadershipSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-leadership')
  return readSiteSettings<LeadershipSettings>('leadership', SETTINGS_DEFAULTS.leadership)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/managers/_data/settings.ts
git commit -m "feat(managers): add data layer for leadership settings"
```

---

### Task 2: Create `managers/_components/action.ts`

Move `leadershipSchema` and `saveLeadershipAction` from `home/_components/action.ts` here. The `checkAccess` helper is duplicated (same logic, same access rules).

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/managers/_components/action.ts`

- [ ] **Step 1: Create the action file**

```typescript
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { validateSession } from '~/lib/auth/api'
import { upsertSiteSettings } from '~/db/query/site-settings'
import { z } from 'zod'

export type SettingsActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

const checkAccess = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('kammi_id_session')?.value
  if (!token) return null

  const session = await validateSession(token)
  if (!session) return null

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumasPP = role === 'humas' && connectedOrganization?.type === 'pp'

  if (!isRoot && !isHumasPP) return null
  return session
}

const leadershipSchema = z.object({
  periodLabel: z.string().min(1),
  heading: z.string().min(1, 'Judul seksi wajib diisi.'),
  leaders: z
    .array(
      z.object({
        name: z.string().min(1, 'Nama wajib diisi.'),
        role: z.string().min(1, 'Jabatan wajib diisi.'),
        photoUrl: z.string().min(1, 'URL foto wajib diisi.')
      })
    )
    .min(1)
})

export const saveLeadershipAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  if (!(await checkAccess())) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  const leadersJson = raw.leaders as string

  let leaders
  try {
    leaders = JSON.parse(leadersJson)
  } catch {
    return { error: 'Data pengurus tidak valid.' }
  }

  const result = leadershipSchema.safeParse({ ...raw, leaders })
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  try {
    await upsertSiteSettings('leadership', result.data)
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan kepemimpinan.' }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/managers/_components/action.ts
git commit -m "feat(managers): add server action for saving leadership settings"
```

---

### Task 3: Create `managers/_components/leadership-form/`

Copy the existing form from `home/_components/leadership-form/` and update the import path for `saveLeadershipAction`.

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/managers/_components/leadership-form/leadership-form.tsx`
- Create: `src/app/(dashboard)/dashboard/pages/managers/_components/leadership-form/index.ts`

- [ ] **Step 1: Create `leadership-form.tsx`**

The only change from the home version is the import on line 15: `from '../action'` (which resolves to `managers/_components/action.ts`).

```typescript
'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveLeadershipAction, type SettingsActionState } from '../action'
import type { LeadershipSettings } from '~/db/query/site-settings'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon } from '@hugeicons/core-free-icons'

type Leader = LeadershipSettings['leaders'][number]
type Props = { initialData: LeadershipSettings }

export const LeadershipForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<SettingsActionState, FormData>(
    saveLeadershipAction,
    {}
  )
  const [leaders, setLeaders] = useState<Leader[]>(initialData.leaders)

  useEffect(() => {
    if (state.success) toast.success('Pengaturan kepemimpinan berhasil disimpan.')
    if (state.error) toast.error(state.error)
  }, [state])

  const fe = state.fieldErrors ?? {}

  const updateLeader = (i: number, field: keyof Leader, value: string) => {
    setLeaders((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
  }

  const addLeader = () => {
    setLeaders((prev) => [...prev, { name: '', role: '', photoUrl: '' }])
  }

  const removeLeader = (i: number) => {
    setLeaders((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <form
      action={(fd) => {
        fd.set('leaders', JSON.stringify(leaders))
        formAction(fd)
      }}
      className='space-y-8'
    >
      <FieldGroup>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor='periodLabel'>Label Periode</FieldLabel>
            <FieldContent>
              <Input
                id='periodLabel'
                name='periodLabel'
                defaultValue={initialData.periodLabel}
                placeholder='Masa Jabatan KAMMI'
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor='heading'>Judul Seksi</FieldLabel>
            <FieldContent>
              <Input
                id='heading'
                name='heading'
                defaultValue={initialData.heading}
                placeholder='Mengenal Pengurus Pusat KAMMI'
              />
            </FieldContent>
            <FieldError errors={fe.heading?.map((m) => ({ message: m }))} />
          </Field>
        </div>

        <div className='space-y-3'>
          <p className='text-sm font-medium text-foreground'>Daftar Pengurus</p>
          {leaders.map((leader, i) => (
            <div key={i} className='rounded-2xl border border-border bg-muted/30 p-4'>
              <div className='mb-4 flex items-center justify-between'>
                <span className='font-mono text-xs text-muted-foreground'>Pengurus {i + 1}</span>
                {leaders.length > 1 && (
                  <button
                    type='button'
                    onClick={() => removeLeader(i)}
                    className='flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
                    aria-label={`Hapus pengurus ${i + 1}`}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className='size-4' strokeWidth={2} />
                  </button>
                )}
              </div>

              <div className='space-y-4'>
                <ImageUpload
                  label='Foto Pengurus'
                  value={leader.photoUrl}
                  onChange={(path) => updateLeader(i, 'photoUrl', path)}
                  folder='site-settings/leadership'
                />

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor={`leader-name-${i}`}>Nama</FieldLabel>
                    <FieldContent>
                      <Input
                        id={`leader-name-${i}`}
                        value={leader.name}
                        onChange={(e) => updateLeader(i, 'name', e.target.value)}
                        placeholder='Nama Lengkap'
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`leader-role-${i}`}>Jabatan</FieldLabel>
                    <FieldContent>
                      <Input
                        id={`leader-role-${i}`}
                        value={leader.role}
                        onChange={(e) => updateLeader(i, 'role', e.target.value)}
                        placeholder='Ketua Umum'
                      />
                    </FieldContent>
                  </Field>
                </div>
              </div>
            </div>
          ))}

          <button
            type='button'
            onClick={addLeader}
            className='flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary'
          >
            <HugeiconsIcon icon={Add01Icon} className='size-4' strokeWidth={2} />
            Tambah Pengurus
          </button>
        </div>
      </FieldGroup>

      <div className='flex justify-end'>
        <Button type='submit' className='rounded-full px-8' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan Kepemimpinan'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create `index.ts`**

```typescript
export * from './leadership-form'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/managers/_components/leadership-form/
git commit -m "feat(managers): add LeadershipForm component"
```

---

### Task 4: Create `managers/page.tsx`

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/managers/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserGroupIcon } from '@hugeicons/core-free-icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import { Separator } from '~/components/shadcn/ui/separator'
import { LeadershipForm } from './_components/leadership-form'
import { getCachedLeadershipSettings } from './_data/settings'

const ManagersSettingsPage = async () => {
  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumasPP = role === 'humas' && connectedOrganization?.type === 'pp'

  if (!isRoot && !isHumasPP) redirect('/dashboard')

  const leadership = await getCachedLeadershipSettings()

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className='size-6' />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengurus Pusat
          </h1>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            Kelola data pengurus yang ditampilkan di{' '}
            <span className='font-medium text-foreground'>kammi.id</span>.
          </p>
        </div>
      </div>

      <Card className='rounded-3xl shadow-xs'>
        <CardHeader className='border-b pb-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='font-mono text-xs text-muted-foreground'>01</span>
                <Separator orientation='vertical' className='h-3' />
                <CardTitle className='text-base font-semibold'>Pengurus Pusat</CardTitle>
              </div>
              <CardDescription>
                Nama, jabatan, dan foto pengurus yang ditampilkan di halaman utama.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6 pb-6'>
          <LeadershipForm initialData={leadership} />
        </CardContent>
      </Card>
    </div>
  )
}

export default ManagersSettingsPage
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/managers/page.tsx
git commit -m "feat(managers): add Pengurus Pusat settings page"
```

---

### Task 5: Remove leadership from `home/_data/settings.ts`

**Files:**
- Modify: `src/app/(dashboard)/dashboard/pages/home/_data/settings.ts`

- [ ] **Step 1: Remove `getCachedLeadershipSettings` and its type import**

Replace the entire file with:

```typescript
import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type HeroSettings,
  type AboutSettings,
  type ActionsSettings,
  type NavSettings,
  type FooterSettings,
  type MetadataSettings
} from '~/db/query/site-settings'

export const getCachedHeroSettings = async (): Promise<HeroSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-hero')
  return readSiteSettings<HeroSettings>('hero', SETTINGS_DEFAULTS.hero)
}

export const getCachedAboutSettings = async (): Promise<AboutSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-about')
  return readSiteSettings<AboutSettings>('about', SETTINGS_DEFAULTS.about)
}

export const getCachedActionsSettings = async (): Promise<ActionsSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-actions')
  return readSiteSettings<ActionsSettings>('actions', SETTINGS_DEFAULTS.actions)
}

export const getCachedNavSettings = async (): Promise<NavSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-nav')
  return readSiteSettings<NavSettings>('nav', SETTINGS_DEFAULTS.nav)
}

export const getCachedFooterSettings = async (): Promise<FooterSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-footer')
  return readSiteSettings<FooterSettings>('footer', SETTINGS_DEFAULTS.footer)
}

export const getCachedMetadataSettings = async (): Promise<MetadataSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', 'site-settings-metadata')
  return readSiteSettings<MetadataSettings>('metadata', SETTINGS_DEFAULTS.metadata)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_data/settings.ts
git commit -m "refactor(home): remove leadership settings from home data layer"
```

---

### Task 6: Remove leadership from `home/_components/action.ts`

**Files:**
- Modify: `src/app/(dashboard)/dashboard/pages/home/_components/action.ts`

- [ ] **Step 1: Delete the `// ─── Leadership ─` section**

Remove lines 103–147 (the `leadershipSchema` const and `saveLeadershipAction` function + its export). The `SettingsActionState` type and `checkAccess` helper remain — they are still used by the other actions in this file.

The file after edit ends at the `saveMetadataAction` export. The leadership section to remove is:

```typescript
// ─── Leadership ──────────────────────────────────────────────────────────────

const leadershipSchema = z.object({
  periodLabel: z.string().min(1),
  heading: z.string().min(1, 'Judul seksi wajib diisi.'),
  leaders: z
    .array(
      z.object({
        name: z.string().min(1, 'Nama wajib diisi.'),
        role: z.string().min(1, 'Jabatan wajib diisi.'),
        photoUrl: z.string().min(1, 'URL foto wajib diisi.')
      })
    )
    .min(1)
})

export const saveLeadershipAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  if (!(await checkAccess())) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  const leadersJson = raw.leaders as string

  let leaders
  try {
    leaders = JSON.parse(leadersJson)
  } catch {
    return { error: 'Data pengurus tidak valid.' }
  }

  const result = leadershipSchema.safeParse({ ...raw, leaders })
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]> }
  }

  try {
    await upsertSiteSettings('leadership', result.data)
    revalidatePath('/')
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan kepemimpinan.' }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/_components/action.ts
git commit -m "refactor(home): remove saveLeadershipAction (moved to managers)"
```

---

### Task 7: Update `home/page.tsx`

Remove the leadership section from the `sections` array and clean up imports/Promise.all.

**Files:**
- Modify: `src/app/(dashboard)/dashboard/pages/home/page.tsx`

- [ ] **Step 1: Remove `LeadershipForm` import**

Remove this line:
```typescript
import { LeadershipForm } from './_components/leadership-form'
```

- [ ] **Step 2: Remove `getCachedLeadershipSettings` from imports**

Change:
```typescript
import {
  getCachedHeroSettings,
  getCachedAboutSettings,
  getCachedLeadershipSettings,
  getCachedActionsSettings,
  getCachedNavSettings,
  getCachedFooterSettings,
  getCachedMetadataSettings
} from './_data/settings'
```

To:
```typescript
import {
  getCachedHeroSettings,
  getCachedAboutSettings,
  getCachedActionsSettings,
  getCachedNavSettings,
  getCachedFooterSettings,
  getCachedMetadataSettings
} from './_data/settings'
```

- [ ] **Step 3: Remove `leadership` from Promise.all**

Change:
```typescript
const [hero, about, leadership, actions, nav, footer, metadata] = await Promise.all([
  getCachedHeroSettings(),
  getCachedAboutSettings(),
  getCachedLeadershipSettings(),
  getCachedActionsSettings(),
  getCachedNavSettings(),
  getCachedFooterSettings(),
  getCachedMetadataSettings()
])
```

To:
```typescript
const [hero, about, actions, nav, footer, metadata] = await Promise.all([
  getCachedHeroSettings(),
  getCachedAboutSettings(),
  getCachedActionsSettings(),
  getCachedNavSettings(),
  getCachedFooterSettings(),
  getCachedMetadataSettings()
])
```

- [ ] **Step 4: Remove the `leadership` entry from `sections` array**

Remove:
```typescript
{
  id: 'leadership',
  title: 'Pengurus Pusat',
  description: 'Nama, jabatan, dan foto pengurus yang ditampilkan di halaman utama.',
  content: <LeadershipForm initialData={leadership} />
},
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/home/page.tsx
git commit -m "refactor(home): remove Pengurus Pusat section (moved to /managers)"
```

---

### Task 8: Delete old `leadership-form` from home

**Files:**
- Delete: `src/app/(dashboard)/dashboard/pages/home/_components/leadership-form/leadership-form.tsx`
- Delete: `src/app/(dashboard)/dashboard/pages/home/_components/leadership-form/index.ts`

- [ ] **Step 1: Delete the files**

```bash
rm src/app/\(dashboard\)/dashboard/pages/home/_components/leadership-form/leadership-form.tsx
rm src/app/\(dashboard\)/dashboard/pages/home/_components/leadership-form/index.ts
rmdir src/app/\(dashboard\)/dashboard/pages/home/_components/leadership-form
```

- [ ] **Step 2: Commit**

```bash
git add -A src/app/\(dashboard\)/dashboard/pages/home/_components/leadership-form/
git commit -m "refactor(home): delete leadership-form (moved to managers)"
```

---

### Task 9: Add sidebar entry for managers page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx`

- [ ] **Step 1: Add `UserMultiple02Icon` to imports** (or reuse `UserGroupIcon` which is already imported)

`UserGroupIcon` is already imported. No new import needed.

- [ ] **Step 2: Add managers entry under "Halaman Publik" nav group**

Find the `canAccessHalamanPublik` section and add the managers entry:

Change:
```typescript
{canAccessHalamanPublik && (
  <NavMain
    title='Halaman Publik'
    items={[
      {
        title: 'Halaman Utama',
        url: '/dashboard/pages/home',
        icon: <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
      }
    ]}
  />
)}
```

To:
```typescript
{canAccessHalamanPublik && (
  <NavMain
    title='Halaman Publik'
    items={[
      {
        title: 'Halaman Utama',
        url: '/dashboard/pages/home',
        icon: <HugeiconsIcon icon={Home01Icon} strokeWidth={2} />
      },
      {
        title: 'Pengurus Pusat',
        url: '/dashboard/pages/managers',
        icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
      }
    ]}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/_components/app-sidebar/app-sidebar.tsx
git commit -m "feat(sidebar): add Pengurus Pusat entry under Halaman Publik"
```

---

### Task 10: Verify

- [ ] **Step 1: Check dev server for errors** — navigate to `/dashboard/pages/managers` and `/dashboard/pages/home`, verify both pages load without console errors.

- [ ] **Step 2: Verify sidebar** — confirm "Pengurus Pusat" appears in the sidebar under "Halaman Publik" for root/humas PP users.

- [ ] **Step 3: Verify home page** — confirm "Pengurus Pusat" section is gone from `/dashboard/pages/home`.

- [ ] **Step 4: Verify form works** — on `/dashboard/pages/managers`, add a leader entry and save. Confirm toast success and no console errors.
