# 02 — Image untuk branch `dev-*`, dan image yang bisa memigrasi dirinya

**What to build:** Push ke branch `dev-*` menghasilkan image ber-tag sha di
GHCR — sesuatu yang hari ini tidak pernah terjadi. Image itu juga tahu cara
menjalankan migrasi basis datanya sendiri saat diminta, dan diam saja saat
tidak.

Belum ada deploy sama sekali di tiket ini. Yang dihasilkan adalah artefak yang
layak di-deploy, plus peleburan workflow yang membuat job deploy nanti tinggal
menempel.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

Peleburan `ci.yml` dan `docker.yml` menjadi satu berkas bukan preferensi gaya:
`needs:` hanya berlaku antar-job di dalam satu workflow, sehingga menggerbangi
deploy pada tes yang lulus mustahil selama keduanya terpisah. Kerjakan
peleburannya di sini, saat belum ada job deploy yang ikut rumit — "make the
change easy, then make the easy change".

Bagian migrasi mengikuti
[ADR 0008](../../../docs/adr/0008-migrasi-dijalankan-entrypoint-container.md).
Gerbangnya adalah ketiadaan `RUN_MIGRATIONS`, bukan ketiadaan perkakas: variabel
yang lupa disetel berarti migrasi **tidak** jalan, bukan migrasi jalan di tempat
yang salah.

- [ ] `ci.yml` dan `docker.yml` melebur menjadi satu workflow dengan job tes dan
      job build berantai lewat `needs:`
- [ ] Pull request ke `main` dan `dev-*` menjalankan seluruh pemeriksaan persis
      seperti sebelumnya — format, lint, struktur, tipe, `bun test`
- [ ] Push ke `dev-*` menghasilkan `ghcr.io/kammi-id/kammi-id:sha-<sha>`
- [ ] Push ke `main` dan tag semver tetap menghasilkan tag yang berlaku sekarang
- [ ] Stage `runner` di `Dockerfile` membawa `drizzle-kit` dan folder migrasi
- [ ] Dengan `RUN_MIGRATIONS=1`, container menjalankan migrasi lalu melayani —
      dibuktikan dengan `docker run` terhadap Postgres lokal
- [ ] Tanpa `RUN_MIGRATIONS`, container langsung melayani tanpa menyentuh basis
      data — dibuktikan dengan cara yang sama
- [ ] Container tetap berjalan sebagai uid 1001; entrypoint tidak menaikkan hak
- [ ] Menjalankan container dua kali berturut-turut dengan `RUN_MIGRATIONS=1`
      tidak menimbulkan galat — migrasinya idempoten
- [ ] `bun run check:format`, `check:lint`, dan `check:types` bersih
