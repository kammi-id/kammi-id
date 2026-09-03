# 02 — One-shot preflight dan migrasi

**What to build:** Satu release image dapat menjalankan duplicate preflight dan
migrasi production secara fail-closed, memakai database guard dan lock timeout,
lalu berhenti tanpa menyalakan HTTP server.

**Blocked by:** None — can start immediately.

**Status:** done — `b0e5ee6`

- [x] Release image membawa duplicate-preflight tooling beserta seluruh
      dependency runtime yang dibutuhkannya.
- [x] Preflight tetap read-only, memakai database guard, dan membedakan
      duplikat `code`, `slug`, serta `code_slug` sesuai constraint masing-masing.
- [x] Duplikat `organization.code` menghasilkan keputusan STOP tanpa koreksi
      mekanis terhadap Nomor Induk Anggota.
- [x] One-shot mode menjalankan migration batch lalu keluar sukses tanpa
      melayani HTTP.
- [x] Application mode tanpa migration flag langsung melayani dan tidak
      menyentuh schema.
- [x] Lock timeout 10 detik diterapkan pada koneksi migrator yang sebenarnya dan
      dibuktikan dengan lock contention test.
- [x] Migration gagal tetap transaksional: schema dan journal tidak mendarat
      setengah jalan.
- [x] Migrasi dari database kosong, production-like upgrade, rerun idempoten,
      dan jalur failure semuanya teruji dari exit status serta schema/journal.
- [x] Log one-shot menyebut target secara aman tanpa mencetak credential.
- [x] Quality gate repo dan build release image lulus.

## Comments

- Selesai pada `b0e5ee6`. Verifikasi ulang 2026-08-29: `migrate.test.ts`
  5/5 lulus, termasuk kontensi lock 10 detik serta atomicity failure; quality
  gates lulus; `docker build --pull=false --tag kammi-id:production-ticket-01-03 .`
  lulus dengan digest lokal
  `sha256:6c8b51b47b4e87b50c091089c8e91b80f9d49f1babcbb1de7da6fd5dd73f7a32`.
