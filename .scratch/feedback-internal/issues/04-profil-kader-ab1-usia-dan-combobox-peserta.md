# 04 — Profil Kader: pagar AB1, agregat usia, dan baris combobox Peserta

Status: ready-for-agent

Poin 1, 2, 8, dan 9 dari feedback. Digabung karena ketiganya menyentuh
permukaan yang sama dan poin 2 tidak bisa diselesaikan tanpa poin 8.

## Poin 2 + 8 — AB1 tidak pernah Pemandu maupun Instruktur

Keadaan sekarang, agar tidak dikerjakan dua kali:

| Permukaan | Status |
| --- | --- |
| Add-form, sisi UI (`status-section.tsx:38-41`) | **Sudah** — `disabled={isAb1}` + auto-clear |
| Add-form, sisi server (`add-form/schema.ts`) | **Belum** — menerima `ab1` + sertifikasi tanpa protes |
| Halaman detail, sisi UI (`profile-sidebar.tsx:205-225`) | **Belum** — toggle tampil tanpa syarat |
| Halaman detail, sisi server (`_components/action/action.ts:22`) | **Belum** |

Pekerjaan:

- **UI halaman detail**: saat jenjang terpilih `ab1`, blok "Perangkat
  Pengkaderan" **hilang sepenuhnya**. Reaktif terhadap radio jenjang di form
  yang sama, bukan hanya terhadap nilai awal.
- **Auto-clear saat simpan**: menyimpan profil ber-jenjang `ab1` memaksa
  `isCertifiedMentor` dan `isCertifiedInstructor` menjadi `false`.
- **Server**: `.superRefine` menolak `ab1` + sertifikasi apa pun, di add-form
  **dan** di profil. Aturannya satu, jadi letakkan di `src/lib/` — bukan tiga
  salinan yang bisa berbeda pendapat.

> **Konsekuensi yang disadari.** Delapan Kader AB1 di staging memegang
> sertifikasi, dan hanya satu bernama "Dummy AB1". Sertifikasi tujuh orang
> nyata akan hilang **tanpa notifikasi** saat profil masing-masing disimpan —
> kapan pun, oleh siapa pun, untuk perubahan apa pun. Diputuskan sadar:
> aturan organisasi menyatakan AB1 memang tidak bisa menjadi keduanya, jadi
> yang hilang adalah data yang tidak sah. Jangan "perbaiki" ini tanpa perintah.

## Poin 9 — Agregat usia

- Baris ketiga pada `profile-header.tsx`, di bawah baris NIA + badge jenjang.
- Format `18 tahun, 2 bulan`.
- `birthDate` **nullable**: bila null, **barisnya hilang**. Bukan "Usia: —".

## Poin 1 — Baris combobox Peserta Daurah

`training-attendant-combobox.tsx` kini memakai ternary, sehingga Kader yang
memegang **kedua** sertifikasi hanya tampil sebagai "Instruktur".

- Urutan: `NIA · Jenjang · Pemandu · Instruktur · PW`.
- Keduanya tampil bila keduanya dipegang.
- Nol sertifikasi → slot **hilang**, bukan tanda hubung.
- "Asal PW" tetap dibaca dari `organization_id` lewat `pwNameSubquery`,
  **tidak pernah** diurai dari NIA (ADR 0020).

## Selesai bila

- Memilih AB1 di halaman detail menghilangkan blok Perangkat seketika (tes
  komponen — ingat `afterEach(cleanup)` manual, `tests/setup.ts` tidak punya
  auto-cleanup).
- Server menolak `ab1` + sertifikasi dari kedua permukaan (tes).
- Menyimpan profil AB1 memadamkan kedua flag (tes).
- `birthDate` null → tidak ada baris usia (tes).
- Kader ber-dua-sertifikasi tampil dengan keduanya (tes).
- Ketiga `check:*` hijau.
