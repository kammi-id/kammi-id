# CD ke non-production lewat Dokploy API

**Status:** ready-for-agent (tiket infrastruktur `ready-for-human` — lihat per tiket)

Dua keputusan yang susah dibalik sudah tercatat terpisah:
[ADR 0008](../../docs/adr/0008-migrasi-dijalankan-entrypoint-container.md) untuk
migrasi di entrypoint, dan
[ADR 0009](../../docs/adr/0009-staging-membawa-data-production.md) untuk data
staging. Spec ini tidak mengulang argumennya.

## Problem Statement

Setiap kali sebuah tiket selesai, tidak ada cara melihat hasilnya berjalan di
lingkungan yang menyerupai production. Yang ada hanya `next dev` di mesin
sendiri, dan itu tidak pernah menangkap kelas kesalahan yang justru paling
mahal: berkas yang hilang dari image karena `.dockerignore`, variabel
lingkungan yang lupa disetel, migrasi yang belum jalan, `output: 'standalone'`
yang tidak membawa sesuatu yang dibutuhkan saat runtime.

Tiga hal memblokirnya sekaligus hari ini:

1. **Tidak ada image untuk branch `dev-*`.** Workflow Docker hanya terpicu oleh
   push ke `main` dan pull request ke `main`. Tiket yang di-merge ke branch dev
   tidak menghasilkan artefak apa pun untuk di-deploy.
2. **Instance Dokploy non-production kosong sepenuhnya.** Tidak ada project,
   registry credential, server, maupun destination. Belum ada apa pun untuk
   dituju.
3. **Skema basis data tidak ikut naik.** Migrasi dijalankan manusia dengan
   tangan, jadi tiap tiket yang menyentuh skema akan meninggalkan lingkungan
   rusak sampai ada yang ingat.

## Solution

Push ke branch `dev-*` memicu satu rantai: tes → build image → deploy ke
lingkungan non-production, dan hasilnya bisa dilihat di sebuah subdomain
staging dalam hitungan menit. Rantai itu berhenti di langkah mana pun yang
gagal, dan status akhirnya terbaca dari GitHub tanpa perlu membuka panel
Dokploy.

Satu titik keputusan manusia dipertahankan: **push tetap dilakukan manusia.**
Skill `/implement` berhenti di commit, dan itu tidak diubah — push adalah
kesempatan terakhir membatalkan sebelum kode berjalan di mesin nyata.

`main` **tidak** ikut auto-deploy. Ia menuju production, yang tetap manual.

## User Stories

1. Sebagai pengembang, saya ingin push ke branch `dev-*` otomatis memicu deploy
   ke non-production, sehingga saya tidak perlu mengingat langkah manual apa pun
   setelah tiket selesai.
2. Sebagai pengembang, saya ingin `/implement` tetap berhenti di commit, sehingga
   selalu ada satu titik di mana saya membaca diff sebelum apa pun berjalan di
   mesin nyata.
3. Sebagai pengembang, saya ingin deploy dibatalkan bila tes gagal, sehingga
   non-production tidak pernah menyajikan kode yang bahkan `tsc` pun menolaknya.
4. Sebagai pengembang, saya ingin push ke `main` **tidak** memicu deploy
   non-production, sehingga jalur menuju production tetap terpisah dan sadar.
5. Sebagai pengembang, saya ingin tiap image ditandai dengan sha commit-nya,
   sehingga saya selalu tahu persis kode mana yang sedang hidup di staging.
6. Sebagai pengembang, saya ingin bisa mengembalikan staging ke sha sebelumnya
   dengan satu prosedur tertulis, sehingga deploy yang rusak tidak menghalangi
   pekerjaan lain.
7. Sebagai pengembang, saya ingin workflow GitHub gagal (merah) bila build di
   Dokploy gagal, sehingga saya tidak perlu membuka panel untuk memastikan
   deploy berhasil.
8. Sebagai pengembang, saya ingin workflow berhenti dengan galat yang jelas bila
   deploy menggantung melewati batas waktu, sehingga job tidak menyandera runner
   tanpa akhir.
9. Sebagai pengembang, saya ingin skema basis data non-production ikut naik
   bersama kodenya, sehingga tiket yang menyentuh skema tidak meninggalkan
   lingkungan rusak.
10. Sebagai pengembang, saya ingin migrasi otomatis **tidak** menyala di
    production, sehingga kebijakan "migrasi production dijalankan manusia" tetap
    berlaku tanpa pengecualian.
11. Sebagai pengembang, saya ingin gambar unggahan bertahan melewati deploy,
    sehingga staging tidak kehilangan seluruh berkasnya setiap kali kode naik.
12. Sebagai pengembang, saya ingin staging diakses lewat subdomain ber-TLS,
    sehingga cookie sesi ber-`Secure` berperilaku sama seperti di production.
13. Sebagai pengembang, saya ingin staging tidak terindeks mesin pencari,
    sehingga tidak ada halaman staging yang muncul di hasil pencarian publik.
14. Sebagai pengembang, saya ingin panel Dokploy sendiri diakses lewat TLS,
    sehingga API key tidak melintasi internet dalam bentuk terbaca setiap kali
    workflow berjalan.
15. Sebagai pengembang, saya ingin image di GHCR tetap privat dan ditarik dengan
    kredensial tersimpan, sehingga isi image tidak terbuka untuk publik.
16. Sebagai pengembang, saya ingin kredensial registry disimpan sekali di
    Dokploy dan dipakai ulang, sehingga menambah aplikasi berikutnya tidak
    berarti menempelkan kredensial lagi.
17. Sebagai pengembang, saya ingin variabel lingkungan aplikasi dikelola di
    panel Dokploy dan tidak pernah dikirim ulang oleh CI, sehingga kredensial
    tidak tersebar di dua tempat dan penyetelan manual saya tidak tertimpa
    diam-diam.
18. Sebagai pengembang, saya ingin bisa mengisi staging dengan salinan data
    production sesuai kebutuhan, sehingga saya bisa mereproduksi persoalan yang
    hanya muncul pada bentuk data nyata.
19. Sebagai pengembang, saya ingin penyalinan data itu berjalan lewat mesin saya
    sebagai perantara, sehingga tidak ada kunci SSH permanen dari mesin
    non-production ke production.
20. Sebagai pengembang, saya ingin penyalinan data **tidak** menjadi bagian
    pipeline deploy, sehingga deploy tetap berdurasi detik dan tidak pernah
    menjalankan operasi destruktif secara otomatis.
21. Sebagai agen yang menjalankan `/implement`, saya ingin tiket yang menuntut
    akses manusia ditandai `ready-for-human`, sehingga saya berhenti dan meminta
    bantuan alih-alih menebak.
22. Sebagai agen, saya ingin fungsi penafsir status deploy punya tes, sehingga
    status tak terduga dari Dokploy ketahuan dalam hitungan detik, bukan lewat
    deploy yang menggantung.
23. Sebagai peninjau, saya ingin seluruh alur deploy terbaca dari satu berkas
    workflow, sehingga saya tidak perlu melacak pemicu lintas berkas untuk tahu
    apa yang terjadi setelah push.
24. Sebagai peninjau, saya ingin alasan di balik migrasi-di-entrypoint dan data
    production-di-staging tercatat sebagai ADR, sehingga tidak ada yang
    "membetulkannya" enam bulan lagi tanpa tahu itu disengaja.

## Implementation Decisions

### Bentuk deployment

Aplikasi berjalan sebagai **Dokploy Application dengan Docker provider**, bukan
Docker Compose. Image dibangun GitHub Actions dan Dokploy hanya menariknya —
build tidak pernah terjadi di VPS, sehingga RAM VPS tidak menjadi batasan.
Konsekuensinya seluruh router `compose.*` tidak dipakai.

`serverId` dikosongkan pada semua pemanggilan: instance melaporkan nol server
terdaftar, yang berarti deploy jatuh ke host Dokploy itu sendiri.

### Rantai workflow

`ci.yml` dan `docker.yml` **dilebur menjadi satu berkas workflow** dengan tiga
job berantai lewat `needs:`: `test` → `build-push` → `deploy`. Peleburan ini
wajib, bukan preferensi: `needs:` hanya berlaku antar-job di dalam satu
workflow, sehingga menggerbangi deploy pada tes yang lulus mustahil selama
keduanya berada di berkas terpisah. Alternatif `workflow_run` ditolak karena ia
berjalan dalam konteks default branch dengan sha yang tidak selalu sama dengan
yang memicunya.

Pemicu: pull request ke `main` dan `dev-*` (perilaku CI sekarang dipertahankan),
ditambah push ke `main` dan `dev-*`. Job `deploy` hanya berjalan untuk **push ke
`dev-*`** — bukan pull request, bukan `main`.

Bila dua branch `dev-*` hidup bersamaan, keduanya menuju satu lingkungan staging
dan push terakhir menang. Ini diterima sadar; menguncinya ke satu nama branch
adalah perubahan satu baris bila kelak ada kontributor kedua.

### Penandaan image

Image ditandai `sha-<commit-sha>`, dan job deploy menyetel tag itu lewat
`application.saveDockerProvider` sebelum memanggil `application.deploy`. Tag
mengambang seperti `latest` atau `staging` ditolak: dengan sha-pinning, kode
yang hidup di staging selalu diketahui persis, dan rollback menjadi pemanggilan
endpoint yang sama dengan sha lama.

### Kontrak API Dokploy

Base URL berbentuk `<host>/api/<router>.<procedure>`; autentikasi lewat header
`x-api-key`. Router yang dipakai: `project`, `environment`, `registry`,
`postgres`, `application`, `domain`, `deployment`.

Tiga hal belum diketahui dan **harus dibaca dari OpenAPI spec instance**, bukan
diasumsikan:

- Cara memasang volume. Daftar router resmi Dokploy tidak memuat `mounts`, jadi
  volume kemungkinan diatur lewat `application.update` atau router yang tidak
  terdokumentasi.
- Nama dan argumen procedure untuk membaca status deployment.
- Field wajib `postgres.create`.

### Provisioning

Instance non-production kosong, sehingga seluruh objek dibuat sekali lewat API:
project → environment → registry credential (PAT GitHub ber-scope
`read:packages`) → postgres → application → volume → domain. Variabel lingkungan
disetel **sekali** saat provisioning; sesudah itu panel Dokploy adalah sumber
kebenaran dan CI tidak pernah memanggil `application.saveEnvironment`.

Skrip bootstrap idempotent ditolak: ia membangun abstraksi untuk lingkungan
kedua yang belum tentu ada. Bila kelak dibutuhkan yang ketiga, barulah dibuat.

Versi Postgres non-production menyamai production (`18.3`), agar `pg_dump` dari
production dapat direstore tanpa halangan versi.

### Izin volume

Aplikasi berjalan sebagai uid 1001 sementara volume baru dimiliki root, sehingga
tulis pertama akan gagal. Karena tidak ada Compose, tidak ada tempat bagi init
container ber-`chown` yang dipakai di production. Izin karena itu ditegakkan
**sekali saat provisioning** lewat perintah manual di host. Ini menyimpang dari
ADR 0006 yang justru menolak langkah manual; penyimpangannya disengaja dan
terbatas pada non-production, dengan alasan bahwa mengubah bentuk deployment
production semata demi satu perintah adalah harga yang salah.

### Migrasi

Sesuai ADR 0008: stage `runner` membawa `drizzle-kit` dan folder migrasi, dan
entrypoint menjalankan migrasi hanya bila `RUN_MIGRATIONS=1`. Non-production
juga menyetel `DB_GUARD_ACK=1`, karena `DATABASE_URL`-nya menunjuk hostname
jaringan Docker dan pagar `db-guard` akan menolaknya sebagai production.

### Modul baru

Satu modul di `src/lib/dokploy/` memuat fungsi murni penafsir status deployment
dan klien HTTP tipis di sebelahnya. Satu skrip di `src/scripts/` menjadi titik
masuk yang dipanggil workflow. Bentuknya mengikuti `src/lib/db-guard/` — logika
yang layak diuji di `lib`, pemanggil tipis di `scripts`.

### Rahasia

Tiga rahasia GitHub Actions: URL instance, API key, dan id aplikasi. Kredensial
production tidak pernah masuk ke repositori maupun ke GitHub Secrets sebagai
bagian pekerjaan ini.

## Testing Decisions

Sebagian besar pekerjaan ini **tidak punya seam**, dan itu sifat pekerjaannya,
bukan kelalaian. Workflow YAML hanya terverifikasi dengan dijalankan; entrypoint
container menuntut container yang benar-benar berjalan; provisioning adalah
panggilan sekali-jalan yang hasilnya adalah keadaan sistem eksternal.
Verifikasinya adalah deploy pertama yang berhasil ke staging — yang persis
merupakan tugas staging.

**Satu seam yang diuji: penafsiran status deployment.** Sebuah fungsi murni
menerima respons status dari Dokploy dan mengembalikan salah satu dari
`running`, `success`, `failure`, atau `timeout`. Ia diuji karena himpunan status
Dokploy belum diketahui saat spec ini ditulis; ketika kelak muncul status yang
tak terduga, kegagalannya harus tampak dalam hitungan detik lewat `bun test`,
bukan lewat job CI yang menggantung.

Tes hanya menyentuh perilaku eksternal fungsi itu: respons masuk, keputusan
keluar. Klien HTTP, orkestrasi deploy, dan provisioning **tidak** diuji — pola
yang sama dengan `src/scripts/assets-pull.ts`, yang murni I/O dan memang tidak
bertes.

Prior art untuk bentuk tesnya: `src/lib/db-guard/database-url.test.ts` dan
`src/lib/db-guard/consent.test.ts` — fungsi murni, tabel kasus, tanpa mock
jaringan.

## Out of Scope

| Di luar cakupan | Alasan |
| --- | --- |
| CD ke production | Tujuan pekerjaan ini adalah membuktikan polanya di non-production dulu |
| Migrasi otomatis di production | ADR 0008; tetap dijalankan manusia |
| Preview environment per branch | Melipatgandakan seluruh provisioning untuk persoalan yang belum ada |
| Rollback otomatis lewat `workflow_dispatch` | Prosedur manual cukup untuk non-production; menjadi wajib bila pola ini naik ke production |
| RustFS | Perannya sudah menjadi sasaran backup, di luar siklus deploy |
| Adminer | Tidak pernah masuk lingkungan selain lokal |
| Backup destination Dokploy untuk non-production | Isi staging adalah salinan; tidak ada yang perlu diselamatkan |
| Penyamaran data production yang disalin ke staging | ADR 0009 — dibatalkan, bukan ditambal, bila staging dibuka lebih luas |
| Mengubah `/implement` agar ikut push | Titik keputusan manusia dipertahankan sengaja |

## Further Notes

**Kredensial instance non-production** ada di `.env.local` sebagai
`DOKPLOY_NONPROD_URL` dan `DOKPLOY_NONPROD_API_KEY`. Berkas itu tidak masuk git,
dan alamat host tidak dicatat di sini karena `.scratch/` ikut ter-commit.

**Panel Dokploy saat ini melayani HTTP telanjang di sebuah alamat IP.** Memasang
domain ber-TLS pada panel adalah prasyarat, bukan pelengkap: tanpanya, tiap
deploy menyiarkan API key yang memegang kendali penuh atas instance — termasuk
kemampuan membaca seluruh variabel lingkungan tiap aplikasi di dalamnya.

**Urutan ketergantungan.** Fase infrastruktur mendahului fase kode, karena id
aplikasi yang lahir dari provisioning adalah masukan bagi workflow.

```
01 prasyarat DNS/TLS/PAT (human)
      │
      └── 03 lingkungan Dokploy (human) ──┐
                                          ├── 04 push mendarat di staging (agen)
02 image dev-* + entrypoint (agen) ───────┘         │
                                                    └── 05 data & runbook (human)
```

Dua akar yang bisa dikerjakan bersamaan: **01** menyiapkan mesin dan
kredensialnya, **02** menyiapkan artefaknya. Keduanya bertemu di **04**, yang
merupakan tracer bullet fitur ini — setelah 04 selesai, masalah yang melahirkan
pekerjaan ini sudah terpecahkan, dan **05** adalah pematangan.
