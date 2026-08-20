This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Basis data lokal

Ada dua basis data PostgreSQL yang berjalan lewat `docker-compose.yml`: `db`
(dipakai `next dev`) dan `db-test` (dipakai `bun test`). Keduanya sengaja
terpisah — lihat `.scratch/stabilitas-tes/issues/03-pisahkan-basis-data-tes-dari-basis-data-aplikasi.md`
untuk alasan lengkapnya. Intinya: `bun test` menjalankan `TRUNCATE` di banyak
berkas, dan itu tidak boleh mengenai basis data yang juga dipakai `next dev`.

### Menyalakan

```bash
docker compose up -d db db-test
```

`.env.local` butuh dua baris:

```
DATABASE_URL=postgres://postgres:db@localhost:5432/<nama-basis-data-db-anda>
TEST_DATABASE_URL=postgres://postgres:db@localhost:5434/kammi_test
```

`TEST_DATABASE_URL` menunjuk `db-test` — port `5434`, kredensial dari
`POSTGRES_PASSWORD` di `docker-compose.yml`. `tests/setup.ts` menimpa
`DATABASE_URL` dengannya begitu `bun test` mulai; kode aplikasi sendiri tidak
pernah membaca `TEST_DATABASE_URL` langsung.

### Migrasi

`db:migrate` selalu jalan lewat `DATABASE_URL` (lihat `drizzle.config.ts`), jadi
menjalankan migrasi terhadap `db-test` butuh menimpanya sesaat:

```bash
bun run db:migrate    # basis data db, untuk next dev
DATABASE_URL=postgres://postgres:db@localhost:5434/kammi_test bun run db:migrate    # basis data db-test, untuk bun test
```

### Pagar `DATABASE_URL`

`src/lib/db-guard/` menolak operasi merusak (`db:reset`, `db:migrate`,
`db:push`, `bun test`, dll.) begitu `DATABASE_URL` menunjuk host yang bukan
`localhost`/`127.0.0.1`/`::1`/`host.docker.internal` — dianggap production
tanpa pengecualian, dan meminta konfirmasi dengan mengetik nama basis
datanya. Localhost lolos tanpa pertanyaan. Detail dan alasan keputusannya ada
di `.scratch/stabilitas-tes/issues/01-tes-lokal-menghantam-basis-data-bersama.md`.

Untuk runner non-interaktif (agen, skrip), setel `DB_GUARD_ACK=1` untuk
memberi izin di muka — bukan jalan pintas, tapi jalur yang memang disediakan
untuk kasus tanpa TTY.

**Risiko yang diterima, disengaja:** kalau `TEST_DATABASE_URL` kosong atau
salah ketik, `DATABASE_URL` jatuh kembali ke milik `next dev` tanpa galat.
Pagar di atas tetap menolaknya *kalau* itu non-localhost — tapi di mesin yang
`next dev`-nya juga menunjuk basis data localhost (mis. service `db` di
compose ini), pagar ikut lolos senyap dan `TRUNCATE` bisa mengenai basis data
dev. Menutupnya butuh pagar kedua yang mensyaratkan `TEST_DATABASE_URL` selalu
ada — tapi CI sengaja tidak menyetelnya (`DATABASE_URL` CI sudah `localhost`
lewat service Postgres-nya sendiri), jadi pagar kedua itu harus tahu
membedakan CI dari mesin kontributor, dan itu persis jenis kerumitan yang
pagar ini hindari sejak awal. Yang dipilih: dokumentasikan risikonya di sini,
bukan tambah pagar. Selalu periksa `.env.local` punya `TEST_DATABASE_URL`
yang benar sebelum `bun test`.

### Gambar (`assets:pull`)

Gambar unggahan hidup di volume Docker (`UPLOADS_DIR`, lihat
`docs/adr/0006-gambar-di-volume-bukan-object-storage.md`), bukan di basis
data — jadi `pg_dump`/restore tidak ikut membawanya. Menariknya opsional:
tanpa ini, `/api/images/*` tetap jalan dengan placeholder untuk berkas yang
tidak ada.

```bash
PRODUCTION_ASSETS_HOST=user@host bun run assets:pull
```

Menarik langsung dari volume production lewat SSH + tar, bukan dari RustFS —
RustFS cuma sasaran backup, dan memakainya berarti mengembalikan kredensial
S3 yang sudah sengaja dicabut. Butuh akses SSH ke host production sendiri;
`PRODUCTION_ASSETS_VOLUME` opsional kalau nama volumenya bukan
`kammi-uploads`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
