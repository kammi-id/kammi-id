# 02 — Image untuk branch `dev-*`, dan image yang bisa memigrasi dirinya

**What to build:** Push ke branch `dev-*` menghasilkan image ber-tag sha di
GHCR — sesuatu yang hari ini tidak pernah terjadi. Image itu juga tahu cara
menjalankan migrasi basis datanya sendiri saat diminta, dan diam saja saat
tidak.

Belum ada deploy sama sekali di tiket ini. Yang dihasilkan adalah artefak yang
layak di-deploy, plus peleburan workflow yang membuat job deploy nanti tinggal
menempel.

**Blocked by:** None — can start immediately.

**Status:** in-review — implementasi selesai, `docker run` belum terbukti
langsung (lihat Comments)

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

- [x] `ci.yml` dan `docker.yml` melebur menjadi satu workflow dengan job tes dan
      job build berantai lewat `needs:`
- [x] Pull request ke `main` dan `dev-*` menjalankan seluruh pemeriksaan persis
      seperti sebelumnya — format, lint, struktur, tipe, `bun test`
- [x] Push ke `dev-*` menghasilkan `ghcr.io/kammi-id/kammi-id:sha-<sha>`
- [x] Push ke `main` dan tag semver tetap menghasilkan tag yang berlaku sekarang
- [x] Stage `runner` di `Dockerfile` membawa `drizzle-kit` dan folder migrasi
- [ ] Dengan `RUN_MIGRATIONS=1`, container menjalankan migrasi lalu melayani —
      dibuktikan dengan `docker run` terhadap Postgres lokal
- [ ] Tanpa `RUN_MIGRATIONS`, container langsung melayani tanpa menyentuh basis
      data — dibuktikan dengan cara yang sama
- [ ] Container tetap berjalan sebagai uid 1001; entrypoint tidak menaikkan hak
      (secara struktur `USER nextjs` tetap sebelum `ENTRYPOINT`, tapi belum
      dibuktikan lewat container yang benar-benar jalan — lihat Comments)
- [ ] Menjalankan container dua kali berturut-turut dengan `RUN_MIGRATIONS=1`
      tidak menimbulkan galat — migrasinya idempoten
- [x] `check:lint`, `check:structure`, dan `check:types` bersih; `check:format`
      punya 4 pelanggaran pra-ada di berkas yang tidak disentuh tiket ini
      (`DESIGN.md`, `README.md`, `src/lib/api/storage.test.ts`,
      `src/scripts/assets-pull.ts`)

## Comments

**Peleburan workflow.** `.github/workflows/ci.yml` sekarang punya dua job:
`test` (persis konten lama, tanpa perubahan) dan `build-push` yang
`needs: test` dan hanya jalan `if: github.event_name == 'push'`. Trigger PR
tidak lagi memicu build image sama sekali — perilaku lama docker.yml yang
mendorong image `dev`/`dev-<sha>` mengambang untuk PR internal dihapus, karena
checklist tiket ini tidak memintanya dan itu bertentangan dengan disiplin
"tag mengambang ditolak" yang sudah ditetapkan di spec. `test` job sekarang
juga jalan untuk event `push` (dulu cuma `pull_request`) — wajib, supaya
`needs: test` di `build-push` punya sesuatu untuk digerbangi saat push ke
`dev-*`. Tag `sha-<sha>` digerbangi eksplisit ke `refs/heads/main` atau
`refs/heads/dev-*` (`github.ref`), bukan `enable=true` polos — supaya push tag
semver tetap TIDAK ikut dapat tag `sha-`, persis perilaku lama.

**Drizzle-kit di image runner.** Alih-alih menginstal ulang `drizzle-kit`
secara terisolasi (butuh menebak versi & dependensi transitifnya di tree yang
di-hoist flat oleh bun — rawan salah diam-diam), stage `runner` menyalin utuh
`node_modules` hasil install stage `deps` (yang sudah menjalankan
`bun install --frozen-lockfile` lengkap dengan devDependencies terhadap
lockfile yang sama). Ini persis ongkos yang sudah dicatat sadar di ADR 0008:
"Permukaan image bertambah". Ikut disalin: `drizzle.config.ts`,
`src/db/__migrations`, `src/db/schema` (dirujuk field `schema` di config),
`src/scripts/db-guard.ts` + `src/lib/db-guard/` (entrypoint memanggil gerbang
yang sama dengan `db:migrate` lokal, bukan `drizzle-kit migrate` telanjang),
dan `package.json`/`tsconfig.json` (untuk resolusi alias `~/*` saat bun
menjalankan `db-guard.ts` langsung).

**`docker-entrypoint.sh`** di root repo: `RUN_MIGRATIONS=1` menjalankan
`bun src/scripts/db-guard.ts && bunx drizzle-kit migrate` lalu `exec "$@"`;
tanpanya langsung `exec "$@"` (yaitu `bun server.js` dari `CMD`). `set -e`
memastikan migrasi gagal = container gagal start, bukan lanjut melayani di
skema yang salah.

**Blocker verifikasi live.** Tiga item checklist yang menuntut `docker run`
sungguhan belum tercentang: Docker Desktop di mesin ini rusak di tengah proses
verifikasi — disk sistem turun ke ratusan MB tersisa, `docker build` gagal
dengan I/O error di containerd, lalu daemon-nya sendiri mulai menjawab 500 di
setiap panggilan API (`docker info`, `docker ps`, `docker system prune`).
Pengguna memutuskan lanjut tanpa verifikasi live alih-alih menunggu perbaikan
disk/Docker Desktop. Tiga hal yang masih perlu dibuktikan begitu Docker sehat
kembali:

1. `docker build .` sukses (belum pernah sukses sekali pun di mesin ini untuk
   Dockerfile versi baru — kemungkinan ada kesalahan yang baru ketahuan saat
   build beneran jalan, meski `check:types`/`check:lint` sudah bersih).
2. `docker run -e RUN_MIGRATIONS=1 -e DATABASE_URL=... <image>` terhadap
   Postgres lokal — migrasi jalan lalu server naik.
3. Jalankan dua kali berturut-turut dengan `RUN_MIGRATIONS=1` — migrasi kedua
   harus no-op (drizzle-kit melacak lewat jurnal), bukan galat.
4. `docker run` tanpa `RUN_MIGRATIONS` — server naik tanpa menyentuh DB.
5. `docker exec <container> whoami` atau `id -u` — harus `1001`/`nextjs`,
   bukan `root`.
