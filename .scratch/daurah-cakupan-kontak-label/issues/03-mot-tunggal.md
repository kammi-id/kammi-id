# 03 — Master of Training harus tunggal per Daurah

**What to build:** batasi satu Daurah paling banyak satu Instruktur ber-peran
`master`, ditegakkan di basis data dan di aksi.

**Blocked by:** None — can start immediately.

**Status:** done — dikerjakan 2026-09-07, lihat Comments

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

- [x] Migrasi memasang unique index parsial pada `role = 'master'`
- [x] `addInstructorAction` menolak MoT kedua dengan pesan yang menyebut MoT
      yang sedang menjabat
- [x] Melepas MoT lalu menunjuk yang baru tetap berhasil
- [x] Peran lain tetap boleh diisi lebih dari satu orang
- [ ] Hitungan MoT ganda di production diambil dan dilaporkan sebelum migrasi
      — **belum**, butuh akses production; migrasinya sudah digenerate tapi
      **belum dijalankan** ke database manapun selain test. Lihat Comments.
- [x] Ada tes untuk penolakan MoT kedua
- [x] `bun run check:types` lolos

## Comments

### 2026-09-07 — implementasi

Dikerjakan lewat `/implement`, paralel dengan tiket 04, di worktree terpisah,
lalu digabung dengan merge commit `b872434` ke `dev-20260104`.

- Unique index parsial `training_instructors_master_unique` di
  `src/db/schema/training.sql.ts`; migrasi digenerate di
  `src/db/__migrations/20260907072615_stiff_rattler/` tapi **belum
  diterapkan** ke database manapun di luar `TEST_DATABASE_URL` — menunggu
  hitungan duplikat production dan izin operator sebelum dijalankan lewat
  entrypoint container (ADR 0008).
- `addInstructorAction` menolak percobaan kedua sebelum insert, dan sebagai
  jaring pengaman menangkap pelanggaran index (`23505`) lewat
  `isMasterConflict` (`src/lib/daurah/master-conflict.ts`, meniru pola
  `isSlugConflict`) — keduanya memakai pesan yang sama, menyebut nama MoT
  yang sedang menjabat.
- Review Standards + Spec (dua sub-agent paralel) lolos bersih; satu catatan
  gaya minor (duplikasi parsing `rawData` di catch block) sudah diperbaiki
  mengikuti pola `updateTrainingAction` di berkas yang sama.
- Temuan sampingan, tidak digarap (di luar cakupan): "primary key" komposit
  `(trainingId, memberId)` di `trainingInstructors` ternyata bukan
  constraint asli — bentuknya lolos type-check tapi tidak ada PK/unique di
  database. Layak jadi tiket terpisah.
