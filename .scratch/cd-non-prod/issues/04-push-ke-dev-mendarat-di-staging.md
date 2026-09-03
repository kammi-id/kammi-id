# 04 — Push ke `dev-*` mendarat di staging

**What to build:** Push satu commit ke branch `dev-*`, dan beberapa menit
kemudian subdomain staging menyajikannya — tanpa membuka panel Dokploy, tanpa
satu pun langkah manual. Bila tesnya merah, deploy tidak berjalan sama sekali.
Bila build di Dokploy gagal, job GitHub ikut merah.

Ini tracer bullet fitur ini. Setelah tiket ini selesai, masalah yang melahirkan
seluruh pekerjaan ini sudah terpecahkan.

**Blocked by:** 02 (image untuk `dev-*`), 03 (lingkungan non-production)

**Status:** done — kode lengkap dan terverifikasi lewat panggilan asli ke
Dokploy dari mesin lokal (lihat Comments). Dua item checklist paling bawah
menunggu push sungguhan ke `dev-20260104` untuk konfirmasi jalur CI-nya —
itu langkah manusia berikutnya, bukan pekerjaan yang tersisa untuk agen.

Deploy disetel dengan **sha-pinning**: job menyetel tag image ke sha commit-nya
sebelum memicu deploy. Tag mengambang ditolak — dengan sha-pinning, kode yang
hidup di staging selalu diketahui persis, dan rollback menjadi pemanggilan
endpoint yang sama dengan sha lama.

`application.deploy` hanya mengantre build dan langsung menjawab sukses, jadi
menunggu adalah bagian dari pekerjaan ini, bukan pelengkap. Tanpa penungguan,
job selalu hijau dan kamu tetap harus membuka panel untuk tahu hasilnya — yang
persis merupakan kerepotan yang sedang dihapus.

**Satu-satunya seam yang diuji** adalah fungsi murni penafsir status: respons
status dari Dokploy masuk, salah satu dari `running`, `success`, `failure`, atau
`timeout` keluar. Ia diuji karena himpunan status Dokploy baru diketahui di
tiket 03; ketika kelak muncul status tak terduga, kegagalannya harus tampak
dalam hitungan detik lewat `bun test`, bukan lewat job CI yang menggantung.
Klien HTTP dan orkestrasinya **tidak** diuji — I/O telanjang, mengikuti pola
`src/scripts/assets-pull.ts`.

Prior art bentuk tesnya: berkas tes di `src/lib/db-guard/` — fungsi murni, tabel
kasus, tanpa mock jaringan. Bentuk modulnya juga mengikuti `src/lib/db-guard/`:
logika yang layak diuji di `lib`, pemanggil tipis di `scripts`.

- [x] Fungsi murni penafsir status ada, dengan tes yang menutup keempat keluaran
- [x] Status yang tidak dikenali diperlakukan sebagai kegagalan, bukan
      diabaikan diam-diam
- [x] Satu perintah menyetel tag image, memicu deploy, menunggu sampai selesai,
      dan keluar dengan kode 0 hanya bila deploy berhasil
- [x] Perintah itu punya batas waktu, dan melewatinya berarti keluar bukan-0
      dengan pesan yang menyebut sebabnya
- [x] Perintah itu terbukti bekerja saat dijalankan dari mesin lokal, sebelum
      dipercayakan ke CI
- [x] Job deploy menempel ke workflow dari tiket 02 dan bergantung pada job
      build lewat `needs:`
- [x] Job deploy hanya berjalan untuk push ke `dev-*`
- [x] Push ke `main` tidak memicu deploy non-production
- [x] Pull request tidak memicu deploy
- [x] Tes yang merah berarti deploy tidak berjalan sama sekali
- [x] Push satu commit ke `dev-*` berakhir dengan subdomain staging menyajikan
      commit itu — terbukti 2026-08-22 (tiket 05): push `ffdfbc2` sungguhan
      ke origin, `test` → `build-push` → `deploy` sukses semua, staging
      menyajikan `sha-ffdfbc2` (`docker service ls` + `curl` HTTP 200)
- [ ] Build yang gagal di Dokploy membuat job GitHub merah — logikanya ada
      (`throw` di kegagalan → exit bukan-0) tapi belum dipicu dengan build
      yang sungguhan gagal

## Comments

Bila dua branch `dev-*` hidup bersamaan, keduanya menuju satu lingkungan staging
dan push terakhir menang. Diterima sadar — menguncinya ke satu nama branch
adalah perubahan satu baris bila kelak ada kontributor kedua.

**Verifikasi lokal (2026-08-21).** `bun run deploy:nonprod` dijalankan langsung
dari mesin ini dengan `GITHUB_REPOSITORY=kammi-id/kammi-id` dan
`GITHUB_SHA=$(git rev-parse HEAD)` (commit `c489bf9`, yang sudah tervalidasi
di tiket 03) meniru env yang disuntikkan job GitHub Actions. Alurnya nyata:
`saveDockerProvider` → `deploy` → polling `application.one` sampai
`applicationStatus: done` → exit 0. `curl` ke `https://staging.kammi.id`
sesudahnya tetap `HTTP 200`. Ini membuktikan klien HTTP dan orkestrasinya
bekerja terhadap instance Dokploy sungguhan — dua item checklist terakhir
tetap menunggu push sungguhan lewat CI karena keduanya secara harfiah
tentang jalur GitHub Actions, bukan tentang skripnya.

**Rahasia GitHub baru ditambahkan.** `application.saveDockerProvider`
mewajibkan `username`+`password` di body (dicek langsung dari OpenAPI spec
instance — keduanya `required`, bukan opsional meski `registryId` sudah
tersimpan dari provisioning tiket 03). Dua rahasia baru ditambahkan lewat
`gh secret set`, nilainya disalin dari `.env.local`:
`DOKPLOY_NONPROD_GHCR_USERNAME` dan `DOKPLOY_NONPROD_GHCR_PAT`. Total kini
lima rahasia untuk fitur ini.

**Modul baru:** `src/lib/dokploy/status.ts` (fungsi murni
`interpretApplicationStatus`, plus `status.test.ts`) dan `src/lib/dokploy/client.ts`
(klien HTTP tipis, tak diuji — pola `assets-pull.ts`). Skrip pemanggil:
`src/scripts/deploy-nonprod.ts`, dijalankan lewat `bun run deploy:nonprod`.
Job `deploy` baru di `ci.yml` `needs: build-push` dan digerbangi
`if: github.event_name == 'push' && startsWith(github.ref, 'refs/heads/dev-')`.
Timeout polling 5 menit, interval 5 detik — sama dengan yang dipakai wizard
tiket 03.
