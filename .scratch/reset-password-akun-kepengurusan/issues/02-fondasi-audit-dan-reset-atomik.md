# 02 — Fondasi audit dan reset atomik

**What to build:** Tambahkan penyimpanan audit additive serta use-case transaksi
khusus yang mengganti password satu Akun Kepengurusan, mencabut seluruh sesinya,
dan mencatat audit sebagai satu operasi atomik.

**Blocked by:** 01 — Perkuat generator tanpa mengubah kontrak.

**Status:** resolved

- [x] Migrasi hanya menambah tabel audit tanpa backfill, FK ke data existing,
  index spekulatif, atau perubahan tabel lama.
- [x] Audit menyimpan ID dan snapshot pelaku, sasaran, kewenangan, Struktur, jenis
  kejadian, serta waktu; tidak menyimpan plaintext maupun hash.
- [x] Modul audit hanya menyediakan append dan tidak mempunyai update/delete API.
- [x] Transaksi baru memverifikasi tepat satu akun sasaran lalu mengubah hash,
  menghapus seluruh sesi sasaran, dan menulis tepat satu event audit.
- [x] Failure injection membuktikan kegagalan pada setiap tahap me-roll back
  seluruh operasi dan tidak mengubah sesi pelaku.
- [x] Helper `updateUser`, `deleteSession`, reset Akun Kader, ganti password
  sendiri, dan cascade penghapusan Member tetap tidak berubah.

## Comments

- Resolved 2026-08-25: added the additive audit table and an atomic reset
  transaction, covered by success and per-stage rollback integration tests.
