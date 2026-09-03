# 03 — Lingkungan non-production ada di Dokploy

**What to build:** Sebuah lingkungan non-production yang hidup — aplikasi
menarik image privat dari GHCR, tersambung ke Postgresnya sendiri, menulis ke
volume unggahannya sendiri, dan dilayani di subdomain staging ber-TLS. Membuka
subdomain itu menghasilkan halaman yang menjawab, dengan skema basis data sudah
terbentuk.

**Blocked by:** 01 (prasyarat DNS, TLS, PAT, rahasia)

**Status:** done — seluruh checklist terpenuhi dan diverifikasi

Instance ini kosong sepenuhnya saat tiket ditulis: nol project, nol registry,
nol server terdaftar. `serverId` dikosongkan pada semua pemanggilan — nol server
terdaftar berarti deploy jatuh ke host Dokploy itu sendiri.

**Tiga hal belum diketahui dan harus dibaca dari OpenAPI spec instance, bukan
ditebak.** Catat jawabannya di bagian Comments tiket ini sebelum menutupnya,
karena tiket 04 bergantung pada dua di antaranya:

1. Cara memasang volume. Daftar router resmi Dokploy tidak memuat `mounts`,
   sehingga volume kemungkinan diatur lewat `application.update` atau router
   yang tidak terdokumentasi.
2. Nama dan argumen procedure untuk membaca status deployment, beserta himpunan
   nilai status yang mungkin.
3. Field wajib `postgres.create`.

Izin volume adalah penyimpangan sadar dari
[ADR 0006](../../../docs/adr/0006-gambar-di-volume-bukan-object-storage.md),
yang menolak langkah manual karena akan terlupakan saat volume dibuat ulang.
Tanpa Compose tidak ada tempat bagi init container ber-`chown`, dan mengubah
bentuk deployment production semata demi satu perintah adalah harga yang salah.
Penyimpangan ini terbatas pada non-production.

- [x] Ketiga hal tak diketahui di atas terjawab dan tercatat di Comments
- [x] Project dan environment non-production terbentuk
- [x] Kredensial registry GHCR tersimpan lewat router `registry`, dan terbukti
      sanggup menarik image privat — dibuktikan oleh deploy `sha-c489bf9` yang
      berhasil menarik image privat dan sampai status `done`
- [x] Postgres berjalan pada versi yang sama dengan production (`postgres:18.3`)
- [x] Application terbentuk dengan Docker provider menunjuk image ber-tag sha
      (`ghcr.io/kammi-id/kammi-id:sha-c489bf9`)
- [x] Volume `kammi-uploads` terpasang pada aplikasi
- [x] Volume dimiliki uid 1001 — dibuktikan dengan unggahan gambar yang berhasil
      tersimpan lewat aplikasi sungguhan
- [x] Subdomain staging melayani aplikasi lewat HTTPS dengan sertifikat sah —
      `openssl s_client` ke `staging.kammi.id:443` menunjukkan issuer Let's Encrypt
- [x] Staging tidak terindeks mesin pencari — middleware Traefik
      `X-Robots-Tag: noindex, nofollow` terpasang di router `websecure`,
      terverifikasi lewat `curl -I https://staging.kammi.id`
- [x] Variabel lingkungan tersetel **sekali** di panel: `DATABASE_URL`,
      `UPLOADS_DIR`, `API_CO_ID_TOKEN`, `RUN_MIGRATIONS=1`, `DB_GUARD_ACK=1`
- [x] Skema basis data terbentuk saat container pertama menyala — halaman
      `https://staging.kammi.id` menjawab HTTP 200 dengan judul aplikasi asli,
      bukti entrypoint tiket 02 bekerja di lingkungan nyata
- [x] `applicationId` tersimpan sebagai rahasia GitHub ketiga
      (`DOKPLOY_NONPROD_APPLICATION_ID`, 2026-08-21)

## Comments

Panel Dokploy adalah sumber kebenaran variabel lingkungan sejak tiket ini. CI
tidak pernah memanggil `application.saveEnvironment` — lihat spec, bagian
Implementation Decisions.

**Tiga hal yang tadinya belum diketahui, dijawab dari OpenAPI spec instance
(`<host>/api/openapi.json`, sumbernya `github.com/Dokploy/dokploy` canary) +
skema Drizzle-nya (`packages/server/src/db/schema/`), bukan ditebak:**

1. **Cara memasang volume.** Ada router `mounts` beneran (daftar router resmi
   yang dirujuk spec ternyata tidak lengkap) — `mounts.create` dengan body
   `{ type: "volume", volumeName, mountPath, serviceType: "application",
   serviceId }`. `volumeName` dipakai apa adanya sebagai nama Docker volume di
   host (`packages/server/src/utils/docker/utils.ts`, `generateVolumeMounts`:
   `Source: mount.volumeName`) — bukan diprefiks nama project/environment,
   karena Dokploy men-deploy lewat Swarm service langsung, bukan Compose.
2. **Procedure status deployment.** Bukan lewat `deployment.all` (respons
   sukses-nya tidak bertipe di OpenAPI spec, hanya array mentah). Yang typed
   dan langsung dipakai: field `applicationStatus` pada `application.one` dan
   `postgres.one`, dengan empat nilai — `idle | running | done | error`
   (`db/schema/application.ts` dan `postgres.ts`). Tidak ada nilai `timeout`
   dari Dokploy; itu disimpulkan sendiri oleh pemanggil kalau status tetap
   `running`/`idle` melewati batas waktu polling.
3. **Field wajib `postgres.create`.** `name`, `databaseName`, `databaseUser`,
   `databasePassword`, `environmentId`. `dockerImage` opsional, default
   `postgres:18` — harus dioverride eksplisit ke `postgres:18.3` biar cocok
   production.

Wizard provisioning: `.scratch/cd-non-prod/wizard-03-lingkungan-dokploy.sh`
(dibuat lewat `/wizard`, dijalankan manusia — bukan sekali-jalan idempotent,
ia membaca ID yang sudah tersimpan di `.env.local` supaya aman diulang).

**Blocker di luar tiket ini, ditemukan dan diselesaikan sebelum provisioning
bisa lanjut:** branch `dev-20260104` ternyata 3 commit belum ke-push (termasuk
peleburan `ci.yml`/`docker.yml` dari tiket 02), lalu drift formatting, lalu
deadlock Postgres asli (`40P01`) antar-berkas tes — akarnya `Bun.SQL` default
pool 10 koneksi padahal `src/db/db.ts` diimpor sekali per proses dan seluruh
53 berkas tes berbagi satu client; dikunci ke `max: 1` untuk `NODE_ENV=test`.
Detail commit: `bc17f8e`, `ccdf89d`, `c489bf9`. Baru setelah itu `sha-c489bf9`
berhasil terbit dan bisa ditarik Dokploy.

**Wizard interaktifnya sendiri dua kali berhenti tak terduga** persis di awal
stage volume (setelah docker provider terpasang), tanpa galat yang terlihat.
Belum terdiagnosis — kemungkinan `read` di stage tersebut tidak mendapat TTY
yang diharapkan pada sesi terminal yang dipakai. Sisa stage (volume, env vars,
domain, deploy) akhirnya dijalankan langsung lewat pemanggilan API yang sama
di luar skrip wizard, bukan lewat wizard-nya. Kalau ini dipakai lagi untuk
lingkungan lain, uji dulu stage tersebut sebelum mengandalkannya penuh.

**Jebakan tersembunyi yang harus diketahui siapa pun yang menyentuh
`DATABASE_URL` di sini lagi:** Dokploy **selalu menambah suffix acak** pada
`appName`, walau `appName` dikirim eksplisit saat `postgres.create` maupun
`application.create` — `kammi-staging-db` yang diminta menjadi
`kammi-staging-db-hz50pc` di respons nyatanya, dan itulah hostname jaringan
Docker yang sebenarnya (dipakai di `DATABASE_URL`), bukan nilai yang diminta.
Selalu baca `appName` balik dari `postgres.one`/`application.one` setelah
create, jangan asumsikan sama dengan yang dikirim.

## Penyelesaian dua item terakhir

1. **Izin volume** — diselesaikan manusia lewat SSH (`docker volume inspect`
   + `chown -R 1001:1001`), dibuktikan dengan unggahan gambar sungguhan yang
   bertahan.
2. **Noindex** — diselesaikan lewat API, bukan panel: `application.
   updateTraefikConfig` menambah satu middleware `headers.
   customResponseHeaders` (`noindex-staging`) dan memasangnya ke router
   `websecure` di config Traefik per-aplikasi (bukan config instance-wide).
   Router `web` (redirect ke https) sengaja tidak disentuh — yang menentukan
   apakah crawler mengindeks adalah respons final setelah redirect.
   Terverifikasi: `curl -I https://staging.kammi.id` menunjukkan
   `x-robots-tag: noindex, nofollow`.

Tiket 03 selesai. Frontier berikutnya: **04** (push mendarat di staging —
sekarang tak lagi diblokir, `applicationId` sudah jadi rahasia GitHub) dan
**05** (data & runbook staging).
