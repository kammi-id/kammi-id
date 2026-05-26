# Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eksekusi semua temuan dari audit impeccable + composition pattern — theming, a11y, performance, dan refactoring struktur komponen.

**Architecture:** Plan ini dibagi menjadi 5 kelompok independen berdasarkan risiko dan scope: (1) Quick wins tanpa breaking change, (2) CSS token extraction, (3) A11y fixes, (4) Performance fix cascading fetch, (5) Composition refactor profile edit. Kelompok 1-4 bisa dikerjakan paralel; kelompok 5 harus dikerjakan terakhir karena menyentuh banyak file sekaligus.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, CSS custom properties, `useTransition`, `createContext`, `use()` (React 19 API)

---

## Kelompok A — Quick Wins (Independen, low risk)

### Task A1: Hapus `import React` yang tidak perlu

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-header/profile-header.tsx`
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-training-history/profile-training-history.tsx`
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/warning-tooltip/warning-tooltip.tsx`
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-org-hierarchy/profile-org-hierarchy.tsx`

- [ ] **Step 1: Hapus bare `import React from 'react'` di profile-header**

  Di [profile-header.tsx](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-header/profile-header.tsx), baris 1:
  ```diff
  - import React from 'react'
    import Link from 'next/link'
  ```
  Perhatian: baris `interface ProfileHeaderProps` menggunakan `React.ReactNode` — ubah ke `import type { ReactNode } from 'react'` dan ganti semua `React.ReactNode` → `ReactNode`.

- [ ] **Step 2: Update type reference di profile-header**

  ```tsx
  import type { ReactNode } from 'react'
  // ...
  interface ProfileHeaderProps {
    member: Member
    canEdit: boolean
    trainingHistory?: MemberTrainingHistory
    isEditing?: boolean
    editSlot?: ReactNode
    editActionsSlot?: ReactNode
    adminActionsSlot?: ReactNode
  }
  ```

- [ ] **Step 3: Hapus `import React from 'react'` di profile-training-history**

  ```diff
  - import React from 'react'
    import { HugeiconsIcon } from '@hugeicons/react'
  ```

- [ ] **Step 4: Hapus `import React from 'react'` di warning-tooltip**

  ```diff
  - import React from 'react'
    import { HugeiconsIcon } from '@hugeicons/react'
  ```

- [ ] **Step 5: Hapus `import React from 'react'` di profile-org-hierarchy**

  ```diff
  - import React from 'react'
    import Link from 'next/link'
  ```
  Cek apakah ada `React.something` — kalau ada, pindahkan ke named import. Kemungkinan tidak ada.

- [ ] **Step 6: Verify TypeScript tidak error**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -30
  ```
  Expected: 0 errors baru.

- [ ] **Step 7: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-header/profile-header.tsx \
    src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-training-history/profile-training-history.tsx \
    src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/warning-tooltip/warning-tooltip.tsx \
    src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-org-hierarchy/profile-org-hierarchy.tsx
  git commit -m "chore(profile): remove unnecessary React namespace imports"
  ```

---

### Task A2: Ganti `font-mono` → `font-geist-mono` di training components

**Files:**
- Modify: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx`
- Modify: `src/app/(dashboard)/dashboard/trainings/_components/training-section-cards/training-section-cards.tsx`

- [ ] **Step 1: Replace di training-detail-view.tsx**

  Run find-and-replace untuk semua `font-mono` → `font-geist-mono` di file tersebut (tidak ada exceptions — semua penggunaan di file ini seharusnya Geist Mono):
  ```bash
  sed -i '' 's/font-mono\b/font-geist-mono/g' \
    /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104/src/app/\(dashboard\)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx
  ```

- [ ] **Step 2: Replace di training-section-cards.tsx**

  ```bash
  sed -i '' 's/font-mono\b/font-geist-mono/g' \
    /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104/src/app/\(dashboard\)/dashboard/trainings/_components/training-section-cards/training-section-cards.tsx
  ```

- [ ] **Step 3: Verify tidak ada sisa `font-mono` di non-shadcn files**

  ```bash
  grep -rn "font-mono\b" /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104/src \
    --include="*.tsx" | grep -v "node_modules\|shadcn\|\.claude"
  ```
  Expected: 0 hasil (atau hanya file yang memang diizinkan).

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx \
    src/app/\(dashboard\)/dashboard/trainings/_components/training-section-cards/training-section-cards.tsx
  git commit -m "fix(theming): replace font-mono with font-geist-mono in training components"
  ```

---

### Task A3: Fix `rounded-4xl` → `rounded-2xl` di AlertDialogContent

**Files:**
- Modify: `src/components/shadcn/ui/alert-dialog.tsx`

- [ ] **Step 1: Edit class di AlertDialogContent**

  Di [alert-dialog.tsx:55](src/components/shadcn/ui/alert-dialog.tsx#L55), ganti `rounded-4xl` → `rounded-2xl`:
  ```diff
  - "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover..."
  + "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-6 rounded-2xl bg-popover..."
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/components/shadcn/ui/alert-dialog.tsx
  git commit -m "fix(ui): reduce AlertDialog border-radius from 4xl to 2xl for product register"
  ```

---

### Task A4: Fix credential panel table header typography

**Files:**
- Modify: `src/components/credential-store/credential-panel.tsx`

- [ ] **Step 1: Tambah `font-geist-mono`, `tracking-wide`, dan `uppercase` ke semua `<th>` di credential panel**

  Di [credential-panel.tsx:127-130](src/components/credential-store/credential-panel.tsx#L127), update:
  ```diff
  - <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
  - <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">NIK</th>
  - <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Password</th>
  - <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Tgl. Generate</th>
  + <th scope="col" className="px-4 py-3 text-left font-geist-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">Nama</th>
  + <th scope="col" className="px-4 py-3 text-left font-geist-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">NIK</th>
  + <th scope="col" className="px-4 py-3 text-left font-geist-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">Password</th>
  + <th scope="col" className="px-4 py-3 text-left font-geist-mono text-xs font-medium tracking-wide text-muted-foreground whitespace-nowrap uppercase">Tgl. Generate</th>
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/components/credential-store/credential-panel.tsx
  git commit -m "fix(theming): apply font-geist-mono to credential panel table headers"
  ```

---

## Kelompok B — CSS Token Extraction

### Task B1: Tambah CSS custom properties untuk status kaderisasi (member status colors)

**Files:**
- Modify: `src/app/globals.css`

Context: `globals.css` sudah punya `--status-suspended-*`, `--status-nonactive-*`, `--status-alumn-*`. Yang belum ada: token untuk status aktif kader (active/passing icon) dan token untuk border radio gender di edit mode.

- [ ] **Step 1: Tambah missing tokens di globals.css — section `:root`**

  Di `src/app/globals.css`, setelah block `--status-alumn-*` (sekitar baris 222), tambahkan:
  ```css
  /* Member activity status */
  --status-active-text: oklch(0.45 0.16 145);

  /* Pass/fail row icons in training history */
  --status-training-pass: oklch(0.45 0.16 145);
  --status-training-fail: oklch(0.55 0.18 17);

  /* Warning indicator (warning-tooltip icon) */
  --status-warning-icon: oklch(0.60 0.18 75);

  /* Gender radio button selected state (edit mode) */
  --form-gender-selected-bg: oklch(0.52 0.20 17 / 0.08);
  --form-gender-selected-border: oklch(0.52 0.20 17);
  --form-gender-selected-text: oklch(0.42 0.18 17);
  --form-gender-hover-border: oklch(0.52 0.20 17 / 0.40);
  ```

- [ ] **Step 2: Tambah dark mode equivalents di `.dark` block**

  Di `src/app/globals.css`, dalam block `.dark` (sekitar baris 240+), tambahkan:
  ```css
  /* Member activity status */
  --status-active-text: oklch(0.72 0.16 145);

  /* Pass/fail row icons in training history */
  --status-training-pass: oklch(0.70 0.16 145);
  --status-training-fail: oklch(0.70 0.18 17);

  /* Warning indicator */
  --status-warning-icon: oklch(0.75 0.16 75);

  /* Gender radio button selected state (edit mode) */
  --form-gender-selected-bg: oklch(0.52 0.20 17 / 0.12);
  --form-gender-selected-border: oklch(0.65 0.20 17);
  --form-gender-selected-text: oklch(0.75 0.16 17);
  --form-gender-hover-border: oklch(0.65 0.20 17 / 0.40);
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/globals.css
  git commit -m "feat(tokens): add missing CSS custom properties for member status and form state colors"
  ```

---

### Task B2: Replace hardcoded OKLCH literals dengan CSS variables

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-training-history/profile-training-history.tsx`
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/warning-tooltip/warning-tooltip.tsx`
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx`

Catatan: `profile-org-hierarchy.tsx` menggunakan inline OKLCH untuk warna org-level (pw, pd, pk) — ini TIDAK diganti karena belum ada token yang sesuai dan scope-nya di luar rencana ini.

- [ ] **Step 1: Fix profile-training-history.tsx — icon pass/fail**

  Di [profile-training-history.tsx:128](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-training-history/profile-training-history.tsx#L128):
  ```diff
  - className='mx-auto size-4 text-[oklch(0.45_0.16_145)]'
  + className='mx-auto size-4 text-[var(--status-training-pass)]'
  ```
  Di baris 133:
  ```diff
  - className='mx-auto size-4 text-[oklch(0.55_0.18_17)]'
  + className='mx-auto size-4 text-[var(--status-training-fail)]'
  ```

- [ ] **Step 2: Fix warning-tooltip.tsx — icon color**

  Di [warning-tooltip.tsx:26](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/warning-tooltip/warning-tooltip.tsx#L26):
  ```diff
  - className='size-3.5 text-[oklch(0.60_0.18_75)]'
  + className='size-3.5 text-[var(--status-warning-icon)]'
  ```

- [ ] **Step 3: Fix profile-info.tsx — member status text colors**

  Di [profile-info.tsx:79-82](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx#L79):
  ```diff
  - if (member.isSuspended) return 'text-[oklch(0.50_0.18_17)]'
  - if (member.isNonActive) return 'text-[oklch(0.55_0.01_285)]'
  - if (member.isAlumn) return 'text-[oklch(0.52_0.14_265)]'
  - return 'text-[oklch(0.45_0.16_145)]'
  + if (member.isSuspended) return '[color:var(--status-suspended-text)]'
  + if (member.isNonActive) return '[color:var(--status-nonactive-text)]'
  + if (member.isAlumn) return '[color:var(--status-alumn-text)]'
  + return '[color:var(--status-active-text)]'
  ```

- [ ] **Step 4: Fix profile-info.tsx — gender radio selected state**

  Di [profile-info.tsx:207-208](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx#L207):
  ```diff
  - selectedGender === val
  -   ? 'border-[oklch(0.52_0.20_17)] bg-[oklch(0.52_0.20_17/0.08)] text-[oklch(0.42_0.18_17)]'
  -   : 'border-border text-foreground hover:border-[oklch(0.52_0.20_17/0.40)]'
  + selectedGender === val
  +   ? '[border-color:var(--form-gender-selected-border)] [background-color:var(--form-gender-selected-bg)] [color:var(--form-gender-selected-text)]'
  +   : 'border-border text-foreground [--tw-border-opacity:1] hover:[border-color:var(--form-gender-hover-border)]'
  ```

- [ ] **Step 5: Verify TypeScript tidak error**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -20
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add \
    src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-training-history/profile-training-history.tsx \
    src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/warning-tooltip/warning-tooltip.tsx \
    src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-info/profile-info.tsx
  git commit -m "fix(theming): replace hardcoded OKLCH literals with CSS custom properties"
  ```

---

## Kelompok C — Accessibility Fixes

### Task C1: Tambah aria-label ke pass/fail icons di training history table

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-training-history/profile-training-history.tsx`

- [ ] **Step 1: Wrap icon dengan span sr-only untuk screen reader**

  Di [profile-training-history.tsx:125-135](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-training-history/profile-training-history.tsx#L125), ganti:
  ```diff
  - {record.isPassing ? (
  -   <HugeiconsIcon
  -     icon={Tick01Icon}
  -     className='mx-auto size-4 text-[var(--status-training-pass)]'
  -   />
  - ) : (
  -   <HugeiconsIcon
  -     icon={Cancel01Icon}
  -     className='mx-auto size-4 text-[var(--status-training-fail)]'
  -   />
  - )}
  + <span className='inline-flex items-center justify-center'>
  +   {record.isPassing ? (
  +     <>
  +       <HugeiconsIcon
  +         icon={Tick01Icon}
  +         aria-hidden='true'
  +         className='mx-auto size-4 text-[var(--status-training-pass)]'
  +       />
  +       <span className='sr-only'>Lulus</span>
  +     </>
  +   ) : (
  +     <>
  +       <HugeiconsIcon
  +         icon={Cancel01Icon}
  +         aria-hidden='true'
  +         className='mx-auto size-4 text-[var(--status-training-fail)]'
  +       />
  +       <span className='sr-only'>Tidak Lulus</span>
  +     </>
  +   )}
  + </span>
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-training-history/profile-training-history.tsx
  git commit -m "fix(a11y): add sr-only text for pass/fail icons in training history table"
  ```

---

### Task C2: Tambah copy-to-clipboard di credential dialog reset-password

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/reset-password-button.tsx`

- [ ] **Step 1: Tambah CopyButton inline component dan gunakan di dialog**

  Di [reset-password-button.tsx](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/reset-password-button.tsx), tambahkan setelah semua imports:

  ```tsx
  const CopyButton = ({ value }: { value: string }) => {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
    return (
      <button
        type='button'
        onClick={handleCopy}
        className='text-muted-foreground hover:text-foreground ml-auto shrink-0 transition-colors'
        aria-label={copied ? 'Tersalin' : 'Salin ke clipboard'}
      >
        <span className='font-geist-mono text-xs'>{copied ? 'Tersalin!' : 'Salin'}</span>
      </button>
    )
  }
  ```

- [ ] **Step 2: Update Dialog credential display untuk pakai CopyButton**

  ```diff
    <div className='space-y-3 rounded-lg border p-4'>
      <div>
  -     <p className='text-muted-foreground text-xs'>NIK (Username)</p>
  -     <p className='font-mono font-medium'>{newCredential.registerNumber}</p>
  +     <div className='flex items-center justify-between gap-2'>
  +       <p className='text-muted-foreground text-xs'>NIK (Username)</p>
  +       <CopyButton value={newCredential.registerNumber} />
  +     </div>
  +     <p className='font-geist-mono text-sm font-medium'>{newCredential.registerNumber}</p>
      </div>
      <div>
  -     <p className='text-muted-foreground text-xs'>Password Baru</p>
  -     <p className='font-mono font-medium'>{newCredential.password}</p>
  +     <div className='flex items-center justify-between gap-2'>
  +       <p className='text-muted-foreground text-xs'>Password Baru</p>
  +       <CopyButton value={newCredential.password} />
  +     </div>
  +     <p className='font-geist-mono text-sm font-medium'>{newCredential.password}</p>
      </div>
      <p className='text-muted-foreground text-xs'>
        Credential ini juga sudah tersimpan di Credential Panel.
      </p>
    </div>
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/reset-password/reset-password-button.tsx
  git commit -m "feat(ux): add copy-to-clipboard buttons in reset password credential dialog"
  ```

---

## Kelompok D — Performance Fix: Cascading Region Fetch

### Task D1: Fix race condition di `profile-info.tsx` cascading useEffect

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx`

Context: Ada 4 `useEffect` yang memanggil Server Actions untuk cascading region data (province → city → district → subdistrict). Masalahnya: tidak ada AbortController atau cleanup, sehingga jika user mengganti province dengan cepat, response dari request sebelumnya bisa override state terbaru.

Solusi: Tambah cleanup function di setiap effect menggunakan flag `cancelled`.

- [ ] **Step 1: Fix useEffect fetchProvincesAction — tambah cancelled flag**

  Di [profile-info.tsx:110-117](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx#L110), ganti:
  ```diff
  - useEffect(() => {
  -   if (!isEditing) return
  -   setLoadingProvince(true)
  -   fetchProvincesAction().then((res) => {
  -     setLoadingProvince(false)
  -     if (res.success) setProvinces(res.data ?? [])
  -   })
  - }, [isEditing])
  + useEffect(() => {
  +   if (!isEditing) return
  +   let cancelled = false
  +   setLoadingProvince(true)
  +   fetchProvincesAction().then((res) => {
  +     if (cancelled) return
  +     setLoadingProvince(false)
  +     if (res.success) setProvinces(res.data ?? [])
  +   })
  +   return () => { cancelled = true }
  + }, [isEditing])
  ```

- [ ] **Step 2: Fix useEffect fetchCitiesAction**

  Di [profile-info.tsx:119-131](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx#L119), ganti:
  ```diff
  - useEffect(() => {
  -   if (!province) {
  -     setCities([])
  -     setDistricts([])
  -     setSubdistricts([])
  -     return
  -   }
  -   setLoadingCity(true)
  -   fetchCitiesAction(province).then((res) => {
  -     setLoadingCity(false)
  -     if (res.success) setCities(res.data ?? [])
  -   })
  - }, [province])
  + useEffect(() => {
  +   if (!province) {
  +     setCities([])
  +     setDistricts([])
  +     setSubdistricts([])
  +     return
  +   }
  +   let cancelled = false
  +   setLoadingCity(true)
  +   fetchCitiesAction(province).then((res) => {
  +     if (cancelled) return
  +     setLoadingCity(false)
  +     if (res.success) setCities(res.data ?? [])
  +   })
  +   return () => { cancelled = true }
  + }, [province])
  ```

- [ ] **Step 3: Fix useEffect fetchDistrictsAction**

  Di [profile-info.tsx:133-144](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx#L133), ganti:
  ```diff
  - useEffect(() => {
  -   if (!city) {
  -     setDistricts([])
  -     setSubdistricts([])
  -     return
  -   }
  -   setLoadingDistrict(true)
  -   fetchDistrictsAction(city).then((res) => {
  -     setLoadingDistrict(false)
  -     if (res.success) setDistricts(res.data ?? [])
  -   })
  - }, [city])
  + useEffect(() => {
  +   if (!city) {
  +     setDistricts([])
  +     setSubdistricts([])
  +     return
  +   }
  +   let cancelled = false
  +   setLoadingDistrict(true)
  +   fetchDistrictsAction(city).then((res) => {
  +     if (cancelled) return
  +     setLoadingDistrict(false)
  +     if (res.success) setDistricts(res.data ?? [])
  +   })
  +   return () => { cancelled = true }
  + }, [city])
  ```

- [ ] **Step 4: Fix useEffect fetchVillagesAction**

  Di [profile-info.tsx:146-155](src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx#L146), ganti:
  ```diff
  - useEffect(() => {
  -   if (!district) {
  -     setSubdistricts([])
  -     return
  -   }
  -   setLoadingSubdistrict(true)
  -   fetchVillagesAction(district).then((res) => {
  -     setLoadingSubdistrict(false)
  -     if (res.success) setSubdistricts(res.data ?? [])
  -   })
  - }, [district])
  + useEffect(() => {
  +   if (!district) {
  +     setSubdistricts([])
  +     return
  +   }
  +   let cancelled = false
  +   setLoadingSubdistrict(true)
  +   fetchVillagesAction(district).then((res) => {
  +     if (cancelled) return
  +     setLoadingSubdistrict(false)
  +     if (res.success) setSubdistricts(res.data ?? [])
  +   })
  +   return () => { cancelled = true }
  + }, [district])
  ```

- [ ] **Step 5: Verify typecheck**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -20
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-info/profile-info.tsx
  git commit -m "fix(perf): add stale-response guards to cascading region fetch effects"
  ```

---

## Kelompok E — Composition Refactor: MembersPageTabs

### Task E1: Refactor `MembersPageTabs` dari render props ke children

**Files:**
- Modify: `src/app/(dashboard)/dashboard/kader/_components/members-page-tabs/members-page-tabs.tsx`
- Modify: `src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx`

Context: `MembersPageTabs` saat ini pakai `renderSummary: () => ReactNode` dan `renderIndividuals: () => ReactNode`. Ini seharusnya diganti dengan children composition. Tapi karena `MembersPageContent` sudah langsung render kontennya sendiri tanpa lewat `MembersPageTabs` (ada dua rendering paths), kita perlu verifikasi dulu.

- [ ] **Step 1: Audit apakah `MembersPageTabs` masih dipakai di MembersPageContent**

  ```bash
  grep -n "MembersPageTabs\|renderSummary\|renderIndividuals" \
    /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104/src/app/\(dashboard\)/dashboard/kader/_components/MembersPageContent.tsx
  ```
  Perhatikan: kalau `MembersPageTabs` tidak dipakai (karena `MembersPageContent` sudah inline), skip Task E1 dan catat sebagai dead code.

- [ ] **Step 2: Jika dipakai — update interface MembersPageTabs**

  Ganti seluruh isi `members-page-tabs.tsx`:
  ```tsx
  import Link from 'next/link'
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
  } from '~/components/shadcn/ui/tabs'

  interface MembersPageTabsProps {
    activeTab: string
    basePath: string
    activeType?: string
    summaryContent?: React.ReactNode
    individualsContent?: React.ReactNode
  }

  export const MembersPageTabs = ({
    activeTab,
    basePath,
    activeType,
    summaryContent,
    individualsContent
  }: MembersPageTabsProps) => {
    const hasBoth = summaryContent != null && individualsContent != null

    if (!summaryContent && !individualsContent) return null

    if (hasBoth) {
      return (
        <Tabs value={activeTab} className='space-y-8'>
          <TabsList className='bg-background w-full justify-start rounded-none border-b p-0'>
            <TabsTrigger
              value='kader'
              className='text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-primary/10 relative h-12 rounded-none bg-transparent px-4 pt-2 pb-3 font-semibold shadow-none transition-all data-[state=active]:shadow-none'
              render={<Link href={`${basePath}?tab=kader`} />}
            >
              Ringkasan Struktur
            </TabsTrigger>
            <TabsTrigger
              value='individuals'
              className='text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-primary/10 relative h-12 rounded-none bg-transparent px-4 pt-2 pb-3 font-semibold shadow-none transition-all data-[state=active]:shadow-none'
              render={
                <Link
                  href={`${basePath}?tab=individuals${activeType ? `&type=${activeType}` : ''}`}
                />
              }
            >
              Daftar Kader
            </TabsTrigger>
          </TabsList>
          <TabsContent value='kader' className='m-0 border-none p-0 outline-none'>
            {summaryContent}
          </TabsContent>
          <TabsContent value='individuals' className='m-0 border-none p-0 outline-none'>
            {individualsContent}
          </TabsContent>
        </Tabs>
      )
    }

    return (
      <div className='space-y-12'>
        {summaryContent}
        {individualsContent}
      </div>
    )
  }
  ```

- [ ] **Step 3: Update callsite di MembersPageContent**

  Cari semua tempat `MembersPageTabs` dipanggil dan update prop names:
  ```diff
  - <MembersPageTabs
  -   renderSummary={renderSummary}
  -   renderIndividuals={renderIndividuals}
  -   showSummary={showSummary}
  -   showIndividuals={showIndividuals}
  -   ...
  - />
  + <MembersPageTabs
  +   summaryContent={showSummary ? renderSummary() : undefined}
  +   individualsContent={showIndividuals ? renderIndividuals() : undefined}
  +   ...
  + />
  ```

- [ ] **Step 4: Verify typecheck**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -20
  ```
  Expected: 0 new errors.

- [ ] **Step 5: Commit**

  ```bash
  git add \
    src/app/\(dashboard\)/dashboard/kader/_components/members-page-tabs/members-page-tabs.tsx \
    src/app/\(dashboard\)/dashboard/kader/_components/MembersPageContent.tsx
  git commit -m "refactor(composition): replace render props with children in MembersPageTabs"
  ```

---

## Kelompok F — Composition Refactor: ProfileEditProvider (Terakhir)

### Task F1: Buat `ProfileEditContext` dan `ProfileEditProvider`

**Files:**
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-edit-context/profile-edit-context.tsx`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-edit-context/index.ts`

Context: Saat ini `isEditing`, `canEdit`, `isPending`, dan `fieldErrors` di-prop-drill dari `ProfileInlineEditForm` ke semua komponen anak. Solusi: angkat ke React context menggunakan `use()` API (React 19).

- [ ] **Step 1: Buat context file**

  Buat `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-edit-context/profile-edit-context.tsx`:
  ```tsx
  'use client'

  import { createContext, use } from 'react'
  import type { Member } from '~/db/query/member'
  import type { MemberTrainingHistory } from '~/db/query/training'

  export interface ProfileEditContextValue {
    member: Member
    trainingHistory: MemberTrainingHistory
    canEdit: boolean
    isEditing: boolean
    isPending: boolean
    fieldErrors?: Record<string, string[]>
    startEditing: () => void
    cancelEditing: () => void
  }

  export const ProfileEditContext = createContext<ProfileEditContextValue | null>(null)

  export const useProfileEdit = (): ProfileEditContextValue => {
    const ctx = use(ProfileEditContext)
    if (!ctx) throw new Error('useProfileEdit must be used within ProfileEditProvider')
    return ctx
  }
  ```

- [ ] **Step 2: Buat barrel index.ts**

  Buat `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-edit-context/index.ts`:
  ```ts
  export * from './profile-edit-context'
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-edit-context/
  git commit -m "feat(composition): add ProfileEditContext for profile edit state"
  ```

---

### Task F2: Refactor `ProfileInlineEditForm` menjadi provider + layout

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-inline-edit-form/profile-inline-edit-form.tsx`

- [ ] **Step 1: Rewrite ProfileInlineEditForm untuk expose context**

  Ganti seluruh isi `profile-inline-edit-form.tsx`:
  ```tsx
  'use client'

  import { useActionState, useEffect, useState, useCallback } from 'react'
  import { toast } from 'sonner'
  import { Button } from '~/components/shadcn/ui/button'
  import { HugeiconsIcon } from '@hugeicons/react'
  import {
    PencilEdit01Icon,
    FloppyDiskIcon,
    Cancel01Icon
  } from '@hugeicons/core-free-icons'
  import { updateMemberProfileAction } from '../action'
  import { ProfileHeader } from '../profile-header'
  import { ProfileInfo } from '../profile-info'
  import { ProfileSidebar } from '../profile-sidebar'
  import { ProfileTrainingHistory } from '../profile-training-history'
  import { ProfileEditContext } from '../profile-edit-context'
  import type { Member } from '~/db/query/member'
  import type { MemberTrainingHistory } from '~/db/query/training'

  interface ProfileInlineEditFormProps {
    member: Member
    canEdit: boolean
    trainingHistory: MemberTrainingHistory
    orgHierarchySlot?: React.ReactNode
    adminActionsSlot?: React.ReactNode
  }

  export const ProfileInlineEditForm = ({
    member,
    canEdit,
    trainingHistory,
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

    const startEditing = useCallback(() => setIsEditing(true), [])
    const cancelEditing = useCallback(() => {
      setFormKey((k) => k + 1)
      setIsEditing(false)
    }, [])

    return (
      <ProfileEditContext
        value={{
          member,
          trainingHistory,
          canEdit,
          isEditing,
          isPending,
          fieldErrors: state.errors,
          startEditing,
          cancelEditing
        }}
      >
        <form id='profile-edit-form' action={formAction}>
          <ProfileHeader adminActionsSlot={adminActionsSlot} />

          <div className='px-6 py-8'>
            <div className='mx-auto max-w-5xl'>
              <div className='flex flex-col gap-8 lg:flex-row lg:gap-10'>
                <main className='min-w-0 flex-1'>
                  <ProfileInfo key={`info-${formKey}`} />
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
      </ProfileEditContext>
    )
  }
  ```

  Catatan: `ProfileEditContext` di React 19 bisa dipakai langsung sebagai JSX element (tanpa `.Provider`).

- [ ] **Step 2: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-inline-edit-form/profile-inline-edit-form.tsx
  git commit -m "refactor(composition): wire ProfileEditContext into ProfileInlineEditForm"
  ```

---

### Task F3: Update `ProfileHeader` — consume context, hapus props yang tidak perlu

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-header/profile-header.tsx`

- [ ] **Step 1: Rewrite ProfileHeader untuk pakai useProfileEdit**

  ```tsx
  import Link from 'next/link'
  import type { ReactNode } from 'react'
  import { Badge } from '~/components/shadcn/ui/badge'
  import { Button } from '~/components/shadcn/ui/button'
  import { HugeiconsIcon } from '@hugeicons/react'
  import {
    PencilEdit01Icon,
    FloppyDiskIcon,
    Cancel01Icon
  } from '@hugeicons/core-free-icons'
  import { ProfileAvatar } from '../profile-avatar'
  import { WarningTooltip } from '../warning-tooltip'
  import { useProfileEdit } from '../profile-edit-context'

  const statusStyles: Record<string, React.CSSProperties> = {
    ab1: {
      backgroundColor: 'var(--status-ab1-bg)',
      borderColor: 'var(--status-ab1-border)',
      color: 'var(--status-ab1-text)'
    },
    ab2: {
      backgroundColor: 'var(--status-ab2-bg)',
      borderColor: 'var(--status-ab2-border)',
      color: 'var(--status-ab2-text)'
    },
    ab3: {
      backgroundColor: 'var(--status-ab3-bg)',
      borderColor: 'var(--status-ab3-border)',
      color: 'var(--status-ab3-text)'
    }
  }

  const statusRequiredDm: Record<string, 'dm1' | 'dm2' | 'dm3'> = {
    ab1: 'dm1',
    ab2: 'dm2',
    ab3: 'dm3'
  }

  interface ProfileHeaderProps {
    adminActionsSlot?: ReactNode
  }

  export const ProfileHeader = ({ adminActionsSlot }: ProfileHeaderProps) => {
    const { member, trainingHistory, canEdit, isEditing, isPending, startEditing, cancelEditing } = useProfileEdit()

    const requiredDm = statusRequiredDm[member.status]
    const hasDm = requiredDm
      ? (trainingHistory?.asAttendant.some((r) => r.type === requiredDm) ?? false)
      : true

    const editSlot = canEdit && !isEditing ? (
      <Button variant='outline' size='sm' type='button' onClick={startEditing}>
        <HugeiconsIcon icon={PencilEdit01Icon} className='mr-1.5 size-3.5' />
        Edit Profil
      </Button>
    ) : null

    const editActionsSlot = isEditing ? (
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' type='button' onClick={cancelEditing} disabled={isPending}>
          <HugeiconsIcon icon={Cancel01Icon} className='mr-1.5 size-3.5' />
          Reset
        </Button>
        <Button size='sm' type='submit' form='profile-edit-form' disabled={isPending}>
          <HugeiconsIcon icon={FloppyDiskIcon} className='mr-1.5 size-3.5' />
          {isPending ? 'Menyimpan...' : 'Simpan Profil'}
        </Button>
      </div>
    ) : null

    return (
      <header className='border-border bg-background border-b'>
        <div className='px-6 pt-5 pb-6'>
          <nav className='mb-5 flex items-center gap-1.5 text-sm'>
            <Link
              href='/dashboard/kader'
              className='text-muted-foreground hover:text-foreground transition-colors'
            >
              Kader
            </Link>
            <span className='text-muted-foreground/50'>/</span>
            <span className='text-foreground font-medium'>{member.name}</span>
          </nav>

          <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6'>
            <ProfileAvatar />

            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <h1 className='font-heading text-foreground text-2xl leading-tight font-bold md:text-3xl'>
                  {member.name}
                </h1>
                <div className='flex shrink-0 items-center gap-2'>
                  {adminActionsSlot}
                  {editActionsSlot ?? editSlot}
                </div>
              </div>

              <div className='mt-1 flex items-center gap-2'>
                <p className='font-geist-mono text-muted-foreground text-sm tracking-wide'>
                  {member.registerNumber}
                </p>
                <Badge
                  variant='outline'
                  className='font-bold'
                  style={statusStyles[member.status]}
                >
                  {member.status.toUpperCase()}
                </Badge>
                {trainingHistory && !hasDm && requiredDm && (
                  <WarningTooltip
                    message={`Belum ada entry ${requiredDm.toUpperCase()} di riwayat dauroh`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }
  ```

  Catatan: `ProfileAvatar` sekarang tidak menerima props — akan consume context di Task F4.

- [ ] **Step 2: Verify typecheck**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -20
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-header/profile-header.tsx
  git commit -m "refactor(composition): ProfileHeader consumes ProfileEditContext"
  ```

---

### Task F4: Update `ProfileAvatar` — consume context

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-avatar/profile-avatar.tsx`

- [ ] **Step 1: Hapus props interface, consume context via useProfileEdit**

  Ganti props interface dan destructuring:
  ```diff
  - interface ProfileAvatarProps {
  -   name: string
  -   photoPath: string | null
  -   memberId: string
  -   canEdit: boolean
  - }
  -
  - export const ProfileAvatar = ({
  -   name,
  -   photoPath,
  -   memberId,
  -   canEdit
  - }: ProfileAvatarProps) => {
  + import { useProfileEdit } from '../profile-edit-context'
  +
  + export const ProfileAvatar = () => {
  +   const { member, canEdit, isEditing } = useProfileEdit()
  +   const { name, photoPath: memberPhotoPath, id: memberId } = member
  +   const canEditPhoto = canEdit && isEditing
  ```

  Ganti semua `canEdit` → `canEditPhoto` di body komponen. Ganti `photoPath` → `memberPhotoPath`.

- [ ] **Step 2: Verify typecheck**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -20
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-avatar/profile-avatar.tsx
  git commit -m "refactor(composition): ProfileAvatar consumes ProfileEditContext"
  ```

---

### Task F5: Update `ProfileInfo` — consume context, hapus props

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-info/profile-info.tsx`

- [ ] **Step 1: Hapus props interface, consume context**

  Ganti:
  ```diff
  - interface ProfileInfoProps {
  -   member: Member
  -   isEditing?: boolean
  -   fieldErrors?: Record<string, string[]>
  - }
  -
  - export const ProfileInfo = ({
  -   member,
  -   isEditing = false,
  -   fieldErrors
  - }: ProfileInfoProps) => {
  + import { useProfileEdit } from '../profile-edit-context'
  + // Hapus `import type { Member }` jika tidak dipakai lagi
  +
  + export const ProfileInfo = () => {
  +   const { member, isEditing, fieldErrors } = useProfileEdit()
  ```

  Hapus juga `import type { Member }` dari `~/db/query/member` jika `Member` tidak lagi diperlukan secara eksplisit di file ini.

- [ ] **Step 2: Verify typecheck**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -20
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-info/profile-info.tsx
  git commit -m "refactor(composition): ProfileInfo consumes ProfileEditContext"
  ```

---

### Task F6: Update `ProfileSidebar` — consume context, hapus props

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-sidebar/profile-sidebar.tsx`

- [ ] **Step 1: Hapus props, consume context**

  ```diff
  - interface ProfileSidebarProps {
  -   member: Member
  -   trainingHistory?: MemberTrainingHistory
  -   isEditing?: boolean
  -   orgHierarchySlot?: React.ReactNode
  - }
  -
  - export const ProfileSidebar = ({
  -   member,
  -   trainingHistory,
  -   isEditing = false,
  -   orgHierarchySlot
  - }: ProfileSidebarProps) => {
  + import type { ReactNode } from 'react'
  + import { useProfileEdit } from '../profile-edit-context'
  +
  + interface ProfileSidebarProps {
  +   orgHierarchySlot?: ReactNode
  + }
  +
  + export const ProfileSidebar = ({ orgHierarchySlot }: ProfileSidebarProps) => {
  +   const { member, trainingHistory, isEditing } = useProfileEdit()
  ```

  Hapus `import type { Member }` dan `import type { MemberTrainingHistory }` jika sudah tidak dipakai di sini.

- [ ] **Step 2: Verify typecheck**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -20
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-sidebar/profile-sidebar.tsx
  git commit -m "refactor(composition): ProfileSidebar consumes ProfileEditContext"
  ```

---

### Task F7: Update `ProfileTrainingHistory` — consume context, hapus props

**Files:**
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/profile-training-history/profile-training-history.tsx`

- [ ] **Step 1: Hapus props, consume context**

  ```diff
  - interface ProfileTrainingHistoryProps {
  -   history: MemberTrainingHistory
  - }
  -
  - export const ProfileTrainingHistory = ({
  -   history
  - }: ProfileTrainingHistoryProps) => {
  + import { useProfileEdit } from '../profile-edit-context'
  +
  + export const ProfileTrainingHistory = () => {
  +   const { trainingHistory: history } = useProfileEdit()
  ```

- [ ] **Step 2: Verify typecheck**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1 | head -20
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/\(dashboard\)/dashboard/profile/\[registerNumber\]/_components/profile-training-history/profile-training-history.tsx
  git commit -m "refactor(composition): ProfileTrainingHistory consumes ProfileEditContext"
  ```

---

### Task F8: Final typecheck dan verify semua compiles

- [ ] **Step 1: Full typecheck**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run typecheck 2>&1
  ```
  Expected: 0 errors.

- [ ] **Step 2: Build check**

  ```bash
  cd /Users/radenpioneer/projects/kammi-id/.worktree/dev-20260104 && bun run build 2>&1 | tail -20
  ```
  Expected: Build succeeds dengan 0 errors.

- [ ] **Step 3: Check Next.js DevTools untuk errors**

  Kalau dev server running, navigate ke halaman profile dan verifikasi tidak ada runtime errors di console.

---

## Self-Review Checklist

- [x] **A11y P2** (icon pass/fail tanpa label) → Task C1
- [x] **Theming P1** (hardcoded OKLCH) → Task B1 + B2
- [x] **Theming P1** (font-mono vs font-geist-mono) → Task A2
- [x] **Performance P1** (cascading useEffect race condition) → Task D1
- [x] **Anti-pattern P2** (rounded-4xl) → Task A3
- [x] **A11y/UX P2** (credential dialog copy button) → Task C2
- [x] **Theming P3** (credential panel table headers) → Task A4
- [x] **Bundle P3** (import React dead imports) → Task A1
- [x] **Composition C1+C2** (isEditing/canEdit prop drilling) → Task F1–F7
- [x] **Composition C4** (render props MembersPageTabs) → Task E1
- [ ] **Loading skeleton P3** — Sengaja di-skip dari plan ini karena butuh `loading.tsx` baru yang perlu desain skeleton terpisah. Catat sebagai follow-up.
