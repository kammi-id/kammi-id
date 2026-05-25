# Bulk Upload Kader & Credential Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable BPK to import kader secara massal via XLSX, simpan NIK+password hasil generate di localStorage (nanostores persistent), dan reset password kader on-demand dari halaman profil.

**Architecture:** Parse XLSX di client menggunakan SheetJS → preview table editable + Zod validation → submit ke server action `bulkCreateMembersAction` yang return plaintext credentials sekali → nanostores persistent store simpan credentials per `organizationId` → `CredentialPanel` di site header untuk akses & download. Regenerate dari `/dashboard/profile/[registerNumber]` via `regenerateCredentialAction`.

**Tech Stack:** SheetJS (`xlsx` — sudah ada), `@nanostores/persistent` (sudah ada), `@nanostores/react` (sudah ada), Zod, Drizzle ORM, Next.js Server Actions, shadcn/ui components (Dialog, Table, Button, Badge)

**Spec:** `docs/superpowers/specs/2026-05-25-bulk-upload-credential-store-design.md`

---

## File Map

### New Files

| File | Tanggung Jawab |
|------|----------------|
| `src/components/credential-store/store.ts` | Nanostores persistent atom untuk credential per org |
| `src/components/credential-store/credential-panel.tsx` | Panel UI (Sheet/Drawer) — list, download CSV, hapus |
| `src/components/credential-store/index.ts` | Barrel export |
| `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-utils.ts` | Parse XLSX + Zod validate baris |
| `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts` | `bulkCreateMembersAction` server action |
| `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-preview.tsx` | Editable preview table |
| `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-dialog.tsx` | Dialog wrapper: upload → preview → submit |
| `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/index.ts` | Barrel export |
| `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/dm1-bulk-upload-button.tsx` | Tombol "Import Peserta" di DM1 detail view |
| `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/action.ts` | `regenerateCredentialAction` server action |
| `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/reset-password-button.tsx` | Tombol + confirmation dialog |
| `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/index.ts` | Barrel export |

### Modified Files

| File | Perubahan |
|------|-----------|
| `src/app/(dashboard)/dashboard/_components/site-header/site-header.tsx` | Tambah `<CredentialPanel />` di kanan header |
| `src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx` | Tambah `<BulkUploadDialog>` di area header (BPK only) |
| `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx` | Tambah `<DM1BulkUploadButton>` di samping DM1AddForm |
| `src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx` | Pass `memberId`, `registerNumber`, `userRole`, `orgId` ke `<ResetPasswordButton>` |

---

## Task 1: Credential Store (Nanostores Persistent)

**Files:**
- Create: `src/components/credential-store/store.ts`
- Create: `src/components/credential-store/index.ts`

- [ ] **Step 1: Buat store file**

```ts
// src/components/credential-store/store.ts
import { persistentMap } from '@nanostores/persistent'

export type CredentialEntry = {
  memberId: string
  name: string
  registerNumber: string
  password: string
  organizationId: string
  createdAt: string
}

export type CredentialStore = Record<string, CredentialEntry[]>

export const credentialStore = persistentMap<CredentialStore>(
  'kammi:credentials',
  {}
)

export const appendCredentials = (
  organizationId: string,
  entries: CredentialEntry[]
) => {
  const current = credentialStore.get()
  const existing = current[organizationId] ?? []

  const updated = [...existing]
  for (const entry of entries) {
    const idx = updated.findIndex(
      (e) => e.registerNumber === entry.registerNumber
    )
    if (idx >= 0) {
      updated[idx] = entry
    } else {
      updated.push(entry)
    }
  }

  credentialStore.setKey(organizationId, updated)
}

export const clearCredentials = (organizationId: string) => {
  credentialStore.setKey(organizationId, [])
}
```

- [ ] **Step 2: Buat barrel export**

```ts
// src/components/credential-store/index.ts
export * from './store'
export * from './credential-panel'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/credential-store/store.ts src/components/credential-store/index.ts
git commit -m "feat(credential-store): add nanostores persistent credential store"
```

---

## Task 2: Credential Panel UI

**Files:**
- Create: `src/components/credential-store/credential-panel.tsx`

- [ ] **Step 1: Buat CredentialPanel komponen**

```tsx
// src/components/credential-store/credential-panel.tsx
'use client'

import { useStore } from '@nanostores/react'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Key01Icon,
  Download04Icon,
  Delete02Icon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Badge } from '~/components/shadcn/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '~/components/shadcn/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/shadcn/ui/alert-dialog'
import { credentialStore, clearCredentials, type CredentialEntry } from './store'

interface CredentialPanelProps {
  organizationId: string
  orgSlug: string
}

const downloadCSV = (entries: CredentialEntry[], orgSlug: string) => {
  const date = new Date().toISOString().slice(0, 10)
  const header = 'Nama,NIK (Username),Password,Tanggal Generate'
  const rows = entries.map(
    (e) =>
      `"${e.name}","${e.registerNumber}","${e.password}","${e.createdAt}"`
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `credentials-${orgSlug}-${date}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const CredentialPanel = ({
  organizationId,
  orgSlug
}: CredentialPanelProps) => {
  const store = useStore(credentialStore)
  const entries = store[organizationId] ?? []
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon' className='relative size-8'>
          <HugeiconsIcon icon={Key01Icon} className='size-4' />
          {entries.length > 0 && (
            <Badge className='absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center p-0 text-[10px]'>
              {entries.length}
            </Badge>
          )}
          <span className='sr-only'>Credential Kader</span>
        </Button>
      </SheetTrigger>
      <SheetContent className='w-full sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>Credential Kader Tersimpan</SheetTitle>
        </SheetHeader>

        {entries.length === 0 ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            Belum ada credential tersimpan untuk organisasi ini.
          </p>
        ) : (
          <div className='flex flex-col gap-4 py-4'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>
                {entries.length} credential tersimpan
              </span>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => downloadCSV(entries, orgSlug)}
                >
                  <HugeiconsIcon icon={Download04Icon} className='mr-2 size-3.5' />
                  Download CSV
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size='sm' variant='destructive'>
                      <HugeiconsIcon icon={Delete02Icon} className='mr-2 size-3.5' />
                      Hapus Semua
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus semua credential?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Data credential yang tersimpan di perangkat ini akan dihapus.
                        Aksi ini tidak bisa dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearCredentials(organizationId)}
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className='overflow-auto rounded-lg border'>
              <table className='w-full text-sm'>
                <thead className='bg-muted/50'>
                  <tr>
                    <th className='px-3 py-2 text-left font-medium'>Nama</th>
                    <th className='px-3 py-2 text-left font-medium'>NIK</th>
                    <th className='px-3 py-2 text-left font-medium'>Password</th>
                    <th className='px-3 py-2 text-left font-medium'>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.registerNumber} className='border-t'>
                      <td className='px-3 py-2'>{entry.name}</td>
                      <td className='px-3 py-2 font-mono text-xs'>{entry.registerNumber}</td>
                      <td className='px-3 py-2 font-mono text-xs'>{entry.password}</td>
                      <td className='px-3 py-2 text-xs'>
                        {new Date(entry.createdAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Update barrel export** — pastikan `credential-panel` sudah ter-export di `index.ts` (sudah dari Task 1 Step 2).

- [ ] **Step 3: Commit**

```bash
git add src/components/credential-store/credential-panel.tsx
git commit -m "feat(credential-store): add CredentialPanel sheet UI"
```

---

## Task 3: Tambah CredentialPanel ke SiteHeader

**Files:**
- Modify: `src/app/(dashboard)/dashboard/_components/site-header/site-header.tsx`

> **Context:** SiteHeader adalah client component. Perlu membaca `organizationId` dan `orgSlug` dari session — tapi SiteHeader saat ini tidak punya akses session. Solusi: tambahkan `CredentialPanelWrapper` sebagai Server Component yang fetch session lalu render `CredentialPanel`, kemudian import ke SiteHeader via slot atau langsung dari layout.

Cara paling simple: tambah `CredentialPanelServer` sebagai Server Component di `site-header/` yang baca session sendiri, render `CredentialPanel`. Import langsung ke `DashboardLayout` bukan ke `SiteHeader` (karena SiteHeader client).

- [ ] **Step 1: Buat CredentialPanelServer**

```tsx
// src/app/(dashboard)/dashboard/_components/site-header/credential-panel-server.tsx
import { readActiveSession } from '~/lib/auth/cookies'
import { CredentialPanel } from '~/components/credential-store'

export const CredentialPanelServer = async () => {
  const session = await readActiveSession()
  if (!session?.user) return null

  const { role, connectedOrganization } = session.user
  if (role !== 'bpk' || !connectedOrganization) return null

  return (
    <CredentialPanel
      organizationId={connectedOrganization.id}
      orgSlug={connectedOrganization.slug}
    />
  )
}
```

- [ ] **Step 2: Tambah `<CredentialPanelServer />` ke SiteHeader**

Buka `src/app/(dashboard)/dashboard/_components/site-header/site-header.tsx`. Tambahkan import dan render di kanan header:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { Separator } from '~/components/shadcn/ui/separator'
import { SidebarTrigger } from '~/components/shadcn/ui/sidebar'
import { CredentialPanelServer } from './credential-panel-server'
// ...routeLabels dan getLabel tetap sama...

export const SiteHeader = () => {
  const pathname = usePathname()

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 h-4 data-vertical:self-auto'
        />
        <span className='flex-1 text-base font-medium'>{getLabel(pathname)}</span>
        <CredentialPanelServer />
      </div>
    </header>
  )
}
```

> **Catatan:** `CredentialPanelServer` adalah async Server Component — dapat di-render di dalam client component karena Next.js mendukung server component sebagai children/slot. Namun karena SiteHeader sendiri `'use client'`, ini harus diimport melalui `import()` dynamic atau dilewatkan sebagai `children` prop dari layout. Gunakan pendekatan children dari `DashboardLayout` untuk menghindari mixing boundary error.

- [ ] **Step 3 (alternatif cleaner): Pass sebagai slot dari layout**

Jika Step 2 error karena boundary mixing, modifikasi `SiteHeader` untuk menerima `rightSlot` prop:

```tsx
// site-header.tsx
interface SiteHeaderProps {
  rightSlot?: React.ReactNode
}

export const SiteHeader = ({ rightSlot }: SiteHeaderProps) => {
  const pathname = usePathname()
  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mx-2 h-4 data-vertical:self-auto' />
        <span className='flex-1 text-base font-medium'>{getLabel(pathname)}</span>
        {rightSlot}
      </div>
    </header>
  )
}
```

Lalu di `DashboardLayout`:

```tsx
// src/app/(dashboard)/dashboard/layout.tsx — tambahkan import
import { CredentialPanelServer } from './_components/site-header/credential-panel-server'

// Di dalam DashboardLayout, ubah SiteHeader menjadi:
<SiteHeader rightSlot={<CredentialPanelServer />} />
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/dashboard/_components/site-header/
git add src/app/(dashboard)/dashboard/layout.tsx
git commit -m "feat(credential-store): tambah CredentialPanel ke site header"
```

---

## Task 4: Bulk Upload Utilities (Parse + Validate)

**Files:**
- Create: `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-utils.ts`

- [ ] **Step 1: Buat utility file**

```ts
// src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-utils.ts
import * as XLSX from 'xlsx'
import { z } from 'zod'

export const BulkMemberRowSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  gender: z
    .string()
    .transform((v) => v.toLowerCase().trim())
    .pipe(z.enum(['ikhwan', 'akhwat'], { message: 'Harus "ikhwan" atau "akhwat"' })),
  yearOfEntry: z.coerce
    .number({ invalid_type_error: 'Tahun masuk harus angka' })
    .min(1998, 'Minimal 1998')
    .max(new Date().getFullYear(), `Maksimal ${new Date().getFullYear()}`),
  phone: z.string().optional().nullable()
})

export type BulkMemberRow = z.infer<typeof BulkMemberRowSchema>

export type ParsedRow = {
  index: number
  raw: Record<string, unknown>
  data: Partial<BulkMemberRow>
  errors: Record<string, string>
  valid: boolean
}

export const parseXLSXFile = (file: File): Promise<ParsedRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: ''
        })

        const parsed: ParsedRow[] = rows.map((row, index) => {
          const normalized = {
            name: String(row['Nama'] ?? row['name'] ?? '').trim(),
            gender: String(
              row['Jenis Kelamin'] ?? row['gender'] ?? ''
            ).trim(),
            yearOfEntry:
              row['Tahun Masuk'] ?? row['yearOfEntry'] ?? row['year_of_entry'],
            phone: String(row['No HP'] ?? row['phone'] ?? '').trim() || null
          }

          const result = BulkMemberRowSchema.safeParse(normalized)

          if (result.success) {
            return {
              index,
              raw: normalized,
              data: result.data,
              errors: {},
              valid: true
            }
          }

          const errors: Record<string, string> = {}
          for (const [field, msgs] of Object.entries(
            result.error.flatten().fieldErrors
          )) {
            errors[field] = (msgs as string[])[0]
          }

          return {
            index,
            raw: normalized,
            data: normalized as Partial<BulkMemberRow>,
            errors,
            valid: false
          }
        })

        resolve(parsed)
      } catch (err) {
        reject(new Error('File tidak bisa dibaca. Pastikan format XLSX valid.'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file.'))
    reader.readAsArrayBuffer(file)
  })
}

export const generateTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Nama', 'Jenis Kelamin', 'Tahun Masuk', 'No HP'],
    ['Contoh Nama', 'ikhwan', new Date().getFullYear(), '08123456789']
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, 'template-import-kader.xlsx')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-utils.ts
git commit -m "feat(bulk-upload): add XLSX parse + Zod validation utilities"
```

---

## Task 5: Bulk Upload Server Action

**Files:**
- Create: `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts`

- [ ] **Step 1: Buat server action**

```ts
// src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts
'use server'

import { z } from 'zod'
import { db } from '~/db/db'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'
import { createMember } from '~/db/query/member'
import { trainingQuery } from '~/db/query/training'
import { generateRegisterNumber } from '~/lib/utils/member'
import { generatePassword, hashPassword } from '~/lib/utils/user'
import { member as memberTable } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'

const BulkMemberInputSchema = z.object({
  name: z.string().min(1),
  gender: z.enum(['ikhwan', 'akhwat']),
  yearOfEntry: z.number().min(1998).max(new Date().getFullYear()),
  phone: z.string().optional().nullable()
})

const BulkCreateInputSchema = z.object({
  members: z.array(BulkMemberInputSchema).min(1),
  organizationId: z.string().uuid(),
  trainingId: z.string().uuid().optional()
})

type CredentialResult = {
  memberId: string
  name: string
  registerNumber: string
  password: string
}

type BulkCreateResult = {
  success: boolean
  message: string
  data?: CredentialResult[]
  errors?: string[]
}

export const bulkCreateMembersAction = async (
  input: z.infer<typeof BulkCreateInputSchema>
): Promise<BulkCreateResult> => {
  const session = await readActiveSession()
  if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }

  const { user } = session
  if (!['root', 'bpk'].includes(user.role)) {
    return { success: false, message: 'Role tidak diizinkan untuk aksi ini' }
  }

  const validated = BulkCreateInputSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, message: 'Input tidak valid' }
  }

  const { members, organizationId, trainingId } = validated.data

  const inScope = await isOrgInScope(user, organizationId)
  if (!inScope) {
    return {
      success: false,
      message: 'Antum tidak memiliki hak akses untuk organisasi ini'
    }
  }

  const credentials: CredentialResult[] = []
  const errors: string[] = []

  try {
    await db.transaction(async (tx) => {
      for (const memberData of members) {
        const registerNumber = await generateRegisterNumber(
          organizationId,
          memberData.yearOfEntry
        )
        const password = generatePassword()
        const passwordHash = await hashPassword(password)

        const [newMember] = await tx
          .insert(memberTable)
          .values({
            ...memberData,
            registerNumber,
            organizationId,
            status: 'ab1',
            isAlumn: false,
            isSuspended: false,
            isNonActive: false,
            isCertifiedMentor: false,
            isCertifiedInstructor: false
          })
          .returning({ id: memberTable.id, name: memberTable.name })

        await tx.insert(userTable).values({
          name: registerNumber,
          displayName: newMember.name,
          passwordHash,
          role: 'member',
          connectedMemberId: newMember.id
        })

        if (trainingId) {
          await trainingQuery.addAttendant(trainingId, newMember.id, tx)
        }

        credentials.push({
          memberId: newMember.id,
          name: newMember.name,
          registerNumber,
          password
        })
      }
    })

    revalidatePath('/dashboard/kader')
    if (trainingId) revalidatePath('/dashboard/trainings')

    return {
      success: true,
      message: `${credentials.length} kader berhasil ditambahkan`,
      data: credentials
    }
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : 'Gagal menambahkan kader secara massal',
      errors
    }
  }
}
```

> **Catatan:** `trainingQuery.addAttendant` perlu menerima `tx` (transaction executor) sebagai parameter opsional. Cek signature-nya di `src/db/query/training.ts`. Kalau belum support `tx`, tambahkan overload atau lewatkan `trainingId` dan proses di luar transaksi setelah commit (dengan risiko partial failure).

- [ ] **Step 2: Verifikasi signature `trainingQuery.addAttendant`**

```bash
grep -n "addAttendant" src/db/query/training.ts
```

Kalau signature-nya `(trainingId, memberId)` tanpa `tx`, ubah panggilan menjadi:

```ts
// Setelah transaksi selesai, loop lagi untuk addAttendant
if (trainingId) {
  for (const cred of credentials) {
    await trainingQuery.addAttendant(trainingId, cred.memberId)
  }
}
```

Dan hapus `addAttendant` dari dalam `db.transaction`.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts
git commit -m "feat(bulk-upload): add bulkCreateMembersAction server action"
```

---

## Task 6: Bulk Upload Preview Table (Editable)

**Files:**
- Create: `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-preview.tsx`

- [ ] **Step 1: Buat preview table**

```tsx
// src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-preview.tsx
'use client'

import { useState } from 'react'
import { Input } from '~/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import { BulkMemberRowSchema, type ParsedRow } from './bulk-upload-utils'

interface BulkUploadPreviewProps {
  rows: ParsedRow[]
  onChange: (rows: ParsedRow[]) => void
}

const revalidateRow = (row: ParsedRow): ParsedRow => {
  const result = BulkMemberRowSchema.safeParse(row.data)
  if (result.success) {
    return { ...row, data: result.data, errors: {}, valid: true }
  }
  const errors: Record<string, string> = {}
  for (const [field, msgs] of Object.entries(
    result.error.flatten().fieldErrors
  )) {
    errors[field] = (msgs as string[])[0]
  }
  return { ...row, errors, valid: false }
}

export const BulkUploadPreview = ({ rows, onChange }: BulkUploadPreviewProps) => {
  const updateRow = (index: number, field: string, value: unknown) => {
    const updated = rows.map((row) => {
      if (row.index !== index) return row
      const newData = { ...row.data, [field]: value }
      return revalidateRow({ ...row, data: newData })
    })
    onChange(updated)
  }

  const currentYear = new Date().getFullYear()
  const errorCount = rows.filter((r) => !r.valid).length

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='text-muted-foreground text-sm'>
          {rows.length} baris ditemukan
        </span>
        {errorCount > 0 && (
          <Badge variant='destructive'>{errorCount} baris error</Badge>
        )}
        {errorCount === 0 && (
          <Badge variant='default' className='bg-green-600'>Semua valid</Badge>
        )}
      </div>

      <div className='max-h-96 overflow-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 sticky top-0'>
            <tr>
              <th className='px-3 py-2 text-left font-medium'>#</th>
              <th className='px-3 py-2 text-left font-medium'>Nama *</th>
              <th className='px-3 py-2 text-left font-medium'>Jenis Kelamin *</th>
              <th className='px-3 py-2 text-left font-medium'>Tahun Masuk *</th>
              <th className='px-3 py-2 text-left font-medium'>No HP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.index}
                className={cn('border-t', !row.valid && 'bg-destructive/5')}
              >
                <td className='px-3 py-2 text-xs text-muted-foreground'>
                  {row.index + 1}
                </td>
                <td className='px-3 py-1.5'>
                  <Input
                    value={String(row.data.name ?? '')}
                    onChange={(e) => updateRow(row.index, 'name', e.target.value)}
                    className={cn(
                      'h-7 text-xs',
                      row.errors.name && 'border-destructive'
                    )}
                  />
                  {row.errors.name && (
                    <p className='mt-0.5 text-xs text-destructive'>{row.errors.name}</p>
                  )}
                </td>
                <td className='px-3 py-1.5'>
                  <Select
                    value={String(row.data.gender ?? '')}
                    onValueChange={(v) => updateRow(row.index, 'gender', v)}
                  >
                    <SelectTrigger
                      className={cn(
                        'h-7 text-xs',
                        row.errors.gender && 'border-destructive'
                      )}
                    >
                      <SelectValue placeholder='Pilih' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ikhwan'>Ikhwan</SelectItem>
                      <SelectItem value='akhwat'>Akhwat</SelectItem>
                    </SelectContent>
                  </Select>
                  {row.errors.gender && (
                    <p className='mt-0.5 text-xs text-destructive'>{row.errors.gender}</p>
                  )}
                </td>
                <td className='px-3 py-1.5'>
                  <Input
                    type='number'
                    min={1998}
                    max={currentYear}
                    value={String(row.data.yearOfEntry ?? '')}
                    onChange={(e) =>
                      updateRow(row.index, 'yearOfEntry', Number(e.target.value))
                    }
                    className={cn(
                      'h-7 w-24 text-xs',
                      row.errors.yearOfEntry && 'border-destructive'
                    )}
                  />
                  {row.errors.yearOfEntry && (
                    <p className='mt-0.5 text-xs text-destructive'>
                      {row.errors.yearOfEntry}
                    </p>
                  )}
                </td>
                <td className='px-3 py-1.5'>
                  <Input
                    value={String(row.data.phone ?? '')}
                    onChange={(e) =>
                      updateRow(row.index, 'phone', e.target.value || null)
                    }
                    className='h-7 text-xs'
                    placeholder='Opsional'
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-preview.tsx
git commit -m "feat(bulk-upload): add editable preview table with inline validation"
```

---

## Task 7: Bulk Upload Dialog

**Files:**
- Create: `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-dialog.tsx`
- Create: `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/index.ts`

- [ ] **Step 1: Buat dialog komponen**

```tsx
// src/app/(dashboard)/dashboard/kader/_components/bulk-upload/bulk-upload-dialog.tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Upload01Icon,
  Download04Icon,
  Loading03Icon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '~/components/shadcn/ui/dialog'
import { appendCredentials, type CredentialEntry } from '~/components/credential-store/store'
import { parseXLSXFile, generateTemplate, type ParsedRow } from './bulk-upload-utils'
import { bulkCreateMembersAction } from './action'
import { BulkUploadPreview } from './bulk-upload-preview'

interface BulkUploadDialogProps {
  organizationId: string
  trainingId?: string
}

export const BulkUploadDialog = ({
  organizationId,
  trainingId
}: BulkUploadDialogProps) => {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isPending, startTransition] = useTransition()

  const hasErrors = rows.some((r) => !r.valid)
  const canSubmit = rows.length > 0 && !hasErrors

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseXLSXFile(file)
      setRows(parsed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membaca file')
    }
    e.target.value = ''
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    const validRows = rows.filter((r) => r.valid)
    const members = validRows.map((r) => ({
      name: r.data.name!,
      gender: r.data.gender!,
      yearOfEntry: r.data.yearOfEntry!,
      phone: r.data.phone ?? null
    }))

    startTransition(async () => {
      const result = await bulkCreateMembersAction({
        members,
        organizationId,
        trainingId
      })

      if (result.success && result.data) {
        const entries: CredentialEntry[] = result.data.map((d) => ({
          memberId: d.memberId,
          name: d.name,
          registerNumber: d.registerNumber,
          password: d.password,
          organizationId,
          createdAt: new Date().toISOString()
        }))
        appendCredentials(organizationId, entries)
        toast.success(result.message)
        setOpen(false)
        setRows([])
      } else {
        toast.error(result.message ?? 'Terjadi kesalahan')
      }
    })
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) setRows([])
    setOpen(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <HugeiconsIcon icon={Upload01Icon} className='mr-2 size-3.5' />
          Import XLSX
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Import Kader dari XLSX</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex items-center gap-3'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={generateTemplate}
            >
              <HugeiconsIcon icon={Download04Icon} className='mr-2 size-3.5' />
              Download Template
            </Button>
            <label
              htmlFor='xlsx-upload'
              className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors'
            >
              <HugeiconsIcon icon={Upload01Icon} className='size-3.5' />
              Pilih File XLSX
            </label>
            <input
              id='xlsx-upload'
              type='file'
              accept='.xlsx,.xls'
              className='sr-only'
              onChange={handleFileChange}
            />
          </div>

          {rows.length > 0 && (
            <BulkUploadPreview rows={rows} onChange={setRows} />
          )}

          {rows.length === 0 && (
            <p className='text-muted-foreground text-sm'>
              Upload file XLSX untuk memulai. Gunakan template agar format kolom sesuai.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                className='mr-2 size-3.5 animate-spin'
              />
            ) : null}
            {isPending ? 'Menyimpan...' : `Import ${rows.filter((r) => r.valid).length} Kader`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Buat barrel export**

```ts
// src/app/(dashboard)/dashboard/kader/_components/bulk-upload/index.ts
export * from './bulk-upload-dialog'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/kader/_components/bulk-upload/
git commit -m "feat(bulk-upload): add BulkUploadDialog with file upload + preview + submit"
```

---

## Task 8: Integrasikan BulkUploadDialog ke Halaman Kader

**Files:**
- Modify: `src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx`

- [ ] **Step 1: Tambah import dan render `BulkUploadDialog`**

Cari bagian di `MembersPageContent.tsx` di mana `<MembersPageHeader>` di-render (sekitar baris 289). Tambahkan `BulkUploadDialog` setelah header, hanya untuk BPK di level PK.

Tambahkan import di atas file:

```tsx
import { BulkUploadDialog } from './bulk-upload'
```

Lalu di dalam JSX, setelah `<MembersPageHeader ... />`, tambahkan:

```tsx
{user.role === 'bpk' && currentOrg && (
  <div className='flex justify-end'>
    <BulkUploadDialog organizationId={currentOrg.id} />
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx
git commit -m "feat(bulk-upload): tambah Import XLSX button di halaman kader"
```

---

## Task 9: Integrasikan DM1 Bulk Upload ke Training Detail View

**Files:**
- Create: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/dm1-bulk-upload-button.tsx`
- Modify: `src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx`

- [ ] **Step 1: Buat DM1BulkUploadButton**

```tsx
// src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/dm1-bulk-upload-button.tsx
'use client'

import { BulkUploadDialog } from '~/app/(dashboard)/dashboard/kader/_components/bulk-upload'

interface DM1BulkUploadButtonProps {
  trainingId: string
  organizationId: string
}

export const DM1BulkUploadButton = ({
  trainingId,
  organizationId
}: DM1BulkUploadButtonProps) => {
  return (
    <BulkUploadDialog
      organizationId={organizationId}
      trainingId={trainingId}
    />
  )
}
```

- [ ] **Step 2: Tambah `DM1BulkUploadButton` ke training detail view**

Di `training-detail-view.tsx`, cari area di mana `<DM1AddForm>` di-render. Tambahkan import dan render `DM1BulkUploadButton` di sampingnya, hanya saat `training.type === 'dm1'` dan `canManage`:

```tsx
import { DM1BulkUploadButton } from './dm1-bulk-upload-button'

// Di dalam JSX, cari tempat DM1AddForm di-render, lalu tambahkan:
{training.type === 'dm1' && canManage && (
  <DM1BulkUploadButton
    trainingId={training.id}
    organizationId={training.organizationId}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/dm1-bulk-upload-button.tsx
git add src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/training-detail-view.tsx
git commit -m "feat(bulk-upload): tambah Import Peserta di halaman detail DM1"
```

---

## Task 10: Regenerate Credential Server Action

**Files:**
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/action.ts`

- [ ] **Step 1: Buat action**

```ts
// src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/action.ts
'use server'

import { eq } from 'drizzle-orm'
import { db } from '~/db/db'
import { user as userTable } from '~/db/schema/user.sql'
import { member as memberTable } from '~/db/schema/member.sql'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope } from '~/db/query/organization'
import { generatePassword, hashPassword } from '~/lib/utils/user'

type RegenerateResult = {
  success: boolean
  message: string
  data?: {
    memberId: string
    name: string
    registerNumber: string
    password: string
  }
}

export const regenerateCredentialAction = async (
  memberId: string
): Promise<RegenerateResult> => {
  const session = await readActiveSession()
  if (!session?.user) return { success: false, message: 'Tidak terautentikasi' }

  const { user } = session
  if (!['root', 'bpk'].includes(user.role)) {
    return { success: false, message: 'Role tidak diizinkan untuk aksi ini' }
  }

  const [memberRow] = await db
    .select({
      id: memberTable.id,
      name: memberTable.name,
      registerNumber: memberTable.registerNumber,
      organizationId: memberTable.organizationId
    })
    .from(memberTable)
    .where(eq(memberTable.id, memberId))
    .limit(1)

  if (!memberRow) return { success: false, message: 'Kader tidak ditemukan' }

  const inScope = await isOrgInScope(user, memberRow.organizationId)
  if (!inScope) {
    return { success: false, message: 'Kader ini bukan dalam scope organisasi antum' }
  }

  const [userRow] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.connectedMemberId, memberId))
    .limit(1)

  if (!userRow) return { success: false, message: 'Akun kader tidak ditemukan' }

  const password = generatePassword()
  const passwordHash = await hashPassword(password)

  await db
    .update(userTable)
    .set({ passwordHash })
    .where(eq(userTable.id, userRow.id))

  return {
    success: true,
    message: 'Password berhasil direset',
    data: {
      memberId: memberRow.id,
      name: memberRow.name,
      registerNumber: memberRow.registerNumber,
      password
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/profile/\[registerNumber\]/_components/reset-password/action.ts
git commit -m "feat(credential-store): add regenerateCredentialAction server action"
```

---

## Task 11: Reset Password Button UI

**Files:**
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/reset-password-button.tsx`
- Create: `src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/index.ts`
- Modify: `src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx`

- [ ] **Step 1: Buat ResetPasswordButton**

```tsx
// src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/reset-password-button.tsx
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Key01Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/shadcn/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '~/components/shadcn/ui/dialog'
import { appendCredentials, type CredentialEntry } from '~/components/credential-store/store'
import { regenerateCredentialAction } from './action'

interface ResetPasswordButtonProps {
  memberId: string
  organizationId: string
}

export const ResetPasswordButton = ({
  memberId,
  organizationId
}: ResetPasswordButtonProps) => {
  const [isPending, startTransition] = useTransition()
  const [newCredential, setNewCredential] = useState<{
    registerNumber: string
    password: string
  } | null>(null)

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await regenerateCredentialAction(memberId)

      if (result.success && result.data) {
        const entry: CredentialEntry = {
          memberId: result.data.memberId,
          name: result.data.name,
          registerNumber: result.data.registerNumber,
          password: result.data.password,
          organizationId,
          createdAt: new Date().toISOString()
        }
        appendCredentials(organizationId, [entry])
        setNewCredential({
          registerNumber: result.data.registerNumber,
          password: result.data.password
        })
        toast.success(result.message)
      } else {
        toast.error(result.message ?? 'Gagal mereset password')
      }
    })
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='outline' size='sm' disabled={isPending}>
            {isPending ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                className='mr-2 size-3.5 animate-spin'
              />
            ) : (
              <HugeiconsIcon icon={Key01Icon} className='mr-2 size-3.5' />
            )}
            Reset Password
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password kader ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Password lama kader ini akan langsung tidak berlaku dan diganti
              dengan yang baru. Password baru akan tersimpan di Credential Panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              Ya, Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {newCredential && (
        <Dialog open onOpenChange={() => setNewCredential(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Password Baru</DialogTitle>
            </DialogHeader>
            <div className='space-y-3 rounded-lg border p-4'>
              <div>
                <p className='text-muted-foreground text-xs'>NIK (Username)</p>
                <p className='font-mono font-medium'>{newCredential.registerNumber}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>Password Baru</p>
                <p className='font-mono font-medium'>{newCredential.password}</p>
              </div>
              <p className='text-muted-foreground text-xs'>
                Credential ini juga sudah tersimpan di Credential Panel.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
```

- [ ] **Step 2: Buat barrel export**

```ts
// src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/index.ts
export * from './reset-password-button'
```

- [ ] **Step 3: Tambah ResetPasswordButton ke ProfilePage**

Buka `src/app/(dashboard)/dashboard/profile/[registerNumber]/page.tsx`. Tambahkan import dan pass `ResetPasswordButton` sebagai slot ke `ProfileInlineEditForm`, atau render langsung setelah form — tergantung layout yang ada. Yang paling safe: tambah di bawah `ProfileInlineEditForm` dalam kondisi `userCanEdit && session?.user.role === 'bpk'`:

```tsx
// Tambah import
import { ResetPasswordButton } from './_components/reset-password'

// Di dalam ProfilePage return, setelah ProfileInlineEditForm:
{userCanEdit && session?.user.role === 'bpk' && (
  <div className='px-4 py-2 md:px-6 md:py-4'>
    <ResetPasswordButton
      memberId={member.id}
      organizationId={member.organizationId}
    />
  </div>
)}
```

> **Catatan:** `session` sudah di-destructure di atas, tapi `member.organizationId` perlu dipastikan — cek type `Member` dari `~/db/query/member`. Berdasarkan `withMemberCTE`, field `organizationId` tersedia.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/dashboard/profile/\[registerNumber\]/_components/reset-password/
git add src/app/(dashboard)/dashboard/profile/\[registerNumber\]/page.tsx
git commit -m "feat(credential-store): tambah ResetPasswordButton di halaman profil kader"
```

---

## Task 12: Verifikasi End-to-End

- [ ] **Step 1: Jalankan dev server**

```bash
bun dev
```

- [ ] **Step 2: Test bulk upload dari halaman kader**

1. Login sebagai BPK
2. Buka `/dashboard/kader`
3. Klik "Import XLSX" — dialog harus muncul
4. Download template, isi 2-3 baris, upload
5. Preview harus muncul dengan data yang benar
6. Coba sengaja kosongkan field Nama di satu baris — harus ada highlight merah
7. Fix inline, pastikan badge error hilang
8. Klik "Import N Kader" — harus sukses
9. Credential Panel di header harus menunjukkan badge angka
10. Buka panel, verifikasi data ada, coba Download CSV

- [ ] **Step 3: Test bulk upload dari DM1**

1. Buka training bertipe DM1
2. Tombol "Import Peserta" harus muncul
3. Import beberapa kader — mereka harus otomatis terdaftar sebagai peserta

- [ ] **Step 4: Test regenerate credential**

1. Buka profil kader di `/dashboard/profile/[nik]`
2. Tombol "Reset Password" harus visible (login sebagai BPK)
3. Klik, konfirmasi dialog
4. Modal credential baru harus muncul
5. Verifikasi entry di Credential Panel terupdate (bukan duplikat)

- [ ] **Step 5: Test localStorage persistence**

1. Setelah import, tutup browser
2. Buka kembali, login sebagai BPK yang sama
3. Credential Panel harus masih menampilkan data yang sama

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "chore: bulk upload + credential store — fitur selesai"
```
