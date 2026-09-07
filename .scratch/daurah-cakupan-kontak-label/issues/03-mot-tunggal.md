# 03 — Master of Training harus tunggal per Daurah

**What to build:** batasi satu Daurah paling banyak satu Instruktur ber-peran
`master`, ditegakkan di basis data dan di aksi.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## Keadaannya

`trainingInstructors` (`db/schema/training.sql.ts`) berkunci
`(trainingId, memberId)`. Itu mencegah satu orang memegang dua peran di satu
Daurah, tapi **tidak** mencegah dua orang sama-sama `master`.
`addInstructorAction` menerima `role: 'master'` tanpa memeriksa apakah kursinya
sudah terisi, dan `createTrainingAction` selalu menambahkan satu MoT saat
Daurah lahir.

Aturan organisasinya: satu Daurah, satu Master of Training.

## Yang dikerjakan

Unique index parsial `(training_id) WHERE role = 'master'`. Aturan yang tinggal
di aplikasi saja akan dilanggar oleh jalur yang lupa memeriksanya.

**Pilihan MoT kedua ditolak, bukan menggantikan yang pertama.** Penggantian
diam-diam menghapus catatan tanpa operator sadar. Pesan penolakannya menyebut
siapa MoT yang sekarang, supaya operator tahu apa yang harus ia lepas dulu.
Melepas MoT lama lewat `removeInstructorAction` tetap tersedia.

**Data lama:** staging per 7 September 2026 tidak punya satu pun Daurah
ber-MoT ganda, jadi index-nya terpasang tanpa perlu membersihkan apa pun.
Production dihitung ulang **sebelum migrasi dijalankan** — kalau ternyata ada,
duplikatnya diturunkan jadi `assistant_master`, tapi daftarnya dilaporkan dulu
ke pengambil keputusan: tabel ini tidak menyimpan waktu, jadi "MoT yang
terlama" tidak punya arti yang bisa dibaca dari data.

Migrasi dijalankan entrypoint container (ADR 0008) dan menyentuh production —
minta izin sebelum menjalankannya.

## Acceptance

- [ ] Migrasi memasang unique index parsial pada `role = 'master'`
- [ ] `addInstructorAction` menolak MoT kedua dengan pesan yang menyebut MoT
      yang sedang menjabat
- [ ] Melepas MoT lalu menunjuk yang baru tetap berhasil
- [ ] Peran lain tetap boleh diisi lebih dari satu orang
- [ ] Hitungan MoT ganda di production diambil dan dilaporkan sebelum migrasi
- [ ] Ada tes untuk penolakan MoT kedua
- [ ] `bun run check:types` lolos
