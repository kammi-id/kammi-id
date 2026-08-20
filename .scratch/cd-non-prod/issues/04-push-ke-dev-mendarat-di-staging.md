# 04 — Push ke `dev-*` mendarat di staging

**What to build:** Push satu commit ke branch `dev-*`, dan beberapa menit
kemudian subdomain staging menyajikannya — tanpa membuka panel Dokploy, tanpa
satu pun langkah manual. Bila tesnya merah, deploy tidak berjalan sama sekali.
Bila build di Dokploy gagal, job GitHub ikut merah.

Ini tracer bullet fitur ini. Setelah tiket ini selesai, masalah yang melahirkan
seluruh pekerjaan ini sudah terpecahkan.

**Blocked by:** 02 (image untuk `dev-*`), 03 (lingkungan non-production)

**Status:** ready-for-agent

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

- [ ] Fungsi murni penafsir status ada, dengan tes yang menutup keempat keluaran
- [ ] Status yang tidak dikenali diperlakukan sebagai kegagalan, bukan
      diabaikan diam-diam
- [ ] Satu perintah menyetel tag image, memicu deploy, menunggu sampai selesai,
      dan keluar dengan kode 0 hanya bila deploy berhasil
- [ ] Perintah itu punya batas waktu, dan melewatinya berarti keluar bukan-0
      dengan pesan yang menyebut sebabnya
- [ ] Perintah itu terbukti bekerja saat dijalankan dari mesin lokal, sebelum
      dipercayakan ke CI
- [ ] Job deploy menempel ke workflow dari tiket 02 dan bergantung pada job
      build lewat `needs:`
- [ ] Job deploy hanya berjalan untuk push ke `dev-*`
- [ ] Push ke `main` tidak memicu deploy non-production
- [ ] Pull request tidak memicu deploy
- [ ] Tes yang merah berarti deploy tidak berjalan sama sekali
- [ ] Push satu commit ke `dev-*` berakhir dengan subdomain staging menyajikan
      commit itu
- [ ] Build yang gagal di Dokploy membuat job GitHub merah

## Comments

Bila dua branch `dev-*` hidup bersamaan, keduanya menuju satu lingkungan staging
dan push terakhir menang. Diterima sadar — menguncinya ke satu nama branch
adalah perubahan satu baris bila kelak ada kontributor kedua.
