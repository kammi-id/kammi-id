# Kredensial Awal dan Reset Password Akun Kepengurusan

**Status:** ready-for-agent

Keputusan domain yang berlaku: `CONTEXT.md` membedakan **Akun Kepengurusan**
dari **Akun Kader**, dan ADR 0011 memberikan hak reset downward-only kepada
Root, BPH, dan BPW yang dapat membuka detail Struktur sasaran. Feature ini harus
bersifat additive dan tidak boleh mengubah fungsi production yang sudah ada.

## Problem Statement

Pembuatan Struktur saat ini membuat Struktur dan seluruh Akun Kepengurusannya
dalam satu transaksi, tetapi Server Action membuang plaintext password sebelum
UI dapat menampilkannya. Pengurus juga belum mempunyai permukaan untuk memilih
dan mereset Akun Kepengurusan tertentu ketika kredensialnya hilang.

Satu Struktur dapat memiliki beberapa Akun Kepengurusan aktual. Matriks bawaan
saat ini menghasilkan lima akun untuk PP, empat untuk PW/PD/PDLN, dan tiga untuk
PK, tetapi database tidak menjamin satu akun per kewenangan. Karena itu UI tidak
boleh merekonstruksi akun dari Jenjang, role, prefix, atau username.

## Solution

Setelah Struktur berhasil dibuat, tampilkan seluruh kredensial awal sekali saja
dalam dialog sukses. Pengurus dapat menyalin satu kredensial, menyalin semuanya,
atau mengunduh CSV. Plaintext tidak disimpan otomatis dan tidak dapat dibaca
kembali setelah dialog ditutup.

Detail Struktur mendapat aksi `Reset Password` tersendiri bagi Root, BPH, dan
BPW yang sudah boleh membuka detail tersebut. Dialog menampilkan Akun
Kepengurusan aktual dari database. Setelah memilih satu akun, pelaku memverifikasi
ulang passwordnya dan mengonfirmasi sasaran. Sistem menghasilkan password baru,
mencabut seluruh sesi akun sasaran, mencatat audit permanen, lalu menampilkan
kredensial baru sekali saja.

## User Stories

1. Sebagai pembuat Struktur, saya ingin menerima seluruh kredensial awal setelah
   pembuatan berhasil agar akun yang baru dibuat dapat didistribusikan.
2. Sebagai pembuat Struktur, saya ingin menyalin semua kredensial atau mengunduh
   CSV agar distribusi beberapa akun tidak memerlukan penyalinan manual berulang.
3. Sebagai Root, BPH, atau BPW, saya ingin memilih Akun Kepengurusan aktual pada
   detail Struktur turunan yang dapat saya buka agar satu akun dapat dipulihkan
   tanpa mengubah akun lain.
4. Sebagai pemegang Akun yang direset, saya ingin seluruh sesi lama dicabut agar
   pihak yang masih memegang sesi tidak tetap memiliki akses.
5. Sebagai operator, saya ingin reset yang berhasil meninggalkan audit permanen
   tanpa menyimpan password agar insiden dapat ditelusuri dengan aman.
6. Sebagai pengguna fungsi akun yang sudah ada, saya ingin login, pembuatan
   Member, bulk upload, reset Akun Kader, ganti password sendiri, dan penghapusan
   Member tetap berperilaku sama setelah feature ini dirilis.

## Domain and Authorization Decisions

- Sasaran hanya **Akun Kepengurusan** yang terikat langsung pada Struktur:
  BPH, BPK, BPW, atau Humas. Akun Root dan Akun Kader tidak pernah muncul di
  pemilih reset; kredensial Root hanya dapat tampil sebagai kredensial awal PP.
- Hak reset mengikuti akses baca detail Struktur bagi Root, BPH, dan BPW, lalu
  dipersempit menjadi downward-only. Struktur milik pelaku sendiri selalu ditolak,
  termasuk PP bagi Root.
- Contoh yang sah: BPD Jawa Barat dapat mereset Akun BPH, BPK, BPKOM, dan Humas
  aktual pada seluruh PD dan Komisariat di bawah PW Jawa Barat yang detailnya
  dapat dibuka.
- BPK, Humas, Akun Kader, sesi tanpa pengguna aktif, target saudara, target di
  luar Cakupan, Struktur Terhapus, dan target palsu ditolak tanpa membocorkan
  keberadaan sasaran.
- Struktur Non-Aktif tetap dapat menjadi sasaran. Hasil reset menjelaskan bahwa
  Akun Kepengurusannya baru dapat login setelah Struktur kembali Aktif.
- Daftar akun berasal dari baris aktual database dan setiap mutasi menargetkan
  `user.id`. Duplikat kewenangan ditampilkan sebagai akun terpisah dengan username
  masing-masing.
- Nama kewenangan mengikuti istilah organisasi: BPW pada PP, BPD pada PW, dan
  BPKOM pada PD/PDLN. PK tidak memiliki akun BPW bawaan.
- Hak reset memakai gate baru dan bukan perluasan `KestrukturanAction`,
  `strukturKemampuan`, atau hak kelola Kader.

## Credential Decisions

- Password selalu dihasilkan sistem; pengguna tidak memasukkan password baru
  untuk akun sasaran.
- Password disamarkan secara asali dan dapat ditampilkan atau disembunyikan.
- Hasil pembuatan Struktur menyediakan `Salin`, `Salin Semua`, dan `Download CSV`.
  Hasil reset satu akun hanya menyediakan salin username, password, atau keduanya.
- CSV hanya dibuat di browser setelah pembuatan Struktur. Field mengikuti
  RFC 4180, nilai berbahaya dinetralkan dari spreadsheet formula injection,
  filename disanitasi, dan Blob URL dicabut setelah download.
- Plaintext tidak dicatat di log, audit, cache, database, atau Credential Panel.
  Jika respons hilang atau dialog ditutup, Struktur tetap berhasil dibuat dan
  pengurus memakai flow reset untuk memperoleh password baru.
- Generator lama diperkuat dengan sumber acak kriptografis tanpa mengubah API,
  pemrosesan kamus, delimiter, panjang, atau charset. Kontrak yang dipertahankan
  adalah `word-[a-z0-9]{5}` ketika kamus tersedia dan 12 karakter `[a-z0-9]`
  ketika kamus tidak tersedia atau kosong.

## Security and Audit Decisions

- Reset memerlukan password pelaku yang masih berlaku. Verifikasi ulang ini
  hanya berlaku pada flow baru dan tidak mengubah login atau ganti password
  sendiri.
- Server Action menerima ID akun dan ID Struktur, tetapi tidak memercayai data
  UI. Ia mengulang pemeriksaan sesi, password pelaku, Cakupan, downward-only,
  Keadaan/visibilitas Struktur, role sasaran, dan hubungan akun–Struktur.
- Penggantian hash akun sasaran, penghapusan seluruh sesinya, dan insert satu
  audit event berjalan dalam satu transaksi baru. Kegagalan salah satu tahap
  menggagalkan semuanya.
- Audit bersifat application append-only dan menyimpan waktu, jenis kejadian,
  ID serta snapshot username pelaku, ID serta snapshot username/kewenangan
  sasaran, dan ID serta snapshot nama Struktur. Password dan hash tidak disimpan.
- Tabel audit tidak memakai foreign key ke akun atau Struktur agar tidak mengubah
  cascade/semantik penghapusan production. Tidak ada backfill, update/delete API,
  UI audit, atau masa kedaluwarsa sampai kebijakan retensi sistem ditetapkan.
- Hanya reset berhasil yang masuk tabel audit. Penolakan masuk structured
  operational log dengan pesan generik dan tanpa membocorkan keberadaan target.

## Compatibility Boundaries

- Jangan mengubah interface atau perilaku `updateUser`, `deleteSession`, login,
  validasi sesi, ganti password sendiri, reset Akun Kader, pembuatan Member, bulk
  upload, penghapusan Member, seed, atau cache/tag existing.
- Generator password dipakai empat flow runtime: pembuatan Struktur, pembuatan
  Member, bulk upload Kader, dan reset Akun Kader. Keempatnya wajib dikunci oleh
  regression test sebelum penggantian sumber acak diterima.
- Pembaca Akun Kepengurusan tidak memakai cache. Reset tidak menginvalidasi cache
  organisasi karena username, role, dan hubungan Struktur tidak berubah.
- Aksi reset dirender terpisah dari `BranchDetailActions`; komponen lama tetap
  mengikuti matriks aksi kestrukturan dan tidak diubah untuk memberi BPH aksi baru.
- Tidak ada password lama yang dimigrasikan atau diubah. Perubahan generator
  hanya memengaruhi password yang dibuat setelah deployment.

## Data and Migration Decisions

- Migrasi hanya membuat satu tabel audit baru; tidak mengubah atau menulis ulang
  tabel `user`, `organization`, `member`, maupun `session` dan tidak melakukan
  backfill.
- Jangan menambah index `session.user_id` secara spekulatif. Ukur volume dan
  rencana query production lebih dahulu; bila diperlukan, index menjadi migrasi
  terpisah dengan rencana lock tersendiri.
- Migrasi harus direhearsal pada staging yang membawa salinan data production,
  lalu dijalankan manual di production sebelum kode baru dideploy, sesuai ADR
  0008 dan ADR 0009.
- Preflight production minimal memeriksa versi PostgreSQL, migration journal,
  backup/snapshot yang dapat dipulihkan, jumlah sesi, dan rencana query pencabutan
  sesi. Rollback kode tidak menghapus tabel atau catatan audit.

## User Experience Decisions

- Dialog kredensial awal tidak menutup otomatis. Ia menjelaskan bahwa password
  hanya tersedia pada saat itu dan meminta pengguna menutupnya secara sadar.
- Dialog reset menampilkan kewenangan kontekstual dan username setiap akun aktual.
  Konfirmasi menyebut username, Struktur, serta konsekuensi pencabutan sesi.
- Hasil reset menampilkan password sekali saja dan menyediakan aksi salin. Untuk
  Struktur Non-Aktif, hasil juga menjelaskan batas login yang masih berlaku.
- Empty state menjelaskan bila Struktur tidak mempunyai Akun Kepengurusan aktual.
  Kegagalan otorisasi atau target yang berubah memakai hasil generik dan tidak
  mengungkap keberadaan data di luar Cakupan.

## Testing and Release Gates

- Generator: exact charset/panjang untuk mode kamus dan fallback; API synchronous
  tetap; pemilihan kata dan suffix memakai RNG kriptografis; keempat konsumen lama
  mempertahankan username, jumlah akun, return shape, dan password yang dapat
  diverifikasi terhadap hash tersimpan.
- Authorization: Root/BPH/BPW pada turunan sah; Struktur sendiri, saudara, luar
  Cakupan, Terhapus, palsu, BPK, Humas, Akun Kader, dan tanpa sesi ditolak;
  Non-Aktif sah dengan pesan yang tepat.
- Target integrity: role allowlist, hubungan akun–Struktur, duplikat akun, dan
  perubahan target antara read dan write diverifikasi berdasarkan ID aktual.
- Reauthentication: password pelaku benar berhasil; salah/kosong menghasilkan
  nol perubahan.
- Atomicity: failure injection pada update hash, revoke sesi, atau insert audit
  me-roll back seluruh transaksi. Sukses hanya mengubah akun terpilih, mencabut
  seluruh dan hanya sesi sasaran, mempertahankan sesi pelaku, serta menulis tepat
  satu audit event.
- Creation UX: action hanya mengembalikan seluruh kredensial setelah transaksi
  sukses; kegagalan unique/DB tidak mengembalikan plaintext; copy, masking, CSV,
  sanitasi formula, dan lifecycle Blob diuji.
- Regression: login, validasi Keadaan Struktur, ganti password sendiri, reset
  Akun Kader, create Member, bulk upload, delete Member, seed, dan aksi detail
  Struktur existing tetap lulus tanpa perubahan perilaku.
- Release tertahan sampai migrasi lulus dari database kosong dan upgrade staging,
  regression suite lulus pada salinan data production, preflight production
  selesai, serta pemeriksaan Next.js DevTools `get_errors` kosong.

## Out of Scope

- Reset Akun Kader atau perubahan flow reset Akun Kader yang sudah ada.
- Reset Akun Kepengurusan Struktur pelaku sendiri atau Akun Root di PP.
- Membuat halaman detail top-level/Struktur sendiri.
- Mengubah username, kewenangan, jumlah akun bawaan, atau matriks aksi Struktur.
- Menampilkan UI audit, mencatat percobaan gagal ke database audit, atau menetapkan
  kebijakan retensi global.
- Menambah index production tanpa pengukuran, mengubah schema lama, backfill,
  atau menyimpan plaintext agar dapat dibaca kembali.

## Further Notes

- Kepastian kompatibilitas berasal dari audit codebase; kepastian deployment baru
  sah setelah preflight dan rehearsal production-like. Release gate tersebut
  adalah bagian dari requirement, bukan pekerjaan opsional setelah implementasi.
- Penggantian `Math.random` menghilangkan sumber acak yang dapat diprediksi tetapi
  sengaja tidak menambah entropy format password lama. Perubahan panjang/format
  dan rate limiting login adalah hardening terpisah karena dapat mengubah perilaku
  production existing.
- Worktree telah memiliki perubahan tidak terkait pada komponen detail Struktur.
  Implementasi tidak boleh menimpa atau menyerap perubahan tersebut.
