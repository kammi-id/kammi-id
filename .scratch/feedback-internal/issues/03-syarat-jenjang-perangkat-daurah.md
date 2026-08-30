# 03 — Syarat jenjang perangkat Daurah bergantung jenis Daurah

Status: ready-for-agent
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
