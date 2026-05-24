# Dashboard Ringkasan Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign halaman `/dashboard` menjadi "Morning Briefing + Role-First Adaptive" layout: contextual greeting header, stats section adaptif per role (tab untuk root/bph, full-width untuk bpk/bpw), dan dauroh terdekat dengan urgency awareness.

**Architecture:** Tiga zona layout — header kontekstual (baru), stats section role-adaptive (refactor tab + existing stats), dan dauroh terdekat (refactor UpcomingTrainings). `DashboardTabs` diganti dengan `DashboardStats` yang menangani semua role variants secara langsung. `page.tsx` menjadi lebih thin, meneruskan data ke komponen masing-masing zona.

**Tech Stack:** Next.js 15 (RSC), Tailwind CSS v4, shadcn/ui (Tabs), Hugeicons, Geist Mono font

---

## File Map

**Create:**
- `src/app/(dashboard)/dashboard/_components/dashboard-header/dashboard-header.tsx` — Greeting + org name + tanggal
- `src/app/(dashboard)/dashboard/_components/dashboard-header/index.ts` — barrel export
- `src/app/(dashboard)/dashboard/_components/dashboard-stats/dashboard-stats.tsx` — Role-adaptive stats container (tabs untuk bph/root, direct untuk bpk/bpw)
- `src/app/(dashboard)/dashboard/_components/dashboard-stats/index.ts` — barrel export

**Modify:**
- `src/app/(dashboard)/dashboard/page.tsx` — Gunakan tiga zona baru, hapus DashboardTabs import
- `src/app/(dashboard)/dashboard/_components/upcoming-trainings/upcoming-trainings.tsx` — Ubah dari tabel ke list dengan urgency awareness
- `src/app/(dashboard)/dashboard/_components/dashboard-tabs/dashboard-tabs.tsx` — Akan dihapus setelah diganti

---

## Task 1: `DashboardHeader` component

**Files:**
- Create: `src/app/(dashboard)/dashboard/_components/dashboard-header/dashboard-header.tsx`
- Create: `src/app/(dashboard)/dashboard/_components/dashboard-header/index.ts`

- [ ] **Step 1: Buat komponen `DashboardHeader`**

Buat file `src/app/(dashboard)/dashboard/_components/dashboard-header/dashboard-header.tsx`:

```tsx
const roleLabels: Record<string, string> = {
  root: 'Administrator',
  bph: 'Badan Pengurus Harian',
  bpk: 'Badan Pengkaderan',
  bpw: 'Badan Pengembangan Wilayah',
  humas: 'Hubungan Masyarakat'
}

const getGreeting = (hour: number) => {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export const DashboardHeader = ({
  displayName,
  role,
  orgName,
  date
}: {
  displayName: string | null
  role: string
  orgName: string
  date: Date
}) => {
  const hour = date.getHours()
  const greeting = getGreeting(hour)
  const name = displayName?.split(' ')[0] ?? 'Kak'

  const formattedDate = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className='flex flex-col gap-0.5'>
      <p className='text-xs text-muted-foreground'>{formattedDate}</p>
      <h1 className='font-heading text-2xl font-bold tracking-tight'>
        {greeting}, {name}.
      </h1>
      <p className='text-sm text-muted-foreground'>
        {orgName}{' '}
        <span className='text-muted-foreground/60'>
          &middot; {roleLabels[role] ?? role}
        </span>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Buat barrel export**

Buat file `src/app/(dashboard)/dashboard/_components/dashboard-header/index.ts`:

```ts
export * from './dashboard-header'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/_components/dashboard-header/
git commit -m "feat(dashboard): tambah DashboardHeader komponen kontekstual"
```

---

## Task 2: `DashboardStats` component (role-adaptive container)

**Files:**
- Create: `src/app/(dashboard)/dashboard/_components/dashboard-stats/dashboard-stats.tsx`
- Create: `src/app/(dashboard)/dashboard/_components/dashboard-stats/index.ts`

- [ ] **Step 1: Buat `DashboardStats` yang menggantikan `DashboardTabs`**

Buat file `src/app/(dashboard)/dashboard/_components/dashboard-stats/dashboard-stats.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/shadcn/ui/tabs'

export const DashboardStats = ({
  role,
  kaderContent,
  wilayahContent
}: {
  role: string
  kaderContent: ReactNode | null
  wilayahContent: ReactNode | null
}) => {
  const showBoth = ['root', 'bph'].includes(role)

  if (showBoth && kaderContent && wilayahContent) {
    return (
      <Tabs defaultValue='kader'>
        <TabsList>
          <TabsTrigger value='kader'>Kader</TabsTrigger>
          <TabsTrigger value='wilayah'>Wilayah</TabsTrigger>
        </TabsList>
        <TabsContent value='kader' className='mt-4'>
          {kaderContent}
        </TabsContent>
        <TabsContent value='wilayah' className='mt-4'>
          {wilayahContent}
        </TabsContent>
      </Tabs>
    )
  }

  if (kaderContent) return <>{kaderContent}</>
  if (wilayahContent) return <>{wilayahContent}</>
  return null
}
```

- [ ] **Step 2: Buat barrel export**

Buat file `src/app/(dashboard)/dashboard/_components/dashboard-stats/index.ts`:

```ts
export * from './dashboard-stats'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/_components/dashboard-stats/
git commit -m "feat(dashboard): tambah DashboardStats role-adaptive container"
```

---

## Task 3: Redesign `UpcomingTrainings` dengan urgency awareness

**Files:**
- Modify: `src/app/(dashboard)/dashboard/_components/upcoming-trainings/upcoming-trainings.tsx`

Ubah dari tabel ke list sederhana. Dauroh dalam 7 hari mendapat treatment visual berbeda.

- [ ] **Step 1: Baca file existing**

Baca `src/app/(dashboard)/dashboard/_components/upcoming-trainings/upcoming-trainings.tsx` untuk memastikan tidak ada perubahan yang belum tersimpan.

- [ ] **Step 2: Ganti isi file dengan versi baru**

```tsx
import Link from 'next/link'
import { ArrowRight01Icon, Calendar03Icon, AlertCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '~/lib/shadcn/utils'
import type { UpcomingTraining } from '~/app/(dashboard)/dashboard/_data/trainings'

const typeLabels: Record<string, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dpmk: 'DPMK',
  tfi: 'TFI',
  dm3: 'DM 3',
  other: 'Lainnya'
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

const getDaysUntil = (dateStr: string) => {
  const start = new Date(dateStr)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}


export const UpcomingTrainings = ({
  data
}: {
  data: UpcomingTraining[]
}) => {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-base font-semibold tracking-tight'>
            Dauroh Terdekat
          </h2>
          <p className='text-xs text-muted-foreground'>
            Yang akan datang dalam scope organisasi
          </p>
        </div>
        <Link
          href='/dashboard/trainings'
          className='inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline'
        >
          Semua dauroh
          <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border bg-card py-12 text-center'>
          <HugeiconsIcon icon={Calendar03Icon} className='size-8 text-muted-foreground/30' />
          <p className='text-sm font-medium text-muted-foreground'>
            Tidak ada dauroh yang akan datang.
          </p>
          <Link
            href='/dashboard/trainings'
            className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
          >
            Tambah dauroh baru
            <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
          </Link>
        </div>
      ) : (
        <div className='flex flex-col divide-y rounded-xl border bg-card overflow-hidden'>
          {data.map((training) => {
            const days = getDaysUntil(training.startDate)
            const isUrgent = days >= 0 && days <= 7
            const href = `/dashboard/trainings/${training.organization.codeSlug}/${training.year}${String(training.identifier).padStart(3, '0')}`

            return (
              <div
                key={training.id}
                className={cn(
                  'flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40',
                  isUrgent && 'bg-primary/[0.03]'
                )}
              >
                <div className='flex min-w-0 flex-col gap-0.5'>
                  <div className='flex items-center gap-2'>
                    {isUrgent && (
                      <HugeiconsIcon
                        icon={AlertCircleIcon}
                        className='size-3.5 shrink-0 text-primary'
                      />
                    )}
                    <Link
                      href={href}
                      className='truncate text-sm font-medium hover:text-primary hover:underline transition-colors'
                    >
                      {training.name}
                    </Link>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <span className='font-mono text-muted-foreground/60'>
                      {training.year}{String(training.identifier).padStart(3, '0')}
                    </span>
                    <span>&middot;</span>
                    <span>{training.organization.name}</span>
                    <span>&middot;</span>
                    <span className='rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary'>
                      {typeLabels[training.type] ?? training.type}
                    </span>
                  </div>
                </div>

                <div className='shrink-0 text-right'>
                  {days >= 0 && days <= 7 ? (
                    <span className='font-mono text-xs font-semibold text-primary'>
                      {days === 0 ? 'Hari ini' : days === 1 ? 'Besok' : `${days} hari lagi`}
                    </span>
                  ) : (
                    <span className='font-mono text-xs text-muted-foreground/60'>
                      {formatDate(training.startDate)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/_components/upcoming-trainings/upcoming-trainings.tsx
git commit -m "feat(dashboard): redesign UpcomingTrainings jadi list dengan urgency awareness"
```

---

## Task 4: Refactor `page.tsx` untuk tiga-zona layout

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Baca file existing**

Baca `src/app/(dashboard)/dashboard/page.tsx` untuk memastikan state terkini.

- [ ] **Step 2: Ganti isi `page.tsx` dengan versi tiga-zona**

```tsx
import { readActiveSession } from '~/lib/auth/cookies'
import { fetchAllowedOrgIds } from '~/db/query/organization'
import { readMemberAggregates } from '~/db/query/member'
import { getCachedMemberYearDistribution } from './_data/members'
import { getCachedOrganizationCount } from './_data/organizations'
import { getCachedUpcomingTrainings } from './_data/trainings'
import { DashboardHeader } from './_components/dashboard-header'
import { DashboardStats } from './_components/dashboard-stats'
import { KaderStats, type KaderStatsData } from './_components/kader-stats'
import { KaderChart } from './_components/kader-chart'
import { WilayahStats } from './_components/wilayah-stats'
import { UpcomingTrainings } from './_components/upcoming-trainings'

const sumAggregates = (
  rows: Awaited<ReturnType<typeof readMemberAggregates>>
) =>
  rows.reduce(
    (acc, r) => ({
      ab1: acc.ab1 + r.ab1,
      ab2: acc.ab2 + r.ab2,
      ab3: acc.ab3 + r.ab3,
      ikhwan: acc.ikhwan + r.ikhwan,
      akhwat: acc.akhwat + r.akhwat,
      total: acc.total + r.total
    }),
    { ab1: 0, ab2: 0, ab3: 0, ikhwan: 0, akhwat: 0, total: 0 }
  )

const Page = async () => {
  const session = await readActiveSession()
  if (!session) return null

  const user = session.user
  const role = user.role
  const connectedOrganizationId = user.connectedOrganization?.id ?? null

  const userForScope = { role, connectedOrganizationId }
  const allowedOrgIds = await fetchAllowedOrgIds(userForScope)

  const showKader = ['root', 'bph', 'bpk'].includes(role)
  const showWilayah = ['root', 'bph', 'bpw'].includes(role)

  const [
    kaderAgg,
    pemandoAgg,
    instrukturAgg,
    alumniAgg,
    yearDist,
    pwCount,
    pdCount,
    pkCount,
    upcomingTrainings
  ] = await Promise.all([
    showKader
      ? readMemberAggregates({ user: userForScope })
      : Promise.resolve([]),
    showKader
      ? readMemberAggregates({ user: userForScope, isCertifiedMentor: true })
      : Promise.resolve([]),
    showKader
      ? readMemberAggregates({ user: userForScope, isCertifiedInstructor: true })
      : Promise.resolve([]),
    showKader
      ? readMemberAggregates({ user: userForScope, isAlumn: true })
      : Promise.resolve([]),
    showKader
      ? getCachedMemberYearDistribution(allowedOrgIds)
      : Promise.resolve([]),
    showWilayah
      ? getCachedOrganizationCount({ type: ['pw', 'pdln'], id: allowedOrgIds.length ? allowedOrgIds : undefined })
      : Promise.resolve(0),
    showWilayah
      ? getCachedOrganizationCount({ type: ['pd'], id: allowedOrgIds.length ? allowedOrgIds : undefined })
      : Promise.resolve(0),
    showWilayah
      ? getCachedOrganizationCount({ type: ['pk'], id: allowedOrgIds.length ? allowedOrgIds : undefined })
      : Promise.resolve(0),
    getCachedUpcomingTrainings(allowedOrgIds.length ? allowedOrgIds : undefined)
  ])

  const kaderData: KaderStatsData = {
    ...sumAggregates(kaderAgg),
    pemandu: sumAggregates(pemandoAgg).total,
    instruktur: sumAggregates(instrukturAgg).total,
    alumni: sumAggregates(alumniAgg).total
  }

  const wilayahData = { pw: pwCount, pd: pdCount, pk: pkCount }

  const kaderContent = showKader ? (
    <div className='flex flex-col gap-4'>
      <KaderStats data={kaderData} />
      <KaderChart data={yearDist} />
    </div>
  ) : null

  const wilayahContent = showWilayah ? (
    <WilayahStats data={wilayahData} />
  ) : null

  const orgName = user.connectedOrganization?.name ?? 'KAMMI Indonesia'

  return (
    <div className='flex flex-col gap-8 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      {/* Zona 1: Contextual Header */}
      <DashboardHeader
        displayName={user.displayName}
        role={role}
        orgName={orgName}
        date={new Date()}
      />

      {/* Zona 2: Stats (role-adaptive) */}
      {(kaderContent || wilayahContent) && (
        <DashboardStats
          role={role}
          kaderContent={kaderContent}
          wilayahContent={wilayahContent}
        />
      )}

      {/* Zona 3: Dauroh Terdekat */}
      <UpcomingTrainings data={upcomingTrainings} />
    </div>
  )
}

export default Page
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/page.tsx
git commit -m "feat(dashboard): refactor page.tsx ke three-zone Morning Briefing layout"
```

---

## Task 5: Cleanup `DashboardTabs` yang sudah tidak dipakai

**Files:**
- Modify/Delete: `src/app/(dashboard)/dashboard/_components/dashboard-tabs/dashboard-tabs.tsx`
- Modify/Delete: `src/app/(dashboard)/dashboard/_components/dashboard-tabs/index.ts`

- [ ] **Step 1: Verifikasi `DashboardTabs` sudah tidak diimport di mana pun**

```bash
grep -r "DashboardTabs\|dashboard-tabs" \
  src/app/\(dashboard\)/dashboard/ \
  --include="*.tsx" --include="*.ts" \
  -l
```

Expected output: tidak ada file yang muncul (atau hanya file `dashboard-tabs` itu sendiri).

- [ ] **Step 2: Hapus folder `dashboard-tabs`**

```bash
rm -rf src/app/\(dashboard\)/dashboard/_components/dashboard-tabs/
```

- [ ] **Step 3: Commit**

```bash
git add -A src/app/(dashboard)/dashboard/_components/dashboard-tabs/
git commit -m "chore(dashboard): hapus DashboardTabs yang sudah digantikan DashboardStats"
```

---

## Task 6: Verifikasi visual di browser

- [ ] **Step 1: Jalankan dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Buka halaman `/dashboard` di browser dan cek**

Gunakan MCP chrome-devtools atau Playwright untuk screenshot. Cek hal berikut:

1. Header menampilkan greeting yang benar berdasarkan jam
2. Nama user (first name) muncul dengan benar
3. Nama organisasi dan role label muncul
4. Untuk role `bpk`: hanya KaderStats yang muncul, tanpa tab
5. Untuk role `bph`/`root`: tab Kader dan Wilayah muncul dengan benar
6. Dauroh dalam 7 hari ditandai dengan icon alert dan background tint `primary/[0.03]`
7. Dauroh jauh ke depan menampilkan tanggal biasa tanpa urgency marker
8. Empty state dauroh menampilkan ikon kalender dan CTA

- [ ] **Step 3: Fix defects yang ditemukan, lalu commit**

```bash
git add -A
git commit -m "fix(dashboard): polish post-review dari inspeksi visual"
```
