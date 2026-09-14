# 05 — Verifikasi dan release gate production

**What to build:** Buktikan feature baru tidak mengubah fungsi akun dan data
existing, lalu jalankan gate migrasi dan runtime yang diwajibkan sebelum rilis
production.

**Blocked by:** 02 — Fondasi audit dan reset atomik; 03 — Tampilkan kredensial setelah menambah Struktur; 04 — Reset Akun dari detail Struktur.

**Status:** ready-for-agent — ditinjau 2026-09-06; bukti release gate lengkap belum tercatat.

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

## Comments

### 2026-09-06 — tinjauan status

Tiket 02, 03, dan 04 sudah berstatus `resolved`/`done`, sehingga dependensi
tiket ini terpenuhi. [CI terbaru](https://github.com/kammi-id/kammi-id/actions/runs/33781321956)
lulus untuk commit `036f467`, termasuk migrasi database kosong, unit test,
E2E, build image, dan deploy non-production pada 2026-09-04, 00.06 WIB.
Hasil tersebut belum membuktikan seluruh matriks dan gate production di atas.
Checklist tetap terbuka sampai bukti spesifiknya dicatat; penutupan tiket
production-deployment lewat keputusan operator tidak menutup tiket ini.
