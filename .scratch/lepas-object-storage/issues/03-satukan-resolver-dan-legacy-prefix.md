# 03 — Satu resolver, `LEGACY_ASSET_PREFIX` menggantikan env S3

**What to build:** Dua resolver yang berbeda kelakuan disatukan, dan
ketergantungan `resolveSiteImage` pada `S3_ENDPOINT`/`S3_BUCKET_NAME` diganti
konstanta beku.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Ada dua resolver hari ini, dan hanya satu yang lewat proxy.**
`src/lib/utils/site-image.ts` mengarah ke `/api/images/`, tetapi `resolveUrl`
lokal di `src/app/(main)/_data/site-settings.ts` **masih presign sungguhan**.
Gambar Pengaturan Situs karena itu tidak pernah melewati proxy. Satukan: buang
`resolveUrl`, pakai `resolveSiteImage`.

**`LEGACY_ASSET_PREFIX` menggantikan penyusunan prefix dari env.** Sebagian
nilai lama di DB berbentuk URL penuh `https://assets.kammi.id/kammiid/<key>`,
dan `site-image.ts` mengupasnya memakai `S3_ENDPOINT` + `S3_BUCKET_NAME`. Begitu
env itu dicabut (tiket 04) prefix-nya menyusut jadi `"/"`, cabangnya tidak
pernah kena, dan URL lama lolos apa adanya ke host yang tidak lagi melayani —
**gambar mati diam-diam, dan hanya di baris lama**. Ganti dengan satu konstanta
beku bernama `LEGACY_`, yang namanya sendiri menjelaskan kenapa ia ada.

**`_cachedTentangSettings` boleh kembali ke TTL normal.** TTL-nya sengaja
dipendekkan karena presigned URL kedaluwarsa. Alasan itu lenyap.

**Sepuluh flag `unoptimized` TETAP.** Spec lama 2026-06-09 menyatakan flag itu
akan selalu `false` dan bisa dihapus — itu keliru. `resolveSiteImage`
mengembalikan URL eksternal apa adanya, dan setelah `remotePatterns` dicabut
(tiket 04) `next/image` **melempar error** untuk host tak terdaftar, bukan
sekadar melewatkan optimisasi. Flag itu katup pengaman untuk data nyasar.
Jangan "merapikannya".

`tests/lib/utils/site-image.test.ts` menyetel env S3 di `beforeAll`; sesuaikan
ke konstanta baru. Perilaku yang diuji tidak berubah.
