# 06 — Regenerasi kredensial massal untuk Kader yang sudah terdaftar

**What to build:** aksi BPK yang menerbitkan ulang password seluruh Akun Kader di
bawah satu Struktur sasaran, keluar sebagai CSV, dijaga tiga lapis konfirmasi.

**Blocked by:** 01 — ia memakai `deleteSessionsByUser` dan
`requireKaderisasiAccess`.

**Status:** ready-for-agent

## Mengapa ada

Tiket 03 memperbaiki Kader **baru**. Puluhan ribu Kader yang sudah terdaftar
tetap memegang password yang tidak pernah ditampilkan kepada siapa pun. Satu-satunya
jalan hari ini adalah tombol Reset Password di halaman profil, satu Kader satu
klik. Seorang BPK PK yang membina dua ratus Kader tidak akan menempuhnya.

## Sasarannya adalah satu Struktur, bukan "seluruh Cakupan"

Aksinya menerima **Struktur sasaran di dalam Cakupan pemanggil, termasuk Struktur
pemanggilnya sendiri**, lalu memperbarui seluruh Akun Kader di Struktur itu dan
turunannya.

Bedanya dengan "seluruh Cakupan" halus tapi penting. Bagi BPK PP, "seluruh
Cakupan" berarti setiap Kader di Indonesia — satu tombol yang mematikan setiap
login nasional sekaligus, tanpa jalan mundur, sebab password lama sudah hilang.
Dengan pemilih sasaran, BPK PP **masih bisa** melakukannya dengan memilih PP,
tetapi harus memilihnya. Dan BPK PD mendapat yang lebih sering ia butuhkan:
satu Komisariat saja.

## Tiga lapis konfirmasi

Berurutan, dan ketiganya wajib:

1. **Peringatan yang menyebut jumlahnya** — "Tindakan ini akan mereset password
   1.204 Kader dan mengeluarkan mereka dari seluruh sesi yang sedang berjalan."
   Angkanya dihitung, bukan diperkirakan.
2. **Kata konfirmasi yang diketik** — `code` Struktur sasaran, bukan kata umum
   seperti "HAPUS". Mengetikkan kode Struktur berarti membaca sasarannya.
3. **Password pengurus yang menekannya** — diverifikasi lewat
   `readUserCredential` + `Bun.password.verify`, pola yang sudah dipakai
   `updatePasswordAction`.

## Sisanya

- **Kewenangan:** Root dan BPK, sasaran di dalam Cakupan
  (`requireKaderisasiAccess`). BPH tidak — ia memantau dan tidak memegang hak
  tulis apa pun di Kaderisasi.
- **Hanya Akun Kader.** Akun Kepengurusan tidak ikut; mereset kredensial
  pengurus punya jalurnya sendiri
  (`requireOrganizationAccountResetAccess`, ADR 0011).
- **Sesi diputus** untuk setiap Akun yang ter-reset (`deleteSessionsByUser`).
- **Keluarannya CSV unduhan** — `xlsx` sudah jadi dependensi. Kolomnya
  `Nama, NIA, Password`, sebangun dengan `users.csv` yang sudah ada.
- **Tambahkan polanya ke `.gitignore` sebelum fitur ini tayang**, bukan sesudah
  berkas pertamanya ada. `users.csv` sudah ada di sana (baris 52); ini pola yang
  sama dengan taruhan yang lebih besar.
- **Catat lewat `getLogger`**: pelaku, Struktur sasaran, jumlah baris. Ini aksi
  paling berkonsekuensi di sistem ini dan satu-satunya yang tidak bisa dibatalkan.

Alasan CSV plaintext ada di ADR 0028 dan tidak perlu diulang di dalam kode.

## Uji

- BPK dengan sasaran di luar Cakupan → ditolak.
- BPH → ditolak.
- Password pengurus salah → ditolak, dan **tidak ada satu baris pun berubah**.
- Berhasil → setiap `password_hash` di bawah sasaran berubah, setiap sesi Akun
  itu hilang, Akun Kepengurusan tidak tersentuh.
