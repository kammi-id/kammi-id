# Deployment production ke project Dokploy baru

Runbook ini memindahkan KAMMI ID dari stack production lama ke project Dokploy
baru pada server production yang sama. Ia adalah controlled release manual,
bukan pipeline CD production. [ADR 0015](../adr/0015-production-baru-di-project-dokploy-terpisah.md)
menetapkan topologinya; ADR 0006–0009 menetapkan storage, cache gambar,
migrasi, dan sumber data staging.

## Hasil yang dituju

- Project baru mengikuti resource graph staging, tetapi memiliki PostgreSQL,
  named volume, secret, kapasitas, dan nama resource production sendiri.
- Image yang diuji di staging dan yang berjalan di production memiliki digest
  yang sama.
- Write berhenti selama final dump/restore dan sinkronisasi aset; RPO cutover
  adalah nol dan target pulih atau batal maksimal 60 menit.
- RustFS tetap berada di project lama, melayani `assets.kammi.id`, dan menjadi
  sasaran backup. Aplikasi baru hanya membaca dan menulis volume lokal.
- Setelah write dibuka pada project baru, stack lama tidak dipakai sebagai
  rollback langsung.

## Peran

- **Deployment lead** menjalankan checklist dan mencatat bukti setiap gate.
- **Product/data owner** memutuskan go/no-go dan rollback.
- Kedua peran harus hadir sejak write freeze sampai pengawasan aktif selesai.

Catat waktu, operator, release SHA, image digest, hasil setiap gate, dan alasan
setiap keputusan. Jangan mencatat nilai secret.

## Invarian dan kondisi STOP

Hentikan deployment bila salah satu kondisi berikut terjadi:

- worktree kandidat berubah setelah release freeze;
- image staging dan production tidak menunjuk digest yang sama;
- backup atau restore rehearsal belum terbukti;
- migration journal tidak dapat direkonsiliasi satu per satu;
- ditemukan duplikat `organization.code`, atau konflik data lain yang tidak
  punya koreksi terpisah dan diaudit;
- final dump/restore tidak muat dalam maintenance window 60 menit;
- volume tidak dimiliki UID/GID `1001:1001`, salinan aset tidak cocok, atau
  kapasitas disk tidak cukup;
- apex, `www`, wildcard tenant, atau exact route `assets.kammi.id` tidak
  mempunyai routing/TLS yang benar;
- health check, smoke test, log, atau jalur notifikasi insiden belum siap;
- ada fakta production yang berbeda dari asumsi runbook ini.

Jangan memperbaiki data secara improvisasi selama window. Batalkan, buka
pekerjaan koreksi tersendiri, lalu ulangi release gate dari SHA baru bila kode
berubah.

## Prasyarat yang belum tersedia di repo

Runbook tidak boleh dijalankan sebelum item berikut selesai:

- endpoint liveness dan readiness, dengan readiness memeriksa koneksi
  PostgreSQL serta ketersediaan dan izin volume upload;
- external uptime monitor dan jalur notifikasi insiden;
- Application maintenance kecil tanpa dependency database;
- cara teruji menjalankan `check:duplicates` terhadap PostgreSQL baru. Release
  image saat ini membawa migrasi tetapi tidak membawa
  `src/scripts/check-duplicates.ts`; jangan menganggap script itu tersedia di
  container;
- akses read-only untuk memeriksa service, network, volume, domain, sertifikat,
  backup, sesi PostgreSQL, dan kapasitas host production;
- cara teruji menjalankan release image sebagai one-shot migration container
  di network PostgreSQL baru, termasuk cara menerapkan dan membuktikan lock
  timeout 10 detik.

## Kontrak resource project baru

Gunakan nama aktual dari Dokploy/API; jangan mengasumsikan nama tampilan sama
dengan nama container atau service.

| Resource    | Kontrak                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------- |
| Application | Image `ghcr.io/kammi-id/kammi-id` dipatok ke digest kandidat; satu replica selama deployment        |
| PostgreSQL  | Instance baru, versi production yang sudah diverifikasi; tidak berbagi database dengan project lama |
| Upload      | Named volume unik, mount ke `/data/uploads`, dimiliki `1001:1001`                                   |
| Cache       | Named volume unik, mount ke `/app/.next/cache`, dimiliki `1001:1001`                                |
| Maintenance | Application statis sementara untuk apex, `www`, dan wildcard tenant                                 |
| RustFS      | Tetap di project lama dan tetap memiliki exact route `assets.kammi.id`                              |

Environment Application baru, nama saja:

```text
DATABASE_URL
UPLOADS_DIR=/data/uploads
API_CO_ID_TOKEN
CACHE_REVALIDATE_SECRET
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

Jangan set `RUN_MIGRATIONS` atau `DB_GUARD_ACK` permanen pada Application
production. Keduanya hanya boleh hadir pada one-shot migration container dan
dihapus bersama container tersebut.

## Fase 1 — Bekukan kandidat

- [ ] Merge kandidat ke `main`; jangan deploy branch pengembangan langsung.
- [ ] Catat full commit SHA dan tunggu CI selesai.
- [ ] Pastikan format, lint, structure, types, unit test, E2E, migrasi dari DB
      kosong, build, browser runtime, dan Next.js DevTools `get_errors` lulus.
- [ ] Catat image `sha-<7 karakter>` dan resolve digest immutable-nya.
- [ ] Deploy digest itu ke staging—bukan hasil rebuild lokal.
- [ ] Jalankan matriks release gate di
      `.scratch/reset-password-akun-kepengurusan/issues/05-verifikasi-dan-release-gate-production.md`.
- [ ] Bekukan SHA. Perubahan apa pun menghasilkan kandidat baru dan mengulang
      fase ini.

## Fase 2 — Rehearsal dengan salinan production

- [ ] Ambil `pg_dump -Fc` terbaru dari PostgreSQL production lama.
- [ ] Restore ke PostgreSQL rehearsal dengan opsi `--clean`, `--if-exists`,
      `--no-owner`, dan `--no-privileges`.
- [ ] Rekonsiliasi `drizzle.__drizzle_migrations` satu per satu. Untuk setiap
      migration folder yang tidak tercatat, baca SQL dan buktikan efeknya pada
      schema sebelum menandainya applied. Ambiguitas berarti STOP.
- [ ] Jalankan preflight duplikat terhadap database hasil restore. Duplikat
      `code` berarti STOP; jangan mengubah Nomor Induk Anggota secara mekanis.
- [ ] Jalankan migrasi kandidat dan catat durasi serta lock.
- [ ] Buktikan stack lama tetap utuh dan dapat kembali melayani tanpa memakai
      PostgreSQL atau volume project baru. Migrasi hanya boleh menyentuh
      salinan database di project baru.
- [ ] Jalankan aplikasi kandidat terhadap DB rehearsal dan seluruh smoke test.
- [ ] Ukur dump dan restore penuh. Totalnya harus menyisakan waktu yang cukup
      untuk migrasi, asset sync, smoke test, dan rollback dalam window 60 menit.
- [ ] Lakukan restore drill DB dan volume dari backup Dokploy/RustFS, bukan
      sekadar memeriksa status job backup.

## Fase 3 — Provision project baru

- [ ] Buat project dan environment production baru pada server production
      yang sama.
- [ ] Buat PostgreSQL baru dengan credential unik.
- [ ] Buat named volume upload dan cache dengan nama yang tidak dipakai
      project lain. Periksa dengan inventory volume host, bukan dari nama
      tampilan Dokploy saja.
- [ ] Mount upload ke `/data/uploads` dan cache ke `/app/.next/cache`.
- [ ] Jalankan helper/root init yang melakukan `chown -R 1001:1001` pada kedua
      volume. Ulangi setelah setiap operasi copy yang berjalan sebagai root.
- [ ] Konfigurasikan backup PostgreSQL dan kedua volume; catat jadwal, retensi,
      serta tujuan RustFS/snapshot provider.
- [ ] Konfigurasikan environment Application tanpa `RUN_MIGRATIONS` dan
      `DB_GUARD_ACK`.
- [ ] Deploy kandidat memakai digest immutable pada hostname validasi yang
      tidak mengambil Host rule production.
- [ ] Verifikasi liveness, readiness, log redaction, uptime monitor, dan jalur
      notifikasi.

Hostname yang tidak berakhiran `.kammi.id` diperlakukan sebagai apex oleh
aplikasi dan dapat dipakai untuk smoke PP/dashboard. Uji tenant subdomain dari
network internal dengan header `Host: <slug>.kammi.id`; jangan memasang wildcard
production pada Application baru sebelum cutover.

## Fase 4 — Pre-copy dan preflight production

- [ ] Periksa service lama dan baru benar-benar berada pada server/Swarm yang
      disepakati; catat network aktualnya.
- [ ] Periksa versi PostgreSQL, migration journal, ukuran DB, sesi aktif, lock,
      kapasitas disk, dan status backup terbaru.
- [ ] Periksa apex, `www`, wildcard `*.kammi.id`, dan `assets.kammi.id` memiliki
      TLS valid. Pastikan reverse proxy mempertahankan header `Host`.
- [ ] Pastikan exact router `assets.kammi.id` menang atas wildcard aplikasi dan
      tetap menuju RustFS lama.
- [ ] Pre-copy seluruh bucket RustFS ke volume upload baru dengan key persis
      sama. Jangan mengubah URL atau baris database.
- [ ] Catat jumlah file, total byte, dan manifest hash sumber serta tujuan.
- [ ] Ulangi `chown -R 1001:1001` dan buktikan Application dapat membaca serta
      menulis volume.
- [ ] Ambil dump awal ke PostgreSQL baru, rekonsiliasi journal, migrasikan, dan
      jalankan smoke test awal. Dump ini hanya rehearsal; final dump tetap
      dilakukan setelah write freeze.
- [ ] Siapkan snapshot/checkpoint pre-deploy dan pastikan image lama masih
      tersedia minimal 30 hari.
- [ ] Product/data owner menandatangani go menuju maintenance.

## Fase 5 — Masuk maintenance dan bekukan write

- [ ] Catat waktu mulai dan deadline abort agar RTO 60 menit tidak terlewati.
- [ ] Lepaskan apex, `www`, dan wildcard dari Application lama.
- [ ] Pasang ketiga Host rule tersebut pada Application maintenance. Jangan
      pernah memasang Host rule yang sama pada dua Application sekaligus.
- [ ] Verifikasi maintenance page dari apex dan satu tenant subdomain.
- [ ] Buktikan Application lama tidak lagi menerima trafik/write dan tidak ada
      writer PostgreSQL aktif. Jangan mematikan sesi secara paksa.
- [ ] Ambil snapshot DB dan storage lama setelah write berhenti. Inilah
      checkpoint RPO 0.

## Fase 6 — Salin data final

- [ ] Ambil final `pg_dump -Fc` dari PostgreSQL lama.
- [ ] Restore penuh ke PostgreSQL baru dengan opsi yang telah diuji saat
      rehearsal.
- [ ] Rekonsiliasi migration journal lagi; restore menimpa ledger dengan milik
      production lama. Verifikasi setiap migration yang tampak hilang satu per
      satu.
- [ ] Jalankan `check:duplicates` terhadap PostgreSQL baru. Temuan `code`
      duplikat berarti STOP dan kembali ke Application lama.
- [ ] Jalankan final delta sync RustFS ke volume upload. Hasil akhirnya harus
      menjadi mirror persis, termasuk membuang berkas tujuan yang sudah tidak
      ada di sumber.
- [ ] Bandingkan jumlah file, total byte, dan manifest hash. HTTP 200 dari
      `/api/images/*` bukan bukti karena file hilang menghasilkan placeholder
      HTTP 200.
- [ ] Ulangi `chown -R 1001:1001` pada upload dan cache volume.

## Fase 7 — Migrasikan dan hidupkan kandidat

- [ ] Pastikan Application utama masih tidak memiliki `RUN_MIGRATIONS`.
- [ ] Jalankan one-shot container dari digest kandidat pada network PostgreSQL
      baru, dengan `RUN_MIGRATIONS=1` dan acknowledgement DB guard yang
      eksplisit.
- [ ] Terapkan lock timeout 10 detik. Jika DDL tidak mendapat lock, biarkan
      transaksi rollback, STOP, dan jangan deploy kode.
- [ ] Pastikan one-shot container selesai sukses lalu hapus container beserta
      environment sementara.
- [ ] Bandingkan migration journal dan schema aktual dengan kandidat.
- [ ] Mulai Application kandidat, masih tanpa Host rule production.
- [ ] Verifikasi readiness sebelum mengirim request aplikasi.

## Fase 8 — Smoke test sebelum membuka trafik

Gunakan Akun Kepengurusan khusus smoke test pada Struktur nyata, dengan hak
minimum. Jangan membuat Struktur fiktif atau mengubah data Kader sungguhan
untuk sekadar menguji deployment.

- [ ] Login dan logout; verifikasi cookie/session production.
- [ ] Baca dasbor dan data sesuai Cakupan akun.
- [ ] Buka beranda PP, satu Situs Struktur, satu Berita, dan satu permalink.
- [ ] Buka foto Kader, logo Struktur, dan gambar Artikel lama. Bandingkan MIME,
      dimensi/byte, atau hash—bukan status HTTP saja.
- [ ] Upload gambar sintetis, baca kembali byte yang sama, lalu bersihkan lewat
      jalur aplikasi yang disepakati.
- [ ] Jalankan satu mutasi aman dan reversibel; buktikan cache invalidation dan
      audit/session tetap benar.
- [ ] Verifikasi apex, redirect `www`, tenant wildcard, dan exact
      `assets.kammi.id` memakai header `Host` pada network internal.
- [ ] Periksa log aplikasi, PostgreSQL, readiness, disk, dan 5xx.
- [ ] Ambil checkpoint DB dan volume project baru.

Kegagalan apa pun pada fase ini berarti jangan buka write. Matikan kandidat,
arahkan domain kembali ke Application lama, dan jangan down-migrate PostgreSQL
baru. Stack lama kembali memakai PostgreSQL dan storage lamanya yang tidak
disentuh migrasi.

## Fase 9 — Cutover domain dan buka trafik

- [ ] Lepaskan apex, `www`, dan wildcard dari Application maintenance.
- [ ] Pasang Host rule tersebut ke Application baru. Karena servernya sama,
      DNS tidak perlu diubah bila preflight membuktikan record sudah benar.
- [ ] Pastikan exact route `assets.kammi.id` tetap terpasang pada RustFS lama.
- [ ] Verifikasi TLS dan routing dari jaringan eksternal.
- [ ] Buka trafik/write dan catat waktu. Mulai titik ini stack lama bukan
      rollback langsung karena database dan volume baru sudah dapat menerima
      data yang tidak dimiliki stack lama.

## Fase 10 — Observasi dan penutupan

- [ ] Pantau aktif minimal 60 menit: readiness, uptime, 5xx, login, latency DB,
      disk, upload, gambar, dan log exception.
- [ ] Product/data owner menyatakan stabil atau memerintahkan roll-forward.
- [ ] Pertahankan pemantauan diperketat selama 24 jam.
- [ ] Hentikan Application lama dan cabut seluruh Host rule-nya. Pertahankan
      PostgreSQL lama tanpa writer minimal 30 hari.
- [ ] Pertahankan image lama dan snapshot pre-deploy minimal 30 hari.
- [ ] Pertahankan RustFS dan `assets.kammi.id` selama legacy URL masih hidup.
- [ ] Aktifkan dan buktikan backup berkala volume baru ke RustFS serta snapshot
      provider.
- [ ] Setelah 30 hari, penghapusan stack lama adalah pekerjaan terpisah dan
      memerlukan konfirmasi eksplisit; runbook ini tidak menghapus apa pun.

## Matriks kegagalan

| Titik gagal                                   | Tindakan                                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Sebelum maintenance                           | Batalkan tanpa perubahan trafik                                                                    |
| Final dump, restore, sync, atau migrasi gagal | Pertahankan maintenance; bila deadline abort tercapai, kembalikan domain ke app lama               |
| Kandidat gagal sebelum write dibuka           | Matikan kandidat dan kembalikan domain ke app lama; jangan down-migrate                            |
| Smoke test gagal                              | Sama seperti di atas; jangan memperbaiki langsung di production                                    |
| Setelah write dibuka                          | Tetap di project baru; rollback ke image kompatibel-volume, restore backup baru, atau roll-forward |
| Kehilangan/korupsi data                       | Aktifkan prosedur incident recovery; product/data owner memutuskan restore checkpoint              |

## Bukti penutupan

Lampirkan atau tautkan bukti berikut pada catatan rilis:

- release SHA, image tag, dan digest;
- hasil CI, staging gate, rehearsal, dan Next.js DevTools `get_errors`;
- waktu dump/restore/migrasi serta migration journal akhir;
- statistik dan manifest hash aset sebelum/sesudah;
- ID backup/snapshot dan hasil restore drill;
- hasil health check dan smoke test;
- waktu domain handoff, pembukaan write, dan akhir observasi;
- keputusan go/no-go dari kedua peran;
- daftar follow-up tanpa nilai secret.
