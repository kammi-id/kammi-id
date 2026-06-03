# Halaman Tentang Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/dashboard/pages/tentang` settings page that lets humas/root manage background images for the `/tentang` public page (hero, 6 prinsip, 4 paradigma, kredo).

**Architecture:** Follow the existing `dashboard/pages/home` pattern exactly — typed settings in `site_settings` table, cached server-side getter, four `'use server'` actions, four `'use client'` form components, one async server page. The public `/tentang` page fetches settings server-side and passes them as props to the client `TentangScene`.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM, Zod, `useActionState`, `ImageUpload` component, `useUnsavedChanges` hook, GSAP (existing, unchanged core logic)

---

## File Map

| Action | Path |
|--------|------|
| Modify | `src/db/query/site-settings.ts` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_data/settings.ts` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/action.ts` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/hero-bg-form/hero-bg-form.tsx` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/hero-bg-form/index.ts` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/prinsip-form/prinsip-form.tsx` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/prinsip-form/index.ts` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/paradigma-form/paradigma-form.tsx` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/paradigma-form/index.ts` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/kredo-form/kredo-form.tsx` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/_components/kredo-form/index.ts` |
| Create | `src/app/(dashboard)/dashboard/pages/tentang/page.tsx` |
| Modify | `src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx` |
| Modify | `src/app/(main)/tentang/_components/tentang-scene/tentang-scene.tsx` |
| Modify | `src/app/(main)/tentang/page.tsx` |

---

## Task 1: Add `TentangSettings` type + defaults to the data layer

**Files:**
- Modify: `src/db/query/site-settings.ts`

- [ ] **Step 1: Add the type after `MetadataSettings` (around line 91)**

```ts
export type TentangSettings = {
  heroImageUrl: string
  prinsipImages: string[]    // length 6
  paradigmaImages: string[]  // length 4
  kredoImageUrl: string
}
```

- [ ] **Step 2: Add the default value inside `SETTINGS_DEFAULTS` (after the `metadata` key, before `} as const`)**

```ts
tentang: {
  heroImageUrl: '',
  prinsipImages: ['', '', '', '', '', ''],
  paradigmaImages: ['', '', '', ''],
  kredoImageUrl: ''
} satisfies TentangSettings,
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /path/to/worktree && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors (or same pre-existing errors as before).

- [ ] **Step 4: Commit**

```bash
git add src/db/query/site-settings.ts
git commit -m "feat(tentang-settings): add TentangSettings type and defaults"
```

---

## Task 2: Create cached data getter

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_data/settings.ts`

- [ ] **Step 1: Create the file**

```ts
import { cacheLife, cacheTag } from 'next/cache'
import {
  readSiteSettings,
  SETTINGS_DEFAULTS,
  type TentangSettings
} from '~/db/query/site-settings'

export const getCachedTentangSettings = async (
  organizationId: string
): Promise<TentangSettings> => {
  'use cache'
  cacheLife('days')
  cacheTag('site-settings', `site-settings-tentang-${organizationId}`)
  return readSiteSettings<TentangSettings>(
    'tentang',
    SETTINGS_DEFAULTS.tentang,
    organizationId
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/tentang/_data/settings.ts
git commit -m "feat(tentang-settings): add cached getter for tentang settings"
```

---

## Task 3: Create server actions

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/action.ts`

- [ ] **Step 1: Create the file**

```ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath, updateTag } from 'next/cache'
import { validateSession } from '~/lib/auth/api'
import { upsertSiteSettings } from '~/db/query/site-settings'
import { z } from 'zod'

export type SettingsActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  values?: Record<string, string>
}

const checkAccess = async (): Promise<{ orgId: string } | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('kammi_id_session')?.value
  if (!token) return null

  const session = await validateSession(token)
  if (!session) return null

  const { role, connectedOrganization } = session.user
  if (role !== 'root' && role !== 'humas') return null

  const orgId = connectedOrganization?.id
  if (!orgId) return null

  return { orgId }
}

const persist = async (
  key: string,
  data: unknown,
  orgId: string,
  errorMsg: string
): Promise<SettingsActionState> => {
  try {
    await upsertSiteSettings(key, data, orgId)
    revalidatePath('/tentang')
    updateTag(`site-settings-tentang-${orgId}`)
    return { success: true }
  } catch {
    return { error: errorMsg }
  }
}

// ─── Hero background ──────────────────────────────────────────────────────────

const heroBgSchema = z.object({
  heroImageUrl: z.string()
})

export const saveTentangHeroAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  const result = heroBgSchema.safeParse(raw)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
      values: Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v != null && typeof v === 'string')
      ) as Record<string, string>
    }
  }

  return persist('tentang-hero', result.data, access.orgId, 'Gagal menyimpan latar hero.')
}

// ─── Prinsip images ───────────────────────────────────────────────────────────

const prinsipSchema = z.object({
  prinsipImages: z.array(z.string()).length(6)
})

export const saveTentangPrinsipAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  let prinsipImages
  try {
    prinsipImages = JSON.parse(raw.prinsipImages as string)
  } catch {
    return { error: 'Data gambar prinsip tidak valid.' }
  }

  const result = prinsipSchema.safeParse({ prinsipImages })
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
      values: Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v != null && typeof v === 'string')
      ) as Record<string, string>
    }
  }

  return persist('tentang-prinsip', result.data, access.orgId, 'Gagal menyimpan gambar prinsip.')
}

// ─── Paradigma images ─────────────────────────────────────────────────────────

const paradigmaSchema = z.object({
  paradigmaImages: z.array(z.string()).length(4)
})

export const saveTentangParadigmaAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  let paradigmaImages
  try {
    paradigmaImages = JSON.parse(raw.paradigmaImages as string)
  } catch {
    return { error: 'Data gambar paradigma tidak valid.' }
  }

  const result = paradigmaSchema.safeParse({ paradigmaImages })
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
      values: Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v != null && typeof v === 'string')
      ) as Record<string, string>
    }
  }

  return persist('tentang-paradigma', result.data, access.orgId, 'Gagal menyimpan gambar paradigma.')
}

// ─── Kredo background ─────────────────────────────────────────────────────────

const kredoBgSchema = z.object({
  kredoImageUrl: z.string()
})

export const saveTentangKredoAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }

  const raw = Object.fromEntries(formData)
  const result = kredoBgSchema.safeParse(raw)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
      values: Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v != null && typeof v === 'string')
      ) as Record<string, string>
    }
  }

  return persist('tentang-kredo', result.data, access.orgId, 'Gagal menyimpan latar kredo.')
}
```

**Note:** Each section uses its own sub-key (`tentang-hero`, `tentang-prinsip`, `tentang-paradigma`, `tentang-kredo`) so saves are independent. The public page fetches all four and merges them into a `TentangSettings` object.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/tentang/_components/action.ts
git commit -m "feat(tentang-settings): add server actions for tentang settings"
```

---

## Task 4: Create `HeroBgForm`

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/hero-bg-form/hero-bg-form.tsx`
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/hero-bg-form/index.ts`

- [ ] **Step 1: Create `hero-bg-form.tsx`**

```tsx
'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveTentangHeroAction, type SettingsActionState } from '../action'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type Props = { initialData: { heroImageUrl: string } }

export const HeroBgForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveTentangHeroAction, {})

  const [heroImageUrl, setHeroImageUrl] = useState(initialData.heroImageUrl)

  const { isDirty, markClean } = useUnsavedChanges({ heroImageUrl })

  useEffect(() => {
    if (state.success) {
      toast.success('Latar hero berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('heroImageUrl', heroImageUrl)
      formAction(fd)
    },
    [heroImageUrl, formAction]
  )

  const fe = state.fieldErrors ?? {}

  return (
    <form action={handleAction} className='space-y-8'>
      <Field>
        <FieldContent>
          <ImageUpload
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            folder='site-settings/tentang/hero'
          />
        </FieldContent>
        <FieldDescription>
          Gambar latar belakang untuk seksi hero halaman Tentang. Biarkan kosong
          untuk menggunakan desain default.
        </FieldDescription>
        <FieldError errors={fe.heroImageUrl?.map((m) => ({ message: m }))} />
      </Field>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create `index.ts`**

```ts
export * from './hero-bg-form'
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/tentang/_components/hero-bg-form/
git commit -m "feat(tentang-settings): add HeroBgForm component"
```

---

## Task 5: Create `PrinsipForm`

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/prinsip-form/prinsip-form.tsx`
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/prinsip-form/index.ts`

- [ ] **Step 1: Create `prinsip-form.tsx`**

```tsx
'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  Field,
  FieldContent,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveTentangPrinsipAction, type SettingsActionState } from '../action'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

const PRINSIP_LABELS = [
  'Kemenangan Islam adalah jiwa perjuangan KAMMI',
  'Kebatilan adalah musuh abadi KAMMI',
  'Solusi Islam adalah tawaran perjuangan KAMMI',
  'Perbaikan adalah tradisi perjuangan KAMMI',
  'Kepemimpinan ummat adalah strategi perjuangan KAMMI',
  'Persaudaraan adalah watak muamalah KAMMI'
]

type Props = { initialData: { prinsipImages: string[] } }

export const PrinsipForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveTentangPrinsipAction, {})

  const [images, setImages] = useState<string[]>(
    initialData.prinsipImages.length === 6
      ? initialData.prinsipImages
      : ['', '', '', '', '', '']
  )

  const updateImage = useCallback((i: number, url: string) => {
    setImages((prev) => {
      const next = [...prev]
      next[i] = url
      return next
    })
  }, [])

  const { isDirty, markClean } = useUnsavedChanges({ images })

  useEffect(() => {
    if (state.success) {
      toast.success('Gambar prinsip berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('prinsipImages', JSON.stringify(images))
      formAction(fd)
    },
    [images, formAction]
  )

  return (
    <form action={handleAction} className='space-y-8'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {PRINSIP_LABELS.map((label, i) => (
          <Field key={i}>
            <FieldLabel>
              <span className='text-muted-foreground font-mono text-xs'>
                {String(i + 1).padStart(2, '0')}
              </span>{' '}
              {label}
            </FieldLabel>
            <FieldContent>
              <ImageUpload
                value={images[i] ?? ''}
                onChange={(url) => updateImage(i, url)}
                folder='site-settings/tentang/prinsip'
              />
            </FieldContent>
          </Field>
        ))}
      </div>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Gambar Prinsip'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create `index.ts`**

```ts
export * from './prinsip-form'
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/tentang/_components/prinsip-form/
git commit -m "feat(tentang-settings): add PrinsipForm component"
```

---

## Task 6: Create `ParadigmaForm`

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/paradigma-form/paradigma-form.tsx`
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/paradigma-form/index.ts`

- [ ] **Step 1: Create `paradigma-form.tsx`**

```tsx
'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  Field,
  FieldContent,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveTentangParadigmaAction, type SettingsActionState } from '../action'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

const PARADIGMA_LABELS = [
  'KAMMI adalah gerakan dakwah tauhid',
  'KAMMI adalah intelektual profetik',
  'KAMMI adalah gerakan sosial independen',
  'KAMMI adalah gerakan politik ekstraparlementer'
]

type Props = { initialData: { paradigmaImages: string[] } }

export const ParadigmaForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveTentangParadigmaAction, {})

  const [images, setImages] = useState<string[]>(
    initialData.paradigmaImages.length === 4
      ? initialData.paradigmaImages
      : ['', '', '', '']
  )

  const updateImage = useCallback((i: number, url: string) => {
    setImages((prev) => {
      const next = [...prev]
      next[i] = url
      return next
    })
  }, [])

  const { isDirty, markClean } = useUnsavedChanges({ images })

  useEffect(() => {
    if (state.success) {
      toast.success('Gambar paradigma berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('paradigmaImages', JSON.stringify(images))
      formAction(fd)
    },
    [images, formAction]
  )

  return (
    <form action={handleAction} className='space-y-8'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        {PARADIGMA_LABELS.map((label, i) => (
          <Field key={i}>
            <FieldLabel>
              <span className='text-muted-foreground font-mono text-xs'>
                {String(i + 1).padStart(2, '0')}
              </span>{' '}
              {label}
            </FieldLabel>
            <FieldContent>
              <ImageUpload
                value={images[i] ?? ''}
                onChange={(url) => updateImage(i, url)}
                folder='site-settings/tentang/paradigma'
              />
            </FieldContent>
          </Field>
        ))}
      </div>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan Gambar Paradigma'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create `index.ts`**

```ts
export * from './paradigma-form'
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/tentang/_components/paradigma-form/
git commit -m "feat(tentang-settings): add ParadigmaForm component"
```

---

## Task 7: Create `KredoForm`

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/kredo-form/kredo-form.tsx`
- Create: `src/app/(dashboard)/dashboard/pages/tentang/_components/kredo-form/index.ts`

- [ ] **Step 1: Create `kredo-form.tsx`**

```tsx
'use client'

import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError
} from '~/components/shadcn/ui/field'
import { ImageUpload } from '~/components/image-upload'
import { saveTentangKredoAction, type SettingsActionState } from '../action'
import { useUnsavedChanges } from '~/hooks/use-unsaved-changes'
import { UnsavedChangesBanner } from '~/components/unsaved-changes-banner'

type Props = { initialData: { kredoImageUrl: string } }

export const KredoForm = ({ initialData }: Props) => {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(saveTentangKredoAction, {})

  const [kredoImageUrl, setKredoImageUrl] = useState(initialData.kredoImageUrl)

  const { isDirty, markClean } = useUnsavedChanges({ kredoImageUrl })

  useEffect(() => {
    if (state.success) {
      toast.success('Latar kredo berhasil disimpan.')
      markClean()
    }
    if (state.error) toast.error(state.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleAction = useCallback(
    (fd: FormData) => {
      fd.set('kredoImageUrl', kredoImageUrl)
      formAction(fd)
    },
    [kredoImageUrl, formAction]
  )

  const fe = state.fieldErrors ?? {}

  return (
    <form action={handleAction} className='space-y-8'>
      <Field>
        <FieldContent>
          <ImageUpload
            value={kredoImageUrl}
            onChange={setKredoImageUrl}
            folder='site-settings/tentang/kredo'
          />
        </FieldContent>
        <FieldDescription>
          Gambar latar di belakang teks Kredo KAMMI. Biarkan kosong untuk
          menggunakan warna perkamen default.
        </FieldDescription>
        <FieldError errors={fe.kredoImageUrl?.map((m) => ({ message: m }))} />
      </Field>

      <div className='flex items-center justify-end gap-3'>
        <UnsavedChangesBanner isDirty={isDirty} />
        <Button type='submit' className='px-6' disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create `index.ts`**

```ts
export * from './kredo-form'
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/tentang/_components/kredo-form/
git commit -m "feat(tentang-settings): add KredoForm component"
```

---

## Task 8: Create the settings page

**Files:**
- Create: `src/app/(dashboard)/dashboard/pages/tentang/page.tsx`

- [ ] **Step 1: Create `page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import { Separator } from '~/components/shadcn/ui/separator'
import { HeroBgForm } from './_components/hero-bg-form'
import { PrinsipForm } from './_components/prinsip-form'
import { ParadigmaForm } from './_components/paradigma-form'
import { KredoForm } from './_components/kredo-form'
import { getCachedTentangSettings } from './_data/settings'

const TentangSettingsPage = async () => {
  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumas = role === 'humas'

  if (!isRoot && !isHumas) redirect('/dashboard')

  const orgId = connectedOrganization?.id
  if (!orgId) redirect('/dashboard')

  const tentang = await getCachedTentangSettings(orgId)

  const sections = [
    {
      id: 'hero',
      title: 'Latar Hero',
      description: 'Gambar latar belakang untuk seksi hero halaman /tentang.',
      content: <HeroBgForm initialData={tentang} />
    },
    {
      id: 'prinsip',
      title: 'Prinsip Gerakan KAMMI',
      description:
        'Gambar latar untuk masing-masing dari enam poin prinsip gerakan.',
      content: <PrinsipForm initialData={tentang} />
    },
    {
      id: 'paradigma',
      title: 'Paradigma Gerakan KAMMI',
      description:
        'Foto untuk masing-masing dari empat poin paradigma gerakan.',
      content: <ParadigmaForm initialData={tentang} />
    },
    {
      id: 'kredo',
      title: 'Kredo Gerakan KAMMI',
      description: 'Gambar latar di belakang teks Kredo KAMMI.',
      content: <KredoForm initialData={tentang} />
    }
  ]

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-12 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon
            icon={InformationCircleIcon}
            strokeWidth={2}
            className='size-6'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengaturan Halaman Tentang
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Kelola gambar yang ditampilkan di{' '}
            <span className='text-foreground font-medium'>kammi.id/tentang</span>
            . Perubahan langsung aktif setelah disimpan.
          </p>
        </div>
      </div>

      <div className='space-y-6'>
        {sections.map((section, i) => (
          <Card key={section.id} className='rounded-3xl shadow-xs'>
            <CardHeader className='border-b pb-5'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground font-mono text-xs'>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Separator orientation='vertical' className='h-3' />
                    <CardTitle className='text-base font-semibold'>
                      {section.title}
                    </CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-6 pb-6'>{section.content}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TentangSettingsPage
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/pages/tentang/page.tsx
git commit -m "feat(tentang-settings): add TentangSettingsPage"
```

---

## Task 9: Add sidebar navigation entry

**Files:**
- Modify: `src/app/(dashboard)/dashboard/_components/app-sidebar/app-sidebar.tsx`

- [ ] **Step 1: Add `InformationCircleIcon` to the import**

Find the existing import block from `@hugeicons/core-free-icons` and add `InformationCircleIcon`:

```tsx
import {
  DashboardSquare01Icon,
  WhiteboardIcon,
  User02Icon,
  TeacherIcon,
  Mortarboard01Icon,
  Globe02Icon,
  Database01Icon,
  Add01Icon,
  Note01Icon,
  Home01Icon,
  UserGroupIcon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons'
```

- [ ] **Step 2: Add "Halaman Tentang" entry inside the `canAccessHalamanPublik` block**

Find the existing items array for "Halaman Publik" (around line 186) and add the third entry:

```tsx
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
      },
      {
        title: 'Halaman Tentang',
        url: '/dashboard/pages/tentang',
        icon: <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
      }
    ]}
  />
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/_components/app-sidebar/app-sidebar.tsx
git commit -m "feat(tentang-settings): add Halaman Tentang to sidebar"
```

---

## Task 10: Update `TentangScene` to consume settings

**Files:**
- Modify: `src/app/(main)/tentang/_components/tentang-scene/tentang-scene.tsx`

This task wires up the visual changes. The GSAP animation logic is untouched — only the rendered JSX changes.

**Important context:**
- Prinsip background: `.prinsip-photo-{i}` divs — replace CSS gradient `backgroundImage` with real URL when non-empty, keep gradient as fallback.
- Paradigma photo: inner `<div>` inside each `<figure>` — same pattern.
- Hero background: apply as `backgroundImage` on the `heroRef` wrapper div.
- Kredo background: add a `kredo-bg` div inside `kredoRef` starting at opacity 0, faded in by GSAP during `kredoIn`.

- [ ] **Step 1: Add `TentangSettings` import and prop to the component signature**

At the top of the file, after existing imports, add:

```tsx
import type { TentangSettings } from '~/db/query/site-settings'
```

Change the component signature from:

```tsx
export const TentangScene = () => {
```

to:

```tsx
export const TentangScene = ({ settings }: { settings: TentangSettings }) => {
```

- [ ] **Step 2: Add GSAP animation for `kredo-bg` in the `kredoIn` block**

Find the kredoIn animation block (around the `.addLabel('kredoIn')` line). After the existing `.fromTo(kredoDocRef.current, ...)` lines, add the kredo-bg fade-in:

```tsx
// after the kredoDoc fromTo/y animation, add:
.fromTo(
  '.kredo-bg',
  { opacity: 0 },
  { opacity: 0.12, duration: 0.6, ease: 'none' },
  'kredoIn+=0.2'
)
```

Full kredoIn block for reference (find this section and insert the last `.fromTo` before the closing of the `mainTl` chain):

```tsx
.addLabel('kredoIn')
.to(`.paradigma-text-${lastParadigma}`, { opacity: 0, y: -60, duration: 0.5, ease: 'power2.in' }, 'kredoIn')
.to(`.paradigma-photo-${lastParadigma}`, { opacity: 0, y: -60, duration: 0.5, ease: 'power2.in' }, '<')
.to('.paradigma-eyebrow', { opacity: 0, duration: 0.4, ease: 'power2.in' }, '<')
.to(sceneRef.current, { backgroundColor: PARCHMENT, duration: 0.6, ease: 'none' }, 'kredoIn+=0.2')
.set(paradigmaRef.current, { pointerEvents: 'none' })
.set(kredoRef.current, { pointerEvents: 'auto' })
.fromTo('.kredo-eyebrow', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
.fromTo(kredoDocRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'none' })
.fromTo(kredoDocRef.current, { y: 0 }, { y: kredoEndY, duration: 11, ease: 'none' })
// ADD THIS:
.fromTo('.kredo-bg', { opacity: 0 }, { opacity: 0.12, duration: 0.6, ease: 'none' }, 'kredoIn+=0.2')
```

- [ ] **Step 3: Update the hero wrapper div to use `settings.heroImageUrl`**

Find this block in the JSX:

```tsx
<div ref={heroRef} className='absolute inset-0 z-10'>
  <TentangHero />
</div>
```

Replace with:

```tsx
<div
  ref={heroRef}
  className='absolute inset-0 z-10'
  style={
    settings.heroImageUrl
      ? {
          backgroundImage: `url(${settings.heroImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      : undefined
  }
>
  <TentangHero />
</div>
```

- [ ] **Step 4: Update prinsip photo divs to use `settings.prinsipImages`**

Find the prinsip background photos block inside the prinsipRef div:

```tsx
{PRINSIP_ITEMS.map((_, i) => (
  <div
    key={i}
    className={`prinsip-photo-${i} absolute inset-0 h-full w-full opacity-0`}
    style={{
      backgroundImage: `linear-gradient(155deg, oklch(0.45 0.06 ${17 + i * 28}), oklch(0.2 0.03 ${17 + i * 28}))`,
      maskImage: 'linear-gradient(315deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 68%)',
      WebkitMaskImage: 'linear-gradient(315deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 68%)'
    }}
    aria-hidden='true'
  />
))}
```

Replace with:

```tsx
{PRINSIP_ITEMS.map((_, i) => (
  <div
    key={i}
    className={`prinsip-photo-${i} absolute inset-0 h-full w-full opacity-0`}
    style={{
      backgroundImage: settings.prinsipImages[i]
        ? `url(${settings.prinsipImages[i]})`
        : `linear-gradient(155deg, oklch(0.45 0.06 ${17 + i * 28}), oklch(0.2 0.03 ${17 + i * 28}))`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      maskImage: 'linear-gradient(315deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 68%)',
      WebkitMaskImage: 'linear-gradient(315deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 68%)'
    }}
    aria-hidden='true'
  />
))}
```

- [ ] **Step 5: Update paradigma photo figure divs to use `settings.paradigmaImages`**

Find the inner `<div>` with the gradient inside each `<figure>`:

```tsx
<div
  className='aspect-[4/5] w-full'
  style={{
    backgroundImage: `linear-gradient(150deg, oklch(0.5 0.08 ${17 + i * 22}), oklch(0.24 0.04 ${17 + i * 22}))`
  }}
  aria-hidden='true'
/>
```

Replace with:

```tsx
<div
  className='aspect-[4/5] w-full'
  style={{
    backgroundImage: settings.paradigmaImages[i]
      ? `url(${settings.paradigmaImages[i]})`
      : `linear-gradient(150deg, oklch(0.5 0.08 ${17 + i * 22}), oklch(0.24 0.04 ${17 + i * 22}))`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
  aria-hidden='true'
/>
```

- [ ] **Step 6: Add `kredo-bg` element inside the kredoRef div**

Find the kredoRef div opening:

```tsx
<div ref={kredoRef} className='pointer-events-none absolute inset-0 z-[60]'>
  {/* Eyebrow — outside the mask so it stays sticky at top */}
```

Add the kredo-bg div as the first child:

```tsx
<div ref={kredoRef} className='pointer-events-none absolute inset-0 z-[60]'>
  {settings.kredoImageUrl && (
    <div
      className='kredo-bg absolute inset-0'
      style={{
        backgroundImage: `url(${settings.kredoImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0
      }}
      aria-hidden='true'
    />
  )}
  {/* Eyebrow — outside the mask so it stays sticky at top */}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 8: Commit**

```bash
git add src/app/\(main\)/tentang/_components/tentang-scene/tentang-scene.tsx
git commit -m "feat(tentang-settings): wire TentangScene to consume settings props"
```

---

## Task 11: Update public `/tentang` page to fetch and pass settings

**Files:**
- Modify: `src/app/(main)/tentang/page.tsx`

- [ ] **Step 1: Add settings fetch + prop pass**

The current `page.tsx` is a simple server component. We need to make it async, fetch settings, and pass them to `TentangScene`.

Replace the entire file:

```tsx
import type { Metadata } from 'next'
import { TentangScene } from './_components/tentang-scene'
import { SectionNav } from './_components/section-nav'
import { readSiteSettings, SETTINGS_DEFAULTS, type TentangSettings } from '~/db/query/site-settings'

export const metadata: Metadata = {
  title: 'Tentang KAMMI',
  description:
    'Mengenal KAMMI — sejarah, visi, misi, karakteristik, prinsip, paradigma, dan kredo gerakan.'
}

const PP_ORG_ID = process.env.PP_ORGANIZATION_ID ?? ''

const TentangPage = async () => {
  const [heroData, prinsipData, paradigmaData, kredoData] = await Promise.all([
    readSiteSettings<{ heroImageUrl: string }>(
      'tentang-hero',
      { heroImageUrl: SETTINGS_DEFAULTS.tentang.heroImageUrl },
      PP_ORG_ID
    ),
    readSiteSettings<{ prinsipImages: string[] }>(
      'tentang-prinsip',
      { prinsipImages: SETTINGS_DEFAULTS.tentang.prinsipImages },
      PP_ORG_ID
    ),
    readSiteSettings<{ paradigmaImages: string[] }>(
      'tentang-paradigma',
      { paradigmaImages: SETTINGS_DEFAULTS.tentang.paradigmaImages },
      PP_ORG_ID
    ),
    readSiteSettings<{ kredoImageUrl: string }>(
      'tentang-kredo',
      { kredoImageUrl: SETTINGS_DEFAULTS.tentang.kredoImageUrl },
      PP_ORG_ID
    )
  ])

  const settings: TentangSettings = {
    heroImageUrl: heroData.heroImageUrl,
    prinsipImages: prinsipData.prinsipImages,
    paradigmaImages: paradigmaData.paradigmaImages,
    kredoImageUrl: kredoData.kredoImageUrl
  }

  return (
    <>
      <SectionNav />
      <TentangScene settings={settings} />
    </>
  )
}

export default TentangPage
```

**Note on `PP_ORG_ID`:** The public `/tentang` page always shows the PP (Pengurus Pusat) org's settings. Check the existing codebase for how `PP_ORGANIZATION_ID` is set — look at how other public pages resolve the PP org ID. If there's a different pattern (e.g. a `getPublicOrgId()` helper), use that instead of the env var approach above.

- [ ] **Step 2: Verify how the existing public pages resolve PP org ID**

```bash
grep -r "PP_ORGANIZATION_ID\|getPublicOrg\|publicOrg" src/app/\(main\) --include="*.ts" --include="*.tsx" | head -20
```

Adapt the `PP_ORG_ID` approach to match what you find.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(main\)/tentang/page.tsx
git commit -m "feat(tentang-settings): update public /tentang page to fetch and use settings"
```

---

## Task 12: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Login as humas-kammi** (credentials in `users.csv`)

Navigate to `http://localhost:3000/login` and sign in.

- [ ] **Step 3: Verify sidebar entry**

Check that "Halaman Tentang" appears under "Halaman Publik" in the sidebar.

- [ ] **Step 4: Navigate to `/dashboard/pages/tentang`**

Confirm:
- Page header shows "Pengaturan Halaman Tentang"
- Four card sections visible: Latar Hero, Prinsip Gerakan KAMMI, Paradigma Gerakan KAMMI, Kredo Gerakan KAMMI
- Prinsip section shows 6 image upload fields with correct labels
- Paradigma section shows 4 image upload fields with correct labels

- [ ] **Step 5: Upload a test image to one prinsip slot, save, navigate to `/tentang`**

Confirm the uploaded image appears in the corresponding prinsip background slot (the gradient should be replaced by the photo).

- [ ] **Step 6: Upload images for hero and kredo, save, verify on `/tentang`**

Confirm hero background image appears, confirm kredo background appears at low opacity behind the parchment text.

---

## Self-Review Notes

1. **Spec coverage:**
   - ✅ Hero background image → Task 4 + 10
   - ✅ 6 prinsip background images → Task 5 + 10
   - ✅ 4 paradigma background images → Task 6 + 10
   - ✅ Kredo background image → Task 7 + 10
   - ✅ Settings page at `/dashboard/pages/tentang` → Task 8
   - ✅ Sidebar "Halaman Tentang" entry → Task 9
   - ✅ Public page consumes settings → Task 11

2. **Potential issue — `PP_ORG_ID` in public page (Task 11):** The plan flags this explicitly and asks the implementer to verify the existing pattern before hardcoding an env var. This is the only under-specified step; all others have complete code.

3. **Type consistency:** `TentangSettings` is defined in Task 1 and referenced by name in Tasks 2, 3, 4, 5, 6, 7, 8, 10, 11 — all consistent. Sub-keys `tentang-hero`, `tentang-prinsip`, `tentang-paradigma`, `tentang-kredo` are used consistently in both actions (Task 3) and public page fetch (Task 11).
