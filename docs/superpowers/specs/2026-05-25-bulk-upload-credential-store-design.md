# Bulk Upload Kader & Credential Store

**Date:** 2026-05-25  
**Status:** Approved  
**Scope:** BPK role only

---

## Overview

Tiga fitur terintegrasi yang diimplementasi sekaligus:

1. **Bulk Upload XLSX** — import kader baru secara massal via file Excel
2. **Credential Store** — simpan NIK + password hasil generate di localStorage (nanostores persistent), bisa di-download kapanpun
3. **Regenerate Credential** — reset password kader on-demand dari halaman detail kader

---

## 1. XLSX Bulk Upload

### Entry Points

| Lokasi | Tombol | Scope |
|--------|--------|-------|
| `/dashboard/kader` (halaman kader se-Indonesia) | "Import XLSX" di page header | `organizationId` BPK yang login |
| `/dashboard/trainings/[id]` (halaman detail DM1) | "Import Peserta" di samping "Tambah Manual" | `organizationId` training |

### Parse & Validation Flow

Semua parsing terjadi di client — tidak ada file yang dikirim ke server.

1. User upload `.xlsx` file → `SheetJS` (`xlsx` package) parse di browser → array of row objects
2. Setiap baris divalidasi dengan Zod schema yang identik dengan `DM1MemberSchema`:
   - `name`: string, wajib
   - `gender`: `'ikhwan' | 'akhwat'`, wajib
   - `yearOfEntry`: number, 1998–tahun sekarang, wajib
   - `phone`: string, opsional
3. Hasil ditampilkan sebagai preview table:
   - Baris valid → normal
   - Baris error → highlight merah + pesan error inline per cell
4. User dapat **edit langsung di preview table** untuk memperbaiki baris yang error
5. Tombol "Submit" aktif hanya bila: minimal 1 baris ada, dan **0 baris masih berstatus error**

### Template XLSX

Tersedia tombol "Download Template" yang generate file XLSX kosong dengan header kolom:
`Nama | Jenis Kelamin | Tahun Masuk | No HP`

Template di-generate di client (no server call) menggunakan SheetJS.

### Server Action: `bulkCreateMembersAction`

```ts
// Input
type BulkCreateInput = {
  members: Array<{
    name: string
    gender: 'ikhwan' | 'akhwat'
    yearOfEntry: number
    phone?: string | null
  }>
  organizationId: string
  trainingId?: string  // opsional, untuk konteks DM1
}

// Output
type BulkCreateOutput = {
  success: boolean
  message: string
  data?: Array<{
    memberId: string
    name: string
    registerNumber: string
    password: string  // plaintext, sekali saja
  }>
  errors?: string[]
}
```

**Implementasi:**
- Auth check: user harus BPK, `organizationId` harus in-scope
- Semua insert dalam satu `db.transaction()` — gagal satu, rollback semua
- Setiap member: `generateRegisterNumber()` + `createMember()` (yang sudah include `createUser()`)
- Kalau `trainingId` ada: `trainingQuery.addAttendant()` untuk tiap member baru
- Return array `{ name, registerNumber, password }` — password plaintext dari `generatePassword()` sebelum di-hash

**Lokasi:** `src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.ts`

---

## 2. Credential Store (Nanostores Persistent)

### Store Structure

```ts
// src/components/credential-store/store.ts

type CredentialEntry = {
  memberId: string
  name: string
  registerNumber: string  // username login kader
  password: string        // plaintext, client-only
  organizationId: string
  createdAt: string       // ISO timestamp
}

type CredentialStore = {
  [organizationId: string]: CredentialEntry[]
}
```

**Implementasi:**
- Package: `@nanostores/persistent`
- localStorage key: `kammi:credentials`
- Setelah server action sukses return credentials, client append ke store berdasarkan `organizationId` aktif
- Kalau `registerNumber` sudah ada di store (kasus regenerate): **replace** entry lama, bukan append
- Store hanya **menampilkan** credential milik `organizationId` BPK yang sedang login

### Credential Panel

Komponen: `CredentialPanel`  
Lokasi: `src/components/credential-store/credential-panel.tsx`

- Accessible via icon/badge di navbar/header — badge menunjukkan jumlah credential tersimpan untuk org aktif
- Tampilkan dalam bentuk tabel: **Nama | NIK (username) | Password | Tanggal Generate**
- Tombol **Download CSV** — generate file `credentials-[orgSlug]-[tanggal].csv` di browser (no server call)
- Tombol **Hapus Semua** — dengan confirmation dialog, clear semua credential untuk org aktif

---

## 3. Regenerate Credential

### Entry Point

Halaman detail kader (individual member view) — tombol "Reset Password".  
Hanya visible bila: user yang login adalah BPK **dan** kader dalam scope org-nya.

> **Catatan implementasi:** Route `/dashboard/kader/[memberSlug]` belum exist. Halaman detail kader perlu dibuat sebagai bagian dari implementasi ini. Tombol "Reset Password" diletakkan di halaman detail tersebut.

### Flow

1. User klik "Reset Password"
2. Confirmation dialog muncul: *"Password lama kader ini akan langsung tidak berlaku. Lanjutkan?"*
3. User konfirmasi → `regenerateCredentialAction(memberId)`
4. Server: generate password baru → hash → update `passwordHash` di tabel `user` where `connectedMemberId = memberId`
5. Return `{ registerNumber, password }` plaintext ke client
6. Client: update credential store (replace entry lama, atau append kalau belum ada)
7. Toast sukses + modal kecil tampilkan credential baru

### Server Action: `regenerateCredentialAction`

```ts
// Input
type RegenerateInput = {
  memberId: string
}

// Output
type RegenerateOutput = {
  success: boolean
  message: string
  data?: {
    registerNumber: string
    password: string  // plaintext, sekali saja
  }
}
```

**Implementasi:**
- Auth check: user harus BPK, kader harus in-scope
- `generatePassword()` → `hashPassword()` → update `user.passwordHash`
- Return plaintext — tidak di-persist di server

**Lokasi:** `src/app/(dashboard)/dashboard/kader/_components/member-detail/action.ts` (atau file action yang sudah ada di halaman detail kader)

---

## File Structure

```
src/
├── components/
│   └── credential-store/
│       ├── store.ts              # nanostores persistent store
│       ├── credential-panel.tsx  # panel UI (drawer/popover)
│       └── index.ts
├── app/(dashboard)/dashboard/
│   ├── kader/
│   │   └── _components/
│   │       ├── bulk-upload/
│   │       │   ├── bulk-upload-button.tsx    # trigger button + dialog
│   │       │   ├── bulk-upload-preview.tsx   # editable preview table
│   │       │   ├── bulk-upload-utils.ts      # SheetJS parse + Zod validate
│   │       │   ├── action.ts                 # bulkCreateMembersAction
│   │       │   └── index.ts
│   │       └── member-detail/
│   │           └── action.ts                 # regenerateCredentialAction
│   └── trainings/
│       └── _components/
│           └── training-detail-view/
│               └── dm1-bulk-upload-button.tsx  # entry point dari DM1 context
```

---

## Dependencies Baru

| Package | Kegunaan |
|---------|---------|
| `xlsx` (SheetJS) | Parse XLSX di client + generate template & CSV |
| `@nanostores/persistent` | Persistent localStorage store |

---

## Out of Scope

- Credential untuk kader yang dibuat sebelum fitur ini (data lama) — tidak di-backfill
- Bulk upload format selain XLSX (CSV, Google Sheets, dll)
- Server-side credential storage atau audit log
