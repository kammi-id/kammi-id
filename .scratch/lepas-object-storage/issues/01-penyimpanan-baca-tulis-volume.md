# 01 — Lapisan penyimpanan baca-tulis volume, bukan S3

**What to build:** `src/lib/api/storage.ts` berhenti memakai `Bun.S3Client` dan
beralih ke filesystem lewat `Bun.file`/`Bun.write`. `/api/images/[...key]`
berhenti presign-lalu-fetch dan langsung membaca dari disk.

**Blocked by:** None — can start immediately.

**Status:** done

Akar direktori dibaca dari `UPLOADS_DIR`, default `./.uploads` saat
pengembangan. Di container nilainya `/data/uploads`. Jangan hardcode — mesin
pengembang macOS tidak punya `/data`.

**Kunci adalah path relatif, dan itu bahaya baru.** Di S3 `uploads/a/b.jpg`
cuma string. Di filesystem ia path sungguhan, dan `key` datang dari URL. Route
handler wajib menolak apa pun yang keluar dari akar setelah resolusi — resolve
path lalu pastikan hasilnya masih berada di dalam akar, bukan sekadar menyaring
`..` sebagai teks.

**Berkas hilang mengembalikan placeholder dengan status 200, bukan 404.** Ini
inti dari ADR 0006: lingkungan pengembang sengaja boleh tidak memegang 174 MB
itu. `next/image` yang menerima 404 akan gagal me-render, jadi 404 berarti
halaman rusak — persis penyakit yang sedang diobati. Placeholder-nya berkas
statis yang ikut di-bundle, bukan berkas di volume.

`getSignedUrl` dihapus dari `storage` — tidak ada lagi yang bisa ditandatangani.
Pemanggil satu-satunya yang tersisa ditangani tiket 03.

Header `Cache-Control: public, max-age=86400` yang sudah ada dipertahankan.
Placeholder **tidak boleh** ikut cache selama itu — kalau berkasnya menyusul
datang, cache sehari akan menyembunyikannya.

## Comments

Dua hal yang menyentuh tiket lain:

- **`resolveUrl` di `src/app/(main)/_data/site-settings.ts` ikut berubah.** Ia
  satu-satunya pemanggil `storage.getSignedUrl` yang tersisa, jadi menghapus
  metode itu memaksa perubahan di sini juga; ia sekarang mengembalikan
  `/api/images/<key>`. Penyatuannya dengan `resolveSiteImage` — dan pemulihan
  TTL `_cachedTentangSettings` — tetap milik tiket 03.
- **`UPLOADS_DIR` tidak masuk `src/env.ts`.** Ia dibaca langsung dari
  `process.env` di `src/lib/api/storage.ts`, dan dibaca ulang tiap panggilan.
  `bun test` berbagi satu module registry antar-berkas, jadi konstanta env yang
  dibekukan saat impor akan bernilai apa pun yang dimuat berkas tes pertama —
  persis yang membuat `tests/lib/utils/site-image.test.ts` runtuh saat
  `storage.test.ts` memuat `~/env` lebih dulu. Tiket 04 karena itu tidak akan
  menemukan `UPLOADS_DIR` di `src/env.ts`; setelah lima `S3_*` dicabut berkas
  itu kosong.
