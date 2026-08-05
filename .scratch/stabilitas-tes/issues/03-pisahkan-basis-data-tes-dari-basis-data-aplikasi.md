# 03 — Pisahkan basis data tes dari basis data aplikasi

**What to build:** `bun test` punya basis datanya sendiri, yang hidup di mesin
yang menjalankannya.

**Blocked by:** None. Berdiri sendiri dari tiket 01 — pagar itu tetap benar
entah pemisahan ini terjadi atau tidak.

**Status:** ready-for-human

Tiket 01 memasang pagar supaya kerusakan tidak terjadi diam-diam. Tiket ini
menghilangkan keadaan yang membuat pagar itu perlu tiap hari.

Sekarang `.env.local` hanya punya satu `DATABASE_URL`, dan ia dipakai `next dev`
sekaligus `bun test`. Selama itu benar, tiap `bun test` adalah `TRUNCATE` ke
basis data yang juga dipakai untuk hal lain — dan itulah sumber `hook timed out`
dan deadlock 40P01 yang selama ini disebut flaky.

CI sudah melakukan hal yang benar dan bisa dicontoh langsung:
`.github/workflows/ci.yml` menyalakan `postgres:16` sebagai service dan menimpa
`DATABASE_URL` ke `postgres://postgres:postgres@localhost:5432/kammi_test`.

## Yang sudah terjadi: nyaris, bukan insiden

Dicatat lengkap karena inilah pembenaran terkuat untuk tiket 01, dan karena
versi yang salah sempat tertulis di tiket ini.

Pada 4 Agustus 2026, `bun test` dijalankan lima kali terhadap
`103.126.117.171:5432/kammi-id` — dua kali full suite, tiga kali berkas tunggal.
Sesi-sesi sebelumnya menjalankannya juga. Sembilan berkas tes menjalankan
`TRUNCATE TABLE "user", "member", training, training_attendants, organization CASCADE`
di tiap `beforeEach`. Tidak ada pagar yang menghalangi, dan `DATABASE_URL` tidak
diperiksa lebih dulu.

Probe read-only setelahnya menemukan basis data itu kosong: `member`, `training`,
`article`, `site_settings`, `session` semuanya nol. Yang tersisa cuma
`organization` = 4 — persis jumlah fixture `beforeEach` di
`training-detail-view/action.test.ts` (PW Jabar, PW Jatim, PK ITB, PK Other).
Isinya residu tes, bukan data.

**Data production tidak hilang.** Host itu memang server production, tapi basis
data `kammi-id` di atasnya bukan basis data yang dipakai aplikasi — dikonfirmasi
pengguna 4 Agustus 2026. `DATABASE_URL` sudah dipindahkan ke server lain sejak
itu.

Dua koreksi yang harus ikut tercatat, supaya riwayatnya tidak menyesatkan:

1. Tiket ini sempat menyatakan host itu basis data production. **Itu keliru** —
   kesimpulan dari aturan klasifikasi, bukan dari melihat. Aturannya benar
   sebagai pagar; ia tidak pernah dimaksudkan sebagai pernyataan fakta.
2. Sempat pula ditulis penalaran sebaliknya — "kalau benar production pasti
   langsung terlihat, jadi kemungkinan besar bukan". **Itu juga tidak layak
   dipakai.** Ketiadaan tanda kerusakan bukan bukti tidak ada kerusakan.

Yang tersisa sesudahnya bukan pemulihan data, melainkan menutup jaraknya: satu
salah ketik pada `DATABASE_URL`, dengan kredensial yang sama dan server yang
sama, memisahkan kejadian ini dari kejadian yang sesungguhnya.

- [x] Dipastikan host itu production atau bukan — bukan production, dikonfirmasi pengguna
- [x] Dinilai apa yang sudah mengenainya — basis data non-production, isinya residu tes
- [ ] `DATABASE_URL` tes terpisah dari `DATABASE_URL` aplikasi
- [ ] Basis data tes hidup di mesin yang menjalankan tes — **lokal**, bukan server remote lain
- [ ] Caranya terdokumentasi, supaya pagar tiket 01 tidak jadi penghalang
- [ ] `tests/access-control.test.ts` hijau sepuluh kali berturut-turut

## Comments

**Memindahkan `DATABASE_URL` ke server remote yang lain tidak menyelesaikan
tiket ini.** Ia memindahkan sasarannya, bukan menghapusnya: `TRUNCATE` tiap
`beforeEach` tetap lewat jaringan (sumber `hook timed out` dan deadlock 40P01),
dan tetap mengenai basis data yang dipakai bersama sesuatu yang lain.

Yang menyelesaikannya cuma basis data tes yang hidup di mesin yang menjalankan
tesnya. `.github/workflows/ci.yml` sudah melakukannya — `postgres:16` sebagai
service, `DATABASE_URL` ditimpa ke `localhost:5432/kammi_test`. Contek itu.

---

### Scope yang disepakati, 5 Agustus 2026

Ronde pertama tiket ini dibuang seluruhnya karena scope-nya tidak disepakati di
depan. Dua pertanyaan itu sekarang sudah dijawab pengguna:

**1. Jalurnya: Docker.** Bukan Postgres native. Service `db-test` di
`docker-compose.yml`, senapas dengan `db` dan Adminer yang sudah ada di sana.

Usulan Postgres native lewat Homebrew **diajukan dan ditolak.** Alasan
pengajuannya: tidak satu pun checkbox tiket ini menuntut Docker. Pengguna
memilih tetap Docker demi konsistensi dengan compose yang sudah ada. Dicatat di
sini supaya tidak diajukan ulang tanpa alasan baru.

### Koreksi: restart mesin belum pernah terjadi

Handoff sesi 4 Agustus menyatakan pengguna me-restart mesin untuk membangunkan
daemon, dan sesi ini sempat mengulanginya sebagai fakta. **Keduanya keliru,**
dan keliru karena klaimnya ditelan tanpa diperiksa.

Diverifikasi 5 Agustus 2026:

```
uptime            → up 17 days, 4:26
kern.boottime     → Sun Jul 19 18:02:02 2026
com.docker.backend → berjalan 17 hari 4 jam, tanpa putus
~/.docker/run/docker.sock → mtime Jul 19 18:18
```

Log backend berhenti di `2026-08-03T12:48` — daemon-nya **nyangkut**, bukan mati,
dan sudah nyangkut dua hari. Jadi restart bukan langkah yang sudah gagal; ia
langkah yang **belum pernah dijalankan**. Itu kandidat perbaikan pertama, bukan
terakhir.

**2. Batasnya: dua hal, lalu buktikan hijau.**

- `DATABASE_URL` tes terpisah dan menunjuk localhost.
- `tests/access-control.test.ts` hijau sepuluh kali berturut-turut.

Docs, skrip penyalaan, dan penyelarasan `ci.yml` **menyusul terpisah**, setelah
hijau terbukti. Itu kebalikan langsung dari ronde pertama, yang menulis 67 baris
konfigurasi tanpa satu pun tes pernah hijau lewat `db-test`.

**Prasyarat mutlak: daemon Docker harus terbukti hidup dulu.**
`docker info --format '{{.ServerVersion}}'` harus balas dalam hitungan detik.
Kalau masih gantung — **berhenti dan bilang, jangan menulis konfigurasi.**
Menulis implementasi selama feedback loop-nya mati adalah cara ronde pertama
berakhir di tempat sampah.

### Hubungannya dengan tiket 01

Tiket 01 sudah mendarat (`dfffa85`, 8/9). Pagarnya memperlakukan non-localhost
sebagai production, jadi basis data tes di sini **harus** localhost — kalau ya,
ia lolos senyap tanpa `DB_GUARD_ACK` apa pun, persis seperti CI hari ini.

Checkbox docs di tiket ini sepasang dengan checkbox no.9 tiket 01 yang sengaja
dibiarkan terbuka. Keduanya tutup bersama, dalam putaran setelah hijau terbukti.
