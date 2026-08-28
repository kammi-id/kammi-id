# 02 — One-shot preflight dan migrasi

**What to build:** Satu release image dapat menjalankan duplicate preflight dan
migrasi production secara fail-closed, memakai database guard dan lock timeout,
lalu berhenti tanpa menyalakan HTTP server.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Release image membawa duplicate-preflight tooling beserta seluruh
      dependency runtime yang dibutuhkannya.
- [ ] Preflight tetap read-only, memakai database guard, dan membedakan
      duplikat `code`, `slug`, serta `code_slug` sesuai constraint masing-masing.
- [ ] Duplikat `organization.code` menghasilkan keputusan STOP tanpa koreksi
      mekanis terhadap Nomor Induk Anggota.
- [ ] One-shot mode menjalankan migration batch lalu keluar sukses tanpa
      melayani HTTP.
- [ ] Application mode tanpa migration flag langsung melayani dan tidak
      menyentuh schema.
- [ ] Lock timeout 10 detik diterapkan pada koneksi migrator yang sebenarnya dan
      dibuktikan dengan lock contention test.
- [ ] Migration gagal tetap transaksional: schema dan journal tidak mendarat
      setengah jalan.
- [ ] Migrasi dari database kosong, production-like upgrade, rerun idempoten,
      dan jalur failure semuanya teruji dari exit status serta schema/journal.
- [ ] Log one-shot menyebut target secara aman tanpa mencetak credential.
- [ ] Quality gate repo dan build release image lulus.
