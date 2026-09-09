# 07 — Rehearsal migrasi database dan aset

**What to build:** PostgreSQL dan volume project baru dapat diisi dari salinan
production, dimigrasikan dengan digest kandidat, dan diverifikasi sampai byte
gambar nyata tanpa menyentuh data plane production lama.

**Blocked by:** 02 — One-shot preflight dan migrasi; 04 — Provision project
production baru; 06 — Sahkan digest kandidat di staging.

**Status:** closed — melebur ke eksekusi langsung

**Wizard:** `wizard-07-precopy-data-dan-aset.sh` (12 stage). Jalur tunggal —
bukan rehearsal terpisah lagi; lihat "Keputusan operasional" di `spec.md`.
Stack lama hanya dibaca, trafik tidak disentuh.

- [ ] Fresh `pg_dump -Fc` production lama direstore penuh ke PostgreSQL baru
      memakai opsi yang sudah terbukti di staging.
- [ ] Migration journal hasil restore dibandingkan dengan kandidat dan setiap
      migration yang tampak hilang diverifikasi satu per satu terhadap schema.
- [ ] Duplicate preflight dijalankan terhadap database hasil restore; temuan
      `code` atau ambiguitas lain menghentikan rehearsal.
- [ ] One-shot migration memakai digest kandidat, database guard eksplisit, dan
      lock timeout 10 detik lalu berhenti tanpa HTTP server.
- [ ] Migration journal dan schema akhir cocok dengan kandidat.
- [ ] Seluruh object RustFS disalin dengan key yang sama ke upload volume dan
      destination menjadi mirror persis sumber.
- [ ] Jumlah file, total byte, dan manifest hash sumber/tujuan cocok; image
      placeholder tidak dihitung sebagai bukti.
- [ ] Ownership volume dikembalikan ke `1001:1001` setelah copy dan Application
      dapat membaca, upload, membaca ulang, serta membersihkan file sintetis.
- [ ] Aplikasi kandidat berjalan pada hostname validasi dan smoke data plane
      lulus tanpa mengambil Host rule production.
- [ ] Durasi dump, restore, asset delta, preflight, dan migrasi dicatat serta
      menyisakan waktu untuk smoke/abort dalam RTO 60 menit.
- [ ] Project lama tetap utuh, menerima trafik seperti sebelumnya, dan tidak
      berubah akibat rehearsal.

## Comments

### 2026-09-01 — ditutup di luar tiket

Rehearsal terpisah tidak pernah dijalankan. Database kandidat sudah berisi data
precopy production (516 baris `organization`); migrasi dijalankan lewat one-shot
container (`RUN_MIGRATIONS=1 MIGRATIONS_ONLY=1 DB_GUARD_ACK=1`), preflight
duplikat 0 `code` / 0 `slug`, exit 0. `wizard-07` sengaja **tidak** dipakai —
12-stage penuh termasuk `pg_dump`/restore dari production lama, berisiko
menimpa data precopy yang sudah ada.

Bukti: `provisioning-record.local.md` §"Update kandidat 2026-08-30".

**Tidak diverifikasi:** verifikasi "sampai byte gambar nyata" tidak dilakukan.
