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

Pertanyaan pertamanya bukan pertanyaan teknis: **apakah
`103.126.117.171:5432/kammi-id` itu basis data yang sama dengan production?**

Tidak ada yang mencatatnya di repo, dan aplikasinya sudah jalan di production
dengan data nyata. Jawabannya menentukan apakah ini pekerjaan kebersihan atau
insiden. Agen tidak boleh menjawabnya sendirian, dan tidak boleh menebaknya.

- [ ] Terjawab: host di `.env.local` itu production, staging, atau bukan keduanya
- [ ] Kalau ternyata production — dinilai apakah pernah ada `bun test`, `db:reset`,
      atau `db:push` yang mengenainya, dan kredensialnya dirotasi
- [ ] `DATABASE_URL` tes terpisah dari `DATABASE_URL` aplikasi
- [ ] Basis data tes hidup di mesin yang menjalankan tes (container lokal, seperti CI)
- [ ] Caranya terdokumentasi, supaya pagar tiket 01 tidak jadi penghalang
- [ ] `tests/access-control.test.ts` hijau sepuluh kali berturut-turut
