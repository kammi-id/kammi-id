# 06 — Sahkan digest kandidat di staging

**What to build:** Satu SHA final dari `main` menghasilkan digest image
immutable yang lulus seluruh quality dan release gate di staging, lalu dibekukan
sebagai satu-satunya kandidat production.

**Blocked by:** 01 — Health endpoints production; 02 — One-shot preflight dan
migrasi.

**Status:** done — diselesaikan lewat keputusan, lihat "Keputusan operasional"
di `spec.md`. Kandidat dibekukan pada `sha-b0e5ee6`, digest
`sha256:27a43de67c6e66301c2d2d65126f94f6c629fc3ec149d00cc67b9934a6744f85`,
yang sudah berjalan dan terverifikasi di staging. Checklist pertama
("Kandidat berasal dari `main`") sengaja dibatalkan: `main` tidak disentuh.

- [ ] Kandidat berasal dari `main`; worktree, commit SHA penuh, tag image, dan
      digest dicatat.
- [ ] Agent berhenti sebelum push dan menyerahkan commit untuk gate manusia;
      push hanya dilakukan setelah diff disetujui.
- [ ] CI format, lint, structure, typecheck, unit, E2E, migration dari database
      kosong, dan build image lulus.
- [ ] Digest hasil CI dideploy ke staging tanpa rebuild lokal atau tag
      mengambang.
- [ ] Health, login/session, Cakupan, Situs Struktur, Berita/permalink, gambar,
      upload, dan mutasi existing lulus di staging.
- [ ] Production release gate existing diselesaikan terhadap kandidat yang
      sama, termasuk compatibility dan migration checks.
- [ ] Browser runtime dan Next.js DevTools `get_errors` tidak melaporkan error.
- [ ] Perubahan setelah freeze menghasilkan SHA baru dan mengulang seluruh
      acceptance criteria ticket ini.
- [ ] Catatan kandidat menyimpan digest dan bukti gate tanpa credential.
