# 03 — Application maintenance statis

**What to build:** Artefak Application maintenance yang kecil dan immutable
dapat mengambil trafik production selama write freeze tanpa bergantung pada
PostgreSQL, RustFS, atau secret aplikasi utama.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Maintenance page menjelaskan bahwa layanan sementara tidak tersedia dan
      tidak menjanjikan waktu pulih yang tidak diketahui.
- [ ] Halaman memakai HTML semantik, dapat dibaca screen reader, dan tetap jelas
      tanpa JavaScript.
- [ ] Artefak menjawab HTTP sukses untuk apex, `www`, dan Host tenant pada path
      apa pun yang mungkin dibuka pengguna selama maintenance.
- [ ] Artefak tidak mempunyai koneksi PostgreSQL, S3/RustFS, secret KAMMI ID,
      atau dependency layanan eksternal.
- [ ] Artefak dapat dibangun dan dipatok ke digest immutable.
- [ ] Health check maintenance tetap sukses ketika seluruh dependency aplikasi
      utama dimatikan.
- [ ] Provisioning artefak tidak otomatis mengambil Host rule production.
- [ ] Perilaku HTTP apex dan satu tenant Host terverifikasi secara end-to-end.
