# 10 — Soak dan tutup rilis

**What to build:** Rilis baru dinyatakan stabil setelah observasi, backup, dan
bukti operasional project baru lengkap; stack lama dibekukan tanpa writer tetapi
tidak dihapus.

**Blocked by:** 09 — Cutover production.

**Status:** ready-for-human

- [ ] Readiness, uptime, 5xx, login, latency PostgreSQL, disk, upload, gambar,
      dan log exception dipantau aktif minimal 60 menit.
- [ ] Product/data owner menyatakan stabil atau memerintahkan roll-forward;
      stack lama tidak diaktifkan kembali setelah project baru menerima write.
- [ ] Pemantauan diperketat berlangsung 24 jam dan setiap insiden/follow-up
      dicatat.
- [ ] Backup PostgreSQL dan kedua volume project baru berjalan serta satu restore
      pasca-cutover terbukti.
- [ ] Application lama dihentikan dan seluruh Host rule-nya dicabut.
- [ ] PostgreSQL lama dipertahankan tanpa writer, sementara image dan snapshot
      pre-deploy disimpan minimal 30 hari.
- [ ] RustFS dan exact route `assets.kammi.id` tetap hidup selama legacy URL
      masih digunakan dan backup volume masih membutuhkannya.
- [ ] Catatan rilis memuat SHA/digest, migration journal, durasi, asset manifest,
      backup/restore, health, smoke test, domain handoff, serta keputusan kedua
      peran tanpa secret.
- [ ] Follow-up yang ditemukan dibuat terpisah dan tidak diselipkan sebagai
      perubahan production langsung.
- [ ] Penghapusan stack lama tetap di luar ticket ini dan membutuhkan pekerjaan
      serta konfirmasi eksplisit setelah masa retensi.
