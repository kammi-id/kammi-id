# 03 — Lingkungan non-production ada di Dokploy

**What to build:** Sebuah lingkungan non-production yang hidup — aplikasi
menarik image privat dari GHCR, tersambung ke Postgresnya sendiri, menulis ke
volume unggahannya sendiri, dan dilayani di subdomain staging ber-TLS. Membuka
subdomain itu menghasilkan halaman yang menjawab, dengan skema basis data sudah
terbentuk.

**Blocked by:** 01 (prasyarat DNS, TLS, PAT, rahasia)

**Status:** ready-for-human — mayoritas berjalan lewat API, tetapi izin volume
menuntut satu perintah di host lewat SSH

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

- [ ] Ketiga hal tak diketahui di atas terjawab dan tercatat di Comments
- [ ] Project dan environment non-production terbentuk
- [ ] Kredensial registry GHCR tersimpan lewat router `registry`, dan terbukti
      sanggup menarik image privat
- [ ] Postgres berjalan pada versi yang sama dengan production, agar `pg_dump`
      dari production dapat direstore tanpa halangan versi
- [ ] Application terbentuk dengan Docker provider menunjuk image ber-tag sha
- [ ] Volume `kammi-uploads` terpasang pada aplikasi
- [ ] Volume dimiliki uid 1001 — dibuktikan dengan unggahan gambar yang berhasil
      tersimpan, bukan dengan melihat sekilas
- [ ] Subdomain staging melayani aplikasi lewat HTTPS dengan sertifikat sah
- [ ] Staging tidak terindeks mesin pencari
- [ ] Variabel lingkungan tersetel **sekali** di panel: `DATABASE_URL`,
      `UPLOADS_DIR`, `API_CO_ID_TOKEN`, `RUN_MIGRATIONS=1`, `DB_GUARD_ACK=1`
- [ ] Skema basis data terbentuk saat container pertama menyala — bukti bahwa
      entrypoint dari tiket 02 bekerja di lingkungan nyata
- [ ] `applicationId` tersimpan sebagai rahasia GitHub ketiga

## Comments

Panel Dokploy adalah sumber kebenaran variabel lingkungan sejak tiket ini. CI
tidak pernah memanggil `application.saveEnvironment` — lihat spec, bagian
Implementation Decisions.
