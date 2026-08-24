# 05 — Verifikasi dan release gate production

**What to build:** Buktikan feature baru tidak mengubah fungsi akun dan data
existing, lalu jalankan gate migrasi dan runtime yang diwajibkan sebelum rilis
production.

**Blocked by:** 02 — Fondasi audit dan reset atomik; 03 — Tampilkan kredensial setelah menambah Struktur; 04 — Reset Akun dari detail Struktur.

**Status:** ready-for-agent

- [ ] Matriks authorization, target integrity, reauthentication, atomicity,
  Non-Aktif/Terhapus, masking, copy, CSV, dan audit lulus.
- [ ] Login, validasi sesi/Keadaan, create Member, bulk upload, reset Akun Kader,
  ganti password sendiri, delete Member, seed, create Struktur, serta aksi detail
  Struktur existing lulus tanpa perubahan perilaku.
- [ ] Migrasi lulus dari database kosong dan upgrade staging yang membawa salinan
  data production; tidak ada backfill atau perubahan tabel lama.
- [ ] Preflight production memeriksa versi PostgreSQL, migration journal,
  backup/snapshot terverifikasi, jumlah sesi, serta query plan revoke sesi.
- [ ] Kebutuhan index `session.user_id` diputuskan berdasarkan ukuran production;
  bila perlu, ia dipisah menjadi migrasi dan rollout tersendiri.
- [ ] Migrasi production dijalankan manual sebelum deployment kode; rollback kode
  tidak menghapus tabel atau event audit.
- [ ] Type, lint, structure, test relevan, build/runtime browser, dan Next.js
  DevTools `get_errors` lulus tanpa menyerap perubahan worktree yang tidak terkait.
