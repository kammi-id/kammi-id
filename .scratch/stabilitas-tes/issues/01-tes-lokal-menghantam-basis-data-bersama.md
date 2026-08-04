# 01 — Pagar `DATABASE_URL` di lapisan koneksi

**What to build:** Kalau `DATABASE_URL` menunjuk ke host yang bukan mesin ini,
tidak ada operasi merusak yang boleh jalan tanpa konfirmasi yang disengaja.
Berlaku untuk semua pintu, bukan hanya tes.

**Blocked by:** None.

**Status:** ready-for-agent

## Kenapa

`.env.local` hanya punya **satu** `DATABASE_URL`, dan ia menunjuk ke host
**remote** (`103.126.117.171:5432/kammi-id`). Tidak ada yang kedua untuk tes.
Semua pintu memakainya: `next dev`, `bun test`, `drizzle.config.ts`, dan
`src/scripts/`.

Yang bisa dilakukan sebuah salah ketik hari ini:

- `bun run db:reset` → `src/scripts/reset.ts` menjalankan
  `DROP TABLE IF EXISTS <semua tabel di schema public> CASCADE`. Tanpa
  pertanyaan, tanpa peringatan.
- `bun test` → sembilan berkas menjalankan `TRUNCATE ... CASCADE` di
  `beforeEach`.
- `bun run db:push` → drizzle-kit menyelaraskan skema secara langsung.

Aplikasinya sudah jalan di production dengan data nyata. Tidak ada satu pun
pagar di antara perintah-perintah itu dan host yang ditulis `.env.local`.

Efek sampingnya — dan ini yang membuat masalahnya terlihat — `tests/access-control.test.ts`
sudah lama dianggap "flaky": `beforeEach hook timed out` pada 5000ms, kadang
`PostgresError: deadlock detected` (40P01). Dua-duanya cocok: tiap semai lewat
jaringan ke host remote, dan `TRUNCATE` mengambil `ACCESS EXCLUSIVE` sementara
koneksi lain memegang tabelnya. CI tidak pernah kena karena
`.github/workflows/ci.yml` menyalakan `postgres:16` sendiri dan menimpa
`DATABASE_URL` ke `localhost:5432/kammi_test`. Itu sebabnya masalah ini tidak
pernah terlihat nyata.

## Bentuknya

Satu modul, dipanggil semua pintu. Namanya menyebut hak yang diberikan, bukan
aksi memeriksanya — misal `assertLocalDatabase` / `requireDatabaseConsent` di
`src/lib/db-guard/`. Jangan diduplikasi ke tiap skrip.

### Mendeteksi "bukan mesin ini"

Host lokal: `localhost`, `127.0.0.1`, `::1`, `host.docker.internal`.

**Localhost adalah syarat perlu, bukan syarat cukup.** SSH tunnel dan
`kubectl port-forward` membuat basis data production tampak persis seperti
localhost, dan justru itu cara orang menyentuh production dari mesinnya. Jadi
perlu sinyal kedua yang eksplisit — nama basis data yang mengandung `test`,
atau sebuah `DATABASE_IS_DISPOSABLE=1`. Yang tidak boleh: menyimpulkan aman
hanya dari host-nya.

### Perilakunya berbeda per pintu, karena yang menonton berbeda

Satu mekanisme untuk semuanya justru membuat pagarnya jebol — lihat _Kenapa
tidak satu bentuk saja_ di bawah.

| Pintu                                            | Perilaku                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `db:reset`, `db:seed`, `db:migrate`, `db:push`   | **Prompt interaktif.** Tampilkan host + nama basis data, minta pengguna mengetik nama basis datanya. Tanpa TTY → **tolak**. |
| `bun test`                                       | **Tolak mentah.** Opt-out hanya lewat `ALLOW_REMOTE_TEST_DB=1` yang eksplisit.                                            |
| `next dev`, `next start`                         | **Satu baris peringatan saat boot. Jangan blokir.**                                                                       |

### Kenapa tidak satu bentuk saja

Prompt interaktif di `bun test` punya dua cara gagal:

1. **Tidak ada TTY.** Test runner di IDE, CI, dan agen yang memanggil lewat
   shell tidak punya stdin interaktif. Prompt di sana bukan bertanya — ia
   menggantung selamanya, atau membaca EOF dan lolos diam-diam. Yang kedua lebih
   buruk: pagar yang gagal terbuka.
2. **Muscle memory.** Tes dijalankan puluhan kali sehari. Konfirmasi sesering itu
   berhenti dibaca dalam hitungan hari; yang tersisa refleks `y`+Enter. Pagar
   yang selalu disetujui bukan pagar.

`ALLOW_REMOTE_TEST_DB=1` tetap memenuhi "wajib konfirmasi" — ia perbuatan yang
disengaja — tapi tidak bisa di-muscle-memory dan tidak bisa menggantung.

Sebaliknya, memperingatkan `next dev` setiap hari untuk keadaan yang memang
normal hanya melatih orang mengabaikan peringatan. Sebut sekali, lalu diam.

- [ ] Satu modul pagar, dipakai semua pintu, tidak diduplikasi
- [ ] Deteksi memakai host **dan** sinyal kedua yang eksplisit — bukan host saja
- [ ] `db:reset`/`db:seed`/`db:migrate`/`db:push` meminta konfirmasi; tanpa TTY menolak
- [ ] `bun test` menolak tanpa `ALLOW_REMOTE_TEST_DB=1`
- [ ] `next dev`/`next start` memperingatkan tanpa memblokir
- [ ] CI tetap hijau tanpa perlu opt-out apa pun (`DATABASE_URL`-nya sudah localhost)
- [ ] Cara menyalakan basis data tes lokal terdokumentasi

## Comments

**Bentuk pagar ini keputusan pengguna, 4 Agustus 2026.** Usul awalnya: peringatan
+ konfirmasi wajib untuk operasi apa pun begitu `DATABASE_URL` bukan localhost.
Prinsipnya diambil utuh — pagar di lapisan koneksi, bukan di `tests/setup.ts`.
Yang disesuaikan hanya bentuk konfirmasinya per pintu, dengan alasan TTY dan
muscle memory di atas.

Memisahkan `DATABASE_URL` tes dari `DATABASE_URL` aplikasi tidak ada di tiket
ini — lihat tiket `03`. Keduanya berdiri sendiri: pagar ini tetap benar entah
pemisahan itu terjadi atau tidak, dan justru pagar ini yang menahan kerusakan
selama pemisahan itu belum ada.
