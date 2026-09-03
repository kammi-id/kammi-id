# 01 — Health endpoints production

**What to build:** Application menyediakan liveness dan readiness yang dapat
dipakai Dokploy serta external uptime monitor untuk membedakan proses hidup dari
instance yang benar-benar siap melayani PostgreSQL dan upload gambar.

**Blocked by:** None — can start immediately.

**Status:** done — `b0e5ee6`

- [x] Liveness menjawab sukses selama proses HTTP hidup tanpa membaca
      PostgreSQL, volume, RustFS, atau API pihak ketiga.
- [x] Readiness menjawab sukses hanya ketika PostgreSQL dapat menjawab query
      ringan dan upload volume tersedia dengan permission baca/tulis.
- [x] Readiness gagal tertutup ketika PostgreSQL terputus, direktori upload
      hilang, atau permission volume salah.
- [x] Gangguan API wilayah/universitas tidak mengubah readiness.
- [x] Respons health tidak membocorkan DSN, path host, credential, schema, atau
      detail exception.
- [x] Kontrak HTTP diuji dari endpoint, bukan dari helper internal.
- [x] Container dan Dokploy dapat mengonsumsi health status tanpa autentikasi.
- [x] Quality gate repo dan Next.js DevTools `get_errors` lulus.

## Comments

- Selesai pada `b0e5ee6`. Verifikasi ulang 2026-08-29: health route tests
  5/5 lulus; `check:types`, `check:structure`, `check:lint`, dan
  `check:format` lulus. Browser membuka `/api/health/live` dengan respons
  `{"status":"ok"}`; Next DevTools `get_compilation_issues` bersih dan
  `get_errors` melaporkan `configErrors: []`, `sessionErrors: []`.
