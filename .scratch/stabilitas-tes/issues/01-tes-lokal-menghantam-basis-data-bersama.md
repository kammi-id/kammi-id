# 01 — Tes lokal menghantam satu basis data bersama yang remote

**What to build:** `bun test` di mesin lokal harus jalan di atas basis data yang
hanya dimilikinya sendiri, dan menolak jalan kalau ternyata tidak.

**Blocked by:** None.

**Status:** ready-for-human

Gejalanya sudah lama dikenal dan selalu dilaporkan sebagai "flaky": 3–5 dari 7
tes di `tests/access-control.test.ts` gagal dengan `beforeEach/afterEach hook
timed out` pada 5000ms, kadang `PostgresError: deadlock detected` (40P01).
Selama ini dianggap sifat bawaan berkasnya.

Bukan. Penyebabnya ada di konfigurasi, bukan di berkas tesnya.

## Bukti

`.env.local` hanya punya **satu** `DATABASE_URL`, dan ia menunjuk ke host
**remote**:

```
postgresql://***@103.126.117.171:5432/kammi-id
```

Tidak ada `DATABASE_URL` kedua untuk tes. `tests/setup.ts` memuat `.env.local`
apa adanya dan tidak memeriksa apa pun. Jadi basis data yang dipakai `next dev`,
yang dipakai `bun test`, dan yang dipakai siapa pun lagi yang memegang kredensial
itu — sama persis.

Sembilan berkas tes menjalankan `TRUNCATE ... CASCADE` di `beforeEach`:

```
tests/access-control.test.ts
tests/delete-member.test.ts
tests/delete-training.test.ts
src/lib/auth/kekaderan.test.ts
src/app/(dashboard)/dashboard/kader/_components/bulk-upload/action.test.ts
src/app/(dashboard)/dashboard/trainings/_components/add-training-modal/action.test.ts
src/app/(dashboard)/dashboard/trainings/_components/training-detail-view/action.test.ts
src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/delete-member-button/action.test.ts
src/app/(dashboard)/dashboard/profile/[registerNumber]/_components/reset-password/action.test.ts
```

Dua akibat, dan keduanya cocok dengan gejalanya:

1. **Timeout.** Tiap `beforeEach` adalah `TRUNCATE` + semai lengkap lewat
   jaringan ke host remote. 5000ms itu sempit untuk itu.
2. **Deadlock.** `TRUNCATE` mengambil `ACCESS EXCLUSIVE`. Apa pun yang sedang
   memegang koneksi ke basis data yang sama — `next dev` yang menyala, sesi lain,
   orang lain — cukup untuk menabraknya.

CI **tidak** kena ini. `.github/workflows/ci.yml` menyalakan `postgres:16` sebagai
service dan menimpa `DATABASE_URL` ke `localhost:5432/kammi_test`. Terisolasi dan
lokal. Itu sebabnya masalah ini tidak pernah muncul di CI dan tidak pernah
dianggap nyata.

## Yang lebih genting dari flaky-nya

Aplikasi ini **sudah jalan di production dengan data nyata**. `bun test` di
mesin lokal menjalankan `TRUNCATE TABLE "user", "member", training,
training_attendants, organization CASCADE` terhadap host remote yang dituju
`.env.local` — apa pun host itu. Tidak ada satu pun pagar yang mencegahnya.

Kalau host itu ternyata basis data yang sama dengan yang dipakai production,
satu `bun test` yang tidak sengaja sudah cukup. **Ini yang perlu diperiksa
manusia lebih dulu, dan alasan tiket ini `ready-for-human`, bukan
`ready-for-agent`.**

## Bentuknya

- Pisahkan `DATABASE_URL` tes dari `DATABASE_URL` aplikasi. Basis data tes hidup
  di mesin yang menjalankannya — container lokal, seperti yang sudah dilakukan CI.
- Pasang pagar di `tests/setup.ts`: kalau `DATABASE_URL` tidak menunjuk ke host
  lokal (atau tidak membawa penanda tes yang eksplisit), **berhenti** dengan
  pesan yang jelas. Sebuah `TRUNCATE` tidak boleh bergantung pada berkas `.env`
  yang benar.
- Dokumentasikan cara menyalakan basis data tes lokal, supaya pagar itu tidak
  jadi penghalang.

Perhatikan: memindahkan semai ke `beforeAll` (tiket 02) **meringankan** gejalanya
tapi tidak menyentuh sebab ini. Dua tiket yang berbeda; yang ini yang utama.

- [ ] Terverifikasi apakah host di `.env.local` sama dengan basis data production
- [ ] `DATABASE_URL` tes terpisah dari `DATABASE_URL` aplikasi
- [ ] `tests/setup.ts` menolak jalan di basis data yang bukan basis data tes
- [ ] Cara menyalakan basis data tes lokal terdokumentasi
- [ ] `tests/access-control.test.ts` hijau sepuluh kali berturut-turut
