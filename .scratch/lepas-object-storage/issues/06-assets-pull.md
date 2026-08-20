# 06 — `bun run assets:pull`

**What to build:** Satu perintah yang menarik volume gambar production ke mesin
lokal, duduk sebelahan dengan `db:reset` dan `db:seed`.

**Blocked by:** 04

**Status:** ready-for-agent

Inilah tiket yang sebenarnya menjawab keluhan yang melahirkan pekerjaan ini.
Tanpa ini, gambar tetap tidak pernah ikut berpindah — hanya berganti perkakas.

**Menarik dari volume, bukan dari RustFS.** RustFS memang memegang salinan dan
diakses lewat HTTPS, tapi memakainya berarti mengembalikan `S3_ACCESS_KEY` dan
`S3_SECRET_KEY` ke `.env.local` — persis yang baru dicabut — dan yang terbawa
adalah hasil sinkron terakhir, bukan keadaan sebenarnya. Backup adalah backup,
bukan pintu mengambil data sehari-hari.

Named volume tidak bisa di-`rsync` langsung tanpa root, tapi ini bisa:

```
ssh <host> 'docker run --rm -v kammi-uploads:/d -w /d alpine tar cz .' \
  | tar xz -C .uploads
```

Satu perintah, nol kredensial S3, tidak menyentuh RustFS.

**Menariknya opsional, dan itu memang maunya.** Tiket 01 membuat berkas hilang
berujung placeholder, jadi lingkungan pengembang tetap berfungsi tanpa 174 MB
itu. Tarik hanya saat memang sedang mengurus tampilan.

Tujuan tarikan (`.uploads`) masuk `.gitignore`. Tulis pemakaiannya di README di
bagian yang sama dengan perintah basis data — kalau ritualnya tidak
terdokumentasi di tempat orang sudah terbiasa melihat, ia akan bernasib sama
dengan ritual yang lama.
