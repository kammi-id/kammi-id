# 03 — Application maintenance statis

**What to build:** Artefak Application maintenance yang kecil dan immutable
dapat mengambil trafik production selama write freeze tanpa bergantung pada
PostgreSQL, RustFS, atau secret aplikasi utama.

**Blocked by:** None — can start immediately.

**Status:** done — `b0e5ee6`

- [x] Maintenance page menjelaskan bahwa layanan sementara tidak tersedia dan
      tidak menjanjikan waktu pulih yang tidak diketahui.
- [x] Halaman memakai HTML semantik, dapat dibaca screen reader, dan tetap jelas
      tanpa JavaScript.
- [x] Artefak menjawab HTTP sukses untuk apex, `www`, dan Host tenant pada path
      apa pun yang mungkin dibuka pengguna selama maintenance.
- [x] Artefak tidak mempunyai koneksi PostgreSQL, S3/RustFS, secret KAMMI ID,
      atau dependency layanan eksternal.
- [x] Artefak dapat dibangun dan dipatok ke digest immutable.
- [x] Health check maintenance tetap sukses ketika seluruh dependency aplikasi
      utama dimatikan.
- [x] Provisioning artefak tidak otomatis mengambil Host rule production.
- [x] Perilaku HTTP apex dan satu tenant Host terverifikasi secara end-to-end.

## Comments

- Selesai pada `b0e5ee6`. Verifikasi ulang 2026-08-29: `bun run
  test:maintenance` lulus; build artifact Nginx selesai dan membuktikan apex,
  tenant, serta `/healthz` melalui container tanpa dependency aplikasi utama.
