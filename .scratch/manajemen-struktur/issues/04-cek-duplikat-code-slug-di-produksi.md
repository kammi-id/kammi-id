# 04 — Cek duplikat `code`/`slug` di data nyata

**Type:** task
**Status:** resolved
**Blocked by:** —

## Question

Tidak ada yang bisa diputuskan soal unique constraint sebelum diketahui
apakah datanya **sudah** melanggarnya. Kalau ada duplikat hari ini, memasang
constraint bukan lagi `ALTER TABLE` melainkan pembersihan data lebih dulu —
dan pembersihan `code` menyentuh Nomor Induk Anggota yang sudah tercetak.

Kerjanya: hitung baris `organization` yang berbagi `code` yang sama, dan yang
berbagi `slug` yang sama. Untuk tiap duplikat yang ketemu, catat Struktur mana
saja, Jenjangnya, dan berapa Member yang terdaftar di masing-masing.

**Butuh izin pengguna lebih dulu, tanpa kecuali.** `DATABASE_URL` yang bukan
localhost menunjuk ke produksi. Jangan jalankan skrip apa pun terhadapnya
sebelum bertanya, dan jangan mengubah apa pun — ini pembacaan.

Jawabannya mencatat: jumlah duplikat `code`, jumlah duplikat `slug`, dan
kalau ada, daftar barisnya. Kalau nol dua-duanya, katakan itu terang-terangan
— tiket 03 dan langkah migrasinya jadi jauh lebih ringan, dan itu fakta yang
tiket berikutnya akan andalkan.

## Siap dijalankan

Skripnya sudah ditulis: `.scratch/manajemen-struktur/check-duplicates.ts`. Ia
murni `SELECT` dan sengaja lewat `requireDatabaseConsent` yang sama dengan
`db:migrate`, jadi ia bukan pintu belakang yang melewati guard.

```
bun .scratch/manajemen-struktur/check-duplicates.ts
```

Jalankan dari terminal interaktif dan **tanpa** `DB_GUARD_ACK`, supaya guard
tetap meminta nama basis data diketik. Pengguna memilih menjalankannya sendiri;
agen tidak menyentuh produksi untuk tiket ini.

Ia ikut menghitung duplikat **`code_slug`** — kolom turunan
`replace(lower(code), '.', '-')` — karena dua `code` yang berbeda bisa
menghasilkan `code_slug` yang sama. Itu pertanyaan nomor 3 di tiket 03, dan
sekalian dijawab dari data nyata di sini.

Member dihitung **terpisah** antara yang hidup dan yang sudah dihapus lunak.
ADR 0004 bertumpu pada fakta bahwa Member terhapus masih memegang Nomor Induk
Anggota yang tersusun dari `code` itu, jadi angka itu bukan hiasan.

Buang skripnya setelah tiket ini ditutup.

## Answer

**Pertanyaan aslinya tidak terjawab, dan tidak akan pernah terjawab lewat tiket
ini.** Itu bukan kegagalan menjalankan skrip — itu batasan tetap yang baru
ketahuan hari ini, dan ia mengubah bentuk tiketnya.

### Apa yang terjadi

Percobaan pertama mati di query **pertama** dengan
`relation "organization" does not exist` — bukan soal duplikat sama sekali.
Penelusurannya membuka dua fakta berurutan:

1. `DATABASE_URL` di `.env.local` menunjuk ke **staging**, bukan produksi. Itu
   satu-satunya berkas env di repo; **kredensial produksi tidak ada di sini.**
2. Pengguna menolak memberi akses ke basis data produksi — sadar, dengan alasan
   risiko (7 Agustus 2026). Sebagai gantinya disediakan basis data remote yang
   meniru bentuk produksi, tapi **baru dan kosong**. Itu sebab galatnya:
   belum pernah dimigrasi.

Menjalankan skripnya di sana menghasilkan "nol duplikat" yang **benar secara
teknis dan hampa secara makna**. Menutup tiket dengan angka itu adalah persis
kegagalan yang tiket ini dibuat untuk mencegah: tiket 03 menulis migrasi dengan
asumsi datanya bersih, lalu migrasinya kena produksi yang tidak pernah dilihat
siapa pun.

Penolakan akses itu **batasan tetap peta ini**, bukan penghalang sementara. Jadi
tiket ini tidak ditunda — ia berubah bentuk.

### Bentuk barunya

Dari **"lihat datanya sekali, lalu tulis migrasinya"** menjadi **"putuskan
bagaimana migrasinya berperilaku ketika datanya tidak bisa dilihat."**

Ini bukan sekadar menyerah dan menyebutnya keputusan. Inspeksi sekali pakai
memang lebih lemah dari yang tiket 03 kira, **bahkan seandainya akses produksi
diberikan**: jendela antara inspeksi dan deploy bisa berhari-hari, dan
pendaftaran Struktur baru jalan terus di dalamnya. Fakta yang dibeli inspeksi
sudah basi sebelum dipakai. Pemeriksaan yang menempel pada momen migrasi lebih
kuat daripada pemeriksaan yang menempel pada momen perencanaan.

### Fakta 1 — kegagalannya aman; yang rusak cuma deploy

`CREATE UNIQUE INDEX` atas tabel yang sudah berisi duplikat **gagal**, dan tiket
03 sudah membuktikan tangan bahwa runner Drizzle membungkus seluruh migrasi
tertunda dalam satu transaksi (`drizzle-orm/pg-core/async/session.js:128`). Jadi
kegagalannya **rollback bersih**: nol baris berubah, nol indeks setengah jadi.
Indeks invalid yang tertinggal itu risiko khas `CONCURRENTLY`, dan 03 sudah
membuktikan `CONCURRENTLY` mustahil dinyatakan di sini sama sekali.

Konsekuensinya: **tiket 04 bukan penghalang keselamatan, ia penghalang
keterdugaan deploy.** Tiket 03 menaikkannya jadi "penghalang keras — migrasi
constraint tidak boleh ditulis sebelum 04 dijalankan". **Itu diamandemen.**
Migrasinya boleh ditulis sekarang; yang tidak boleh adalah **menjalankannya
tanpa pra-terbang**. Yang dipertaruhkan kalau lalai bukan data rusak, melainkan
migrasi meledak di tengah deploy dan orang yang memegangnya harus mentriase
data yang belum pernah ia lihat, di bawah tekanan.

### Fakta 2 — `slug` dan `code` tidak setara, dan di situ isi keputusannya

Dua constraint yang direncanakan tiket 03 punya biaya perbaikan yang **beda
kelas** kalau pra-terbang menemukan pelanggaran:

**`slug` duplikat — murah, mekanis, boleh diperbaiki tanpa rapat.**
`slug` cuma URL, dan charting sudah memutuskan `slug` dibebaskan setelah
penghapusan. Yang kalah tinggal diganti namanya. Nol dampak ke Nomor Induk
Anggota, nol dampak ke apa pun yang tercetak.

**`code` duplikat — tidak bisa diperbaiki secara mekanis, titik.**
ADR 0004 mengunci `code` selamanya. Menggantinya untuk memuaskan constraint
justru melanggar ADR yang melahirkan constraint itu.

Satu koreksi faktual yang perlu tercatat, karena mudah salah tebak: **duplikat
`code` TIDAK membuat dua Kader punya Nomor Induk yang sama.**
`generateRegisterNumber` mencari urutan terakhir dengan
`ilike(member.registerNumber, ${prefix}%)` **tanpa filter organisasi**
(`src/lib/utils/member.ts:80`), jadi dua Struktur bercode kembar berbagi satu
deret dan tetap menerima nomor yang berbeda. Yang rusak bukan keunikan nomornya
— yang rusak adalah **NIA berhenti mengidentifikasi Struktur**. Dua Kader dari
dua Struktur berbeda memikul prefiks yang identik, dan tidak ada cara membaca
balik dari nomor ke Struktur. Itu persis kemampuan yang ADR 0004 kunci `code`
untuk menjaganya.

Efek samping kecil tapi nyata: berbagi satu deret membuat **tembok 1000** (lihat
Out of scope) tercapai kira-kira dua kali lebih cepat untuk prefiks itu.

Jadi `code` duplikat bukan pekerjaan migrasi. Ia **insiden data yang menuntut
putusan manusia** — Struktur mana yang keliru, dan apa yang terjadi pada Kader
yang sudah memegang nomor dari kode itu.

### Fakta 3 — dua constraint itu berangkat terpisah

Konsekuensi langsung dari Fakta 2: **jangan satukan keduanya dalam satu
migrasi.** Kalau digabung, satu `code` duplikat yang butuh putusan manusia ikut
menyandera constraint `slug` yang perbaikannya sepele. Dua migrasi, dua nasib.

### Keluaran tiket ini

1. **Pra-terbang wajib**, dijalankan terhadap basis data yang akan dimigrasi,
   **sesaat sebelum** migrasi — bukan sekali saat perencanaan. Skripnya sudah
   ada dan sudah dirombak agar mengorientasi diri lebih dulu (versi server,
   `search_path`, skema mana yang memuat `organization`) sehingga basis data
   kosong dijawab dengan kalimat, bukan galat mentah. Ia **naik status dari
   buangan jadi artefak** — instruksi "buang skripnya" di atas dicabut.

   Tempatnya `src/scripts/`, bersebelahan dengan `db-guard.ts`, `reset.ts`, dan
   `seed.ts`, dengan skrip `package.json`-nya sendiri. **Pemindahan itu kerja
   implementasi, bukan kerja peta ini** — peta ini tidak menyentuh kode; tiket
   09 yang membawanya ke spec.

2. **Pohon keputusan** yang menempel pada pra-terbang:

   | Temuan | Putusan |
   | --- | --- |
   | nol duplikat | jalan; kedua migrasi berangkat |
   | `slug` duplikat saja | perbaiki mekanis (ganti nama yang kalah), lalu jalan |
   | `code` duplikat | **berhenti.** Kirim migrasi `slug` saja; `code` menunggu putusan manusia |
   | `code_slug` duplikat | abaikan — 03 sudah memutuskan ia tidak dipasangi constraint |

3. **Migrasi dipecah dua**, per Fakta 3.

### Yang tetap tidak diketahui

**Berapa duplikat yang ada di produksi.** Nol pemeriksaan pernah dilakukan di
sana, dan tiket ini tidak berpura-pura sebaliknya. Yang dibeli tiket ini bukan
angka itu, melainkan jaminan bahwa angka itu **pasti dibaca oleh orang yang
menjalankan migrasinya**, pada saat satu-satunya yang membuatnya benar.

### Efek samping: ada target gladi bersih sekarang

Basis data remote yang kosong itu **bukan tanpa guna** — ia justru target yang
tepat untuk melatih migrasi peta ini sampai bersih sebelum menyentuh produksi,
dan untuk menjawab langsung apakah servernya mendukung `uuidv7()` (PG 18+).
Itu menyenggol ganjalan CI `postgres:16` yang tercatat di kabut. Dicatat di
kabut peta, bukan dikerjakan di sini.
