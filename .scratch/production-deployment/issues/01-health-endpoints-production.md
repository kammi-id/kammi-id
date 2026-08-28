# 01 — Health endpoints production

**What to build:** Application menyediakan liveness dan readiness yang dapat
dipakai Dokploy serta external uptime monitor untuk membedakan proses hidup dari
instance yang benar-benar siap melayani PostgreSQL dan upload gambar.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Liveness menjawab sukses selama proses HTTP hidup tanpa membaca
      PostgreSQL, volume, RustFS, atau API pihak ketiga.
- [ ] Readiness menjawab sukses hanya ketika PostgreSQL dapat menjawab query
      ringan dan upload volume tersedia dengan permission baca/tulis.
- [ ] Readiness gagal tertutup ketika PostgreSQL terputus, direktori upload
      hilang, atau permission volume salah.
- [ ] Gangguan API wilayah/universitas tidak mengubah readiness.
- [ ] Respons health tidak membocorkan DSN, path host, credential, schema, atau
      detail exception.
- [ ] Kontrak HTTP diuji dari endpoint, bukan dari helper internal.
- [ ] Container dan Dokploy dapat mengonsumsi health status tanpa autentikasi.
- [ ] Quality gate repo dan Next.js DevTools `get_errors` lulus.
