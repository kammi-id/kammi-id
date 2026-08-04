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

## Kenapa `ready-for-human`

`103.126.117.171:5432/kammi-id` adalah non-localhost, dan aturan yang ditetapkan
pengguna 4 Agustus 2026 menyatakan **non-localhost dianggap production** (lihat
tiket `01`). Jadi klasifikasinya tidak lagi jadi pertanyaan terbuka: sampai ada
yang membuktikan sebaliknya, host itu production.

Yang tersisa justru lebih berat daripada sekadar klasifikasi — **menilai apa yang
sudah terlanjur mengenainya.**

`bun test` dijalankan rutin selama beberapa sesi terakhir, termasuk dua kali full
suite pada 4 Agustus 2026. Sembilan berkasnya menjalankan
`TRUNCATE TABLE "user", "member", training, training_attendants, organization CASCADE`
di tiap `beforeEach`, terhadap host itu. Tidak ada satu pun pagar yang
menghalanginya, dan tidak ada yang bertanya lebih dulu.

Satu bukti tandingan, dicatat supaya penilaiannya jujur: kalau host itu benar
production, `TRUNCATE` atas `"user"` dan `"member"` berulang kali akan langsung
terlihat — orang gagal masuk, data Kader hilang. Tidak ada tanda itu terjadi.
Jadi kemungkinan besar ia basis data pengembangan yang kebetulan remote. Tapi
"kemungkinan besar" bukan dasar untuk memutuskan, dan yang memegang faktanya
manusia, bukan agen. Itu sebabnya tiket ini tidak turun ke `ready-for-agent`.

- [ ] Dipastikan host itu benar-benar production atau bukan — dengan melihat, bukan menyimpulkan
- [ ] Dinilai apa yang sudah mengenainya: `bun test`, `db:reset`, `db:push`
- [ ] Kalau ternyata production — kredensial di `.env.local` dirotasi
- [ ] `DATABASE_URL` tes terpisah dari `DATABASE_URL` aplikasi
- [ ] Basis data tes hidup di mesin yang menjalankan tes (container lokal, seperti CI)
- [ ] Caranya terdokumentasi, supaya pagar tiket 01 tidak jadi penghalang
- [ ] `tests/access-control.test.ts` hijau sepuluh kali berturut-turut
