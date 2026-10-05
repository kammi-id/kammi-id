# Application maintenance

Artefak ini adalah halaman statis untuk write freeze production. Ia hanya
menjalankan Nginx dan empat berkas yang ada di direktori ini: tidak ada
PostgreSQL, RustFS/S3, secret KAMMI ID, volume, atau layanan eksternal.

## Build dan verifikasi lokal

```sh
docker build --pull=false --tag kammi-id-maintenance:local maintenance
bun run test:maintenance
```

`test:maintenance` menjalankan container tanpa environment aplikasi, kemudian
memeriksa `GET /healthz`, apex `kammi.id`, dan sebuah Host tenant pada path
arbitrer. Semua path `GET` selain health check menyajikan halaman maintenance.

## Provisioning Dokploy manual

1. Bangun dan push image release, lalu catat digest yang dihasilkan registry.
2. Buat Application maintenance terpisah dengan image persis
   `registry/repository@sha256:<digest>` dan port `8080`.
3. Set health check HTTP ke `/healthz`. Application ini tidak memerlukan
   environment variable, volume, database, atau service dependency.
4. Jangan menambahkan domain atau Host rule production saat provisioning.
   Saat write freeze dimulai, lepaskan apex, `www`, dan wildcard tenant dari
   Application lama terlebih dahulu, lalu pasang ketiganya secara manual ke
   Application maintenance. Jangan memasang rule yang sama pada dua
   Application.
5. Pertahankan route exact `assets.kammi.id` pada RustFS; ia tidak pernah
   dipasang ke Application maintenance.

Image final harus selalu dipakai dengan digest, bukan tag. Base image artefak
ini juga dipatok ke digest agar build tidak berubah saat tag Nginx bergerak.
