# 08 — Rehearsal cutover dan abort end-to-end

**What to build:** Seluruh urutan maintenance, final sync, kandidat, smoke test,
checkpoint, dan abort dibuktikan pada Host validasi sehingga product/data owner
mempunyai bukti nyata sebelum menyentuh domain production.

**Blocked by:** 03 — Application maintenance statis; 05 — Observability dan
routing preflight; 07 — Rehearsal migrasi database dan aset.

**Status:** closed — melebur; rehearsal terpisah ditiadakan (lihat "Keputusan
operasional" di `spec.md`). Isinya terbagi ke `wizard-07` (smoke test di
hostname validasi) dan `wizard-09` (maintenance, abort, flip domain).

- [ ] Host validasi berpindah Application lama-equivalent → maintenance →
      kandidat tanpa pernah dimiliki dua Application bersamaan.
- [ ] Maintenance page melayani apex-equivalent dan satu tenant Host ketika
      PostgreSQL/RustFS kandidat tidak tersedia.
- [ ] Write freeze, pemeriksaan writer, checkpoint, final dump/restore, asset
      delta, migration, dan readiness dijalankan dalam urutan runbook.
- [ ] Akun Kepengurusan smoke test pada Struktur nyata membuktikan login/logout,
      session, Cakupan, publikasi, gambar lama, upload baru, mutasi reversibel,
      audit, dan cache invalidation.
- [ ] Exact route RustFS tetap hidup dan tidak tertangkap wildcard selama
      seluruh perpindahan Host.
- [ ] Checkpoint database dan volume project baru dapat direstore; status job
      backup saja tidak dihitung sebagai bukti.
- [ ] Jalur abort mematikan kandidat dan mengembalikan Host ke stack
      lama-equivalent tanpa down migration atau reverse sync.
- [ ] Seluruh rehearsal selesai atau kembali melayani dalam RTO maksimal 60
      menit dengan target RPO nol setelah write freeze.
- [ ] Uptime alert, log, dan incident notification terbukti menangkap failure
      yang disuntikkan secara aman.
- [ ] Deployment lead dan product/data owner menandatangani bukti go/no-go untuk
      cutover production.
