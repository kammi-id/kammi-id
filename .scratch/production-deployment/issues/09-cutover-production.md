# 09 — Cutover production

**What to build:** Trafik production berpindah dari stack lama ke project baru
dengan final database dan asset copy setelah write freeze, smoke test lengkap,
serta checkpoint baru sebelum write dibuka.

**Blocked by:** 08 — Rehearsal cutover dan abort end-to-end.

**Status:** ready-for-human

**Wizard:** `wizard-09-cutover-production.sh` (12 stage). Blocked by 07,
bukan 08. Deadline abort dihitung di stage 1; batas rollback ke stack lama
tertutup di stage 11.

- [ ] Deployment lead dan product/data owner hadir, kandidat/digest masih sama,
      seluruh gate masih valid, dan deadline abort sudah ditetapkan.
- [ ] Backup/snapshot pre-deploy terverifikasi sebelum Host rule production
      dilepas dari Application lama.
- [ ] Apex, `www`, dan wildcard berpindah ke Application maintenance tanpa dua
      pemilik; production lama tidak lagi menerima write.
- [ ] Writer PostgreSQL lama telah berhenti tanpa sesi diputus paksa.
- [ ] Final dump direstore penuh ke PostgreSQL baru dan migration journal
      direkonsiliasi satu per satu.
- [ ] Duplicate preflight dan one-shot migration digest kandidat lulus dengan
      lock timeout yang disepakati.
- [ ] Final asset delta menghasilkan mirror count/bytes/hash yang cocok dan
      ownership volume benar.
- [ ] Readiness serta seluruh smoke test Akun Kepengurusan, Cakupan, Situs
      Struktur, Berita, gambar, upload, mutation, audit, dan cache lulus sebelum
      trafik dibuka.
- [ ] Checkpoint database dan volume project baru diambil setelah smoke test.
- [ ] Apex, `www`, dan wildcard berpindah dari maintenance ke Application baru;
      `assets.kammi.id` tetap menuju RustFS lama.
- [ ] TLS dan routing eksternal diverifikasi, lalu waktu pembukaan write serta
      batas berakhirnya direct rollback ke stack lama dicatat.
- [ ] Ticket ini tidak menghapus database, volume, image, backup, atau project
      lama apa pun.
