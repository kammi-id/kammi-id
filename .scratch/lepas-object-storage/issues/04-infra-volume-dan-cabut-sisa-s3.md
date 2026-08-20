# 04 — Volume, izin, dan pencabutan sisa S3

**What to build:** Volume `kammi-uploads` masuk ke konfigurasi deploy dengan
izin yang ditegakkan saat start, dan seluruh jejak S3 dicabut dari konfigurasi.

**Blocked by:** 01, 03

**Status:** ready-for-human — butuh akses host dan panel Dokploy

**Volume dan izinnya.** Aplikasi berjalan sebagai uid 1001 (`nextjs`, lihat
`Dockerfile`); volume baru dimiliki root, jadi tulis akan `EACCES`. Pakai pola
yang sudah dipakai host ini untuk RustFS — init container ber-`chown` dengan
`depends_on: condition: service_completed_successfully`:

```yaml
uploads_perms:
  image: alpine
  user: root
  volumes:
    - kammi-uploads:/data/uploads
  command: chown -R 1001:1001 /data/uploads
```

Named volume, bukan bind mount — mengikuti `rustfs-data`/`rustfs-logs` yang
sudah ada, dan itu yang disasar backup Dokploy.

**Yang dicabut:**

- `src/env.ts` dan `.env.local` — lima `S3_*` keluar. `UPLOADS_DIR` **tidak**
  masuk `src/env.ts`: tiket 01 membacanya langsung dari `process.env` di
  `src/lib/api/storage.ts` (alasannya di Comments tiket 01), jadi setelah lima
  `S3_*` dicabut `src/env.ts` kosong dan berkasnya ikut hilang. Yang tetap perlu
  disetel adalah `UPLOADS_DIR` di `.env.local` dan di container.
- `docker-compose.yml` — service `storage` (MinIO AIStor berlisensi), volume
  `storage_data`, dan `minio.license` yang memang tidak pernah ada
- `next.config.ts` — `remotePatterns: assets.kammi.id`. Host-nya berhenti jadi
  origin, dan izin ke host yang tidak melayani adalah janji kosong.
  `localPatterns` dan `qualities` **tetap**.

**Backup dikonfigurasi di panel Dokploy, bukan di aplikasi.** Volume
`kammi-uploads` disinkronkan berkala ke RustFS. Jangan menulis ganda dari dalam
aplikasi — itu menyeret `Bun.S3Client` kembali ke `src/` dan membatalkan separuh
ADR 0006.

Verifikasi sebelum menutup tiket: `bun run check:types` bersih, dan tidak ada
lagi kecocokan untuk `S3_`, `minio`, atau `presign` di `src/`.
