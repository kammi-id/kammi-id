# 03 — Syarat jenjang perangkat Daurah bergantung jenis Daurah

Status: done — implementasi sudah masuk dev-20260104 dan deploy non-production; status diperbarui 2026-09-06.
ADR: [0022](../../../docs/adr/0022-ab3-hanya-syarat-dm3.md)

Poin 3 dari feedback. **Ini pelonggaran**, bukan pengetatan — kode hari ini
sudah lebih ketat dari yang dilaporkan.

## Keadaan sekarang

`searchEligibleInstructors` dan `searchEligibleInstructorsGlobal`
(`src/db/query/training.ts:619-689`) sama-sama mengunci
`status = 'ab3' AND is_certified_instructor = true`, untuk **semua** jenis
Daurah dan **semua** Peran Instruktur.

## Yang diminta

| Jenis Daurah | Jenjang minimum | Sertifikasi |
| --- | --- | --- |
| DM3 | AB3 | Instruktur |
| DM1, DM2, DPMK, TFI | AB2 | Instruktur |

Aturannya **per jenis Daurah, bukan per Peran**. Ketujuh Peran (`master`,
`assistant_master`, `classroom_master`, `lecturer`, `administrator`,
`observer`, `ustadz_of_training`) tunduk pada syarat yang sama di dalam satu
Daurah. **Master of Training ikut longgar.**

## Pekerjaan

- `searchEligibleInstructors` menyaring berdasarkan jenis Daurah yang sudah ia
  ketahui dari `trainingId`.
- `searchMasterCandidatesAction`
  (`trainings/_components/add-training-modal/action.ts:59`) **harus mulai
  menerima jenis Daurah**. Ia memilih Master saat Daurah dibuat dan selama ini
  mengunci AB3 tanpa tahu jenis apa yang dibuat. Form-nya sudah memegang `type`
  di state (`training-form.tsx:57`); yang kurang hanya meneruskannya.
  Tanpa ini hasilnya tidak konsisten: membuat DM1 menuntut Master AB3,
  menambahkan Instruktur Materi ke DM1 yang sama menerima AB2.
- Namanya menyesatkan setelah perubahan ini — `searchEligibleInstructorsGlobal`
  tidak lagi buta jenis. Ganti nama.
- Gerbang tetap di server. Kedua aksi sudah punya `requireDaurahCreationAccess`
  yang mendahului pintasan `query.length < 2`; pertahankan urutan itu.

## Selesai bila

- AB2 bersertifikat Instruktur muncul untuk DM1/DM2/DPMK/TFI, tidak untuk DM3
  (tes).
- AB2 **tanpa** sertifikasi Instruktur tidak pernah muncul, di jenis apa pun
  (tes).
- Kandidat Master saat membuat DM1 menerima AB2; saat membuat DM3 tidak (tes).
- Ketiga `check:*` hijau.

## Konsekuensi yang disadari

Seorang AB2 dapat menjadi Master of Training sebuah **TFI** — Daurah yang
mencetak Instruktur. Keberatan diajukan saat grilling, ditolak, dijalankan.
Bila kelak terasa salah: satu klausa pada `typeFilter`.

## Comments

### 2026-09-06 — sinkronisasi status setelah implementasi dan deploy

Syarat Instruktur dan kandidat Master mengikuti jenis Daurah: DM3 mensyaratkan AB3, jenis lain menerima AB2 bersertifikat. Tes jalur pencarian Instruktur ditambahkan menyusul.

Implementasi: [`1c2cb88`](https://github.com/kammi-id/kammi-id/commit/1c2cb88), [`c0f8b93`](https://github.com/kammi-id/kammi-id/commit/c0f8b93). Commit tersebut sudah masuk `dev-20260104`.
[CI dan deploy non-production `d100077`](https://github.com/kammi-id/kammi-id/actions/runs/33590415712)
lulus pada 2026-09-02, 11.30 WIB (test, build-push, deploy). Perubahan tetap
tercakup dalam [rilis `036f467`](https://github.com/kammi-id/kammi-id/actions/runs/33781321956),
yang lulus dan selesai deploy pada 2026-09-04, 00.06 WIB.

Status lama `ready-for-agent` tertinggal setelah implementasi. Pembaruan ini
berdasarkan riwayat commit dan hasil CI yang diperiksa pada 2026-09-06; bukan
pengujian ulang manual seluruh alur dashboard atau verifikasi rilis production.
