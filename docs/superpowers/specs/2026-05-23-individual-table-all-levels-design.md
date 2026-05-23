# Tabel Individu di Semua Level Organisasi

**Date:** 2026-05-23
**Status:** Approved

## Problem

`IndividualMemberTable` (tabel daftar kader per-orang) saat ini hanya ditampilkan di level PD/PDLN/PK, atau PW untuk special views (pemandu/instruktur). User di level PP dan PW biasa tidak bisa melihat daftar individu — hanya melihat ringkasan per-organisasi.

## Solution

Tampilkan `IndividualMemberTable` di semua level organisasi (PP, PW, PD, PK, PDLN) dengan mengubah kondisi `showIndividuals` menjadi selalu `true`.

## Architecture

Semua halaman kader, alumni, dan perangkat reuse komponen `MembersPageContent`. Perubahan satu kondisi di file ini berlaku untuk semua halaman.

## Change

**File:** `src/app/(dashboard)/dashboard/kader/_components/MembersPageContent.tsx`

```ts
// Before
const showIndividuals =
  ['pd', 'pdln', 'pk'].includes(currentOrg.type) ||
  (isSpecialView && currentOrg.type === 'pw')

// After
const showIndividuals = true
```

## Data Flow

`readDescendantMembers` menggunakan recursive CTE untuk mengambil semua anggota di bawah `parentId`, dengan pagination default 10 per halaman. Sudah berfungsi untuk semua level termasuk PP.

## Combobox Selector (tidak berubah)

`InlineQuickAddRow.filteredOrganizations` sudah memfilter ke tipe `pd` dan `pk` yang merupakan descendant dari `parentOrgId`:

- PP → semua PD dan PK se-Indonesia
- PW → hanya PD dan PK di bawah PW tersebut
- PD → hanya PK di bawah PD tersebut
- PK → hanya PK itu sendiri

Tidak ada perubahan kode diperlukan untuk bagian ini.

## Expected Behavior After Change

| Level | Sebelum | Sesudah |
|-------|---------|---------|
| PP | Hanya org-grid | Individual table + org-grid |
| PW | Hanya org-grid (kecuali special view) | Individual table + org-grid |
| PD/PDLN | Individual table saja | Tidak berubah |
| PK | Individual table saja | Tidak berubah |

Individual table muncul di atas org-grid (sesuai urutan JSX yang sudah ada).
