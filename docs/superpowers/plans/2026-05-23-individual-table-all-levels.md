# Individual Table All Levels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tampilkan `IndividualMemberTable` di semua level organisasi (PP, PW, PD, PK, PDLN) pada halaman kader, alumni, dan perangkat.

**Architecture:** Satu kondisi boolean di `MembersPageContent.tsx` menentukan apakah tabel individu ditampilkan. Mengubahnya menjadi `true` secara otomatis berlaku untuk semua halaman yang menggunakan komponen ini. Combobox selector sudah benar — sudah membatasi pilihan ke descendant dari org aktif.

**Tech Stack:** Next.js (RSC), TypeScript, Drizzle ORM, Bun test

---

### Task 1: Ubah kondisi `showIndividuals` menjadi selalu `true`

**Files:**
- Modify: `src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx:108-110`

- [ ] **Step 1: Buka file dan cari kondisi `showIndividuals`**

Baca baris 108–110 di `MembersPageContent.tsx`:

```ts
const showIndividuals =
  ['pd', 'pdln', 'pk'].includes(currentOrg.type) ||
  (isSpecialView && currentOrg.type === 'pw')
```

- [ ] **Step 2: Ganti kondisi dengan `true`**

Ubah ketiga baris tersebut menjadi satu baris:

```ts
const showIndividuals = true
```

- [ ] **Step 3: Type-check**

```bash
bun run typecheck
```

Expected: tidak ada error baru.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx
git commit -m "feat(kader): tampilkan tabel individu di semua level organisasi"
```

---

### Task 2: Verifikasi manual via browser

**Files:** — (tidak ada perubahan kode)

- [ ] **Step 1: Jalankan dev server**

```bash
bun run dev
```

- [ ] **Step 2: Login sebagai user PP (root)**

Buka `/dashboard/kader` — pastikan `IndividualMemberTable` muncul di atas org-grid.

- [ ] **Step 3: Verifikasi PW level**

Klik salah satu PW di org-grid → navigasi ke halaman PW. Pastikan `IndividualMemberTable` muncul.

- [ ] **Step 4: Verifikasi combobox di PP level**

Klik tombol "Tambah Data Kader" di inline quick add row. Pastikan combobox hanya menampilkan org tipe `pd` dan `pk` (bukan PW).

- [ ] **Step 5: Verifikasi halaman alumni**

Buka `/dashboard/alumni` — pastikan `IndividualMemberTable` juga muncul di level PP/PW.

- [ ] **Step 6: Verifikasi halaman perangkat**

Buka `/dashboard/perangkat` — pastikan tabel individu pemandu/instruktur muncul di level PP/PW.

- [ ] **Step 7: Pastikan PD/PK tidak berubah**

Navigasi ke halaman PD atau PK. Pastikan tampilannya sama seperti sebelumnya (hanya individual table, tanpa org-grid).
