# AB3 hanya disyaratkan untuk perangkat DM3; Daurah lain cukup AB2 bersertifikat Instruktur

Kode hari ini menyaring calon perangkat Daurah dengan satu aturan yang sama
untuk semua: `status = 'ab3'` **dan** `is_certified_instructor = true`
(`searchEligibleInstructors`, `searchEligibleInstructorsGlobal`,
`db/query/training.ts`). Aturan itu tidak pernah membedakan DM1 dari DM3, dan
tidak pernah membedakan Master of Training dari Observer.

Di lapangan syarat itu terlalu ketat. Seorang AB2 bisa sah menjadi Instruktur —
`searchEligibleAttendants` sendiri menerima AB2 sebagai peserta TFI — lalu
sertifikasi yang baru saja ia peroleh tidak bisa ia pakai di Daurah mana pun
sampai jenjangnya naik. Sertifikasi yang tidak bisa dijalankan adalah
sertifikasi yang setengah berlaku.

## Decision

**Jenjang minimum seorang perangkat ditentukan oleh jenis Daurah yang ia
layani, bukan oleh satu angka yang berlaku di mana-mana.**

- **DM3** — perangkatnya wajib **AB3** dan bersertifikat Instruktur.
- **DM1, DM2, DPMK, TFI** — perangkatnya boleh **AB2**, tetap wajib
  bersertifikat Instruktur.

Sertifikasi Instruktur tetap syarat mutlak di seluruh jenis Daurah; yang
dilonggarkan hanya jenjangnya.

**Aturannya per jenis Daurah, bukan per Peran Instruktur.** Ketujuh Peran
(`master`, `assistant_master`, `classroom_master`, `lecturer`,
`administrator`, `observer`, `ustadz_of_training`) tunduk pada syarat yang
sama di dalam satu Daurah. Master of Training ikut longgar.

Konsekuensi teknisnya: `searchMasterCandidatesAction`
(`add-training-modal/action.ts`) harus mulai menerima jenis Daurah. Ia memilih
Master of Training pada saat Daurah **dibuat** dan selama ini mengunci AB3
tanpa pernah tahu jenis apa yang sedang dibuat. Form-nya sudah memegang `type`
di state; yang kurang hanya meneruskannya. Tanpa itu, hasilnya tidak
konsisten: membuat DM1 mensyaratkan Master AB3, sementara menambahkan
Instruktur Materi ke DM1 yang sama sesudahnya menerima AB2.

## Considered Options

**Mempertahankan AB3 di semua jenis Daurah.** Ini yang berjalan hari ini, dan
ia bukan pilihan yang buruk — ia sederhana dan tidak pernah salah ke arah yang
berbahaya. Ditolak oleh keputusan produk: ia membekukan sertifikasi Instruktur
milik AB2 sampai jenjangnya naik.

**Mengecualikan Master dan Assistant Master**, sehingga keduanya selalu AB3
apa pun Daurah-nya, sementara Peran lain mengikuti jenis. Diusulkan dan
**ditolak** oleh pengambil keputusan. Argumen yang diajukan dan tidak diterima:
di bawah keputusan yang diambil, seorang AB2 boleh menjadi Master of Training
sebuah TFI — Daurah yang justru mencetak Instruktur. Argumen tandingannya
adalah bahwa penunjukan perangkat sudah melewati pertimbangan manusia di
tingkat penyelenggara, dan sistem tidak perlu menebak apa yang sudah
diputuskan di sana.

**Matriks penuh Peran × jenis Daurah** (21 sel). Ditolak: tidak ada yang
memintanya, dan tidak ada yang bisa menghafalnya.

## Consequences

- **Seorang AB2 dapat menjadi Master of Training sebuah TFI.** Ini
  konsekuensi yang disadari dan diterima, bukan celah yang terlewat. Jika
  kelak terasa salah di lapangan, perubahannya murah: satu klausa pada
  `typeFilter`.
- **Ini pelonggaran terhadap aturan yang sudah berjalan di production.**
  Jumlah Kader yang memenuhi syarat sebagai perangkat bertambah seketika saat
  perubahan ini tayang. Tidak ada data lama yang berubah; yang berubah adalah
  siapa yang muncul di combobox.
- `searchEligibleInstructorsGlobal` berhenti menjadi "global" dalam arti buta
  jenis. Namanya menyesatkan setelah perubahan ini dan sebaiknya ikut berganti.
- `CONTEXT.md` diamandemen: definisi **Perangkat** mendapat catatan bahwa
  syarat jenjangnya bergantung pada jenis Daurah.
