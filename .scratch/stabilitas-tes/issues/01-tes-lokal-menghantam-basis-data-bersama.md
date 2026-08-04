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

### Aturannya

Keputusan pengguna, 4 Agustus 2026. Dua baris, tidak lebih:

| `DATABASE_URL` | Perilaku                                            |
| -------------- | --------------------------------------------------- |
| Localhost      | **Jalan segera. Jangan bertanya.**                  |
| Non-localhost  | **Production. Konfirmasi pengguna wajib.**          |

Host lokal: `localhost`, `127.0.0.1`, `::1`, `host.docker.internal`. Selain itu
production — tanpa daftar pengecualian, tanpa penanda yang bisa menurunkan
derajatnya. Host staging yang salah dianggap production cuma berbiaya satu
konfirmasi; kebalikannya berbiaya basis data.

**Jangan tambahkan sinyal kedua.** Localhost lolos apa adanya. Pertimbangannya
sudah dibahas dan ditolak — lihat _Risiko yang diterima_ di bawah. Kesederhanaan
aturannya adalah fiturnya: pagar yang butuh dua kondisi adalah pagar yang
diakali orang, dan pagar yang diakali tidak menjaga apa pun.

### Bentuk konfirmasinya

Satu jalur untuk semua pintu yang merusak — `db:reset`, `db:seed`, `db:migrate`,
`db:push`, `bun test`:

1. Tampilkan host dan nama basis data yang akan disentuh.
2. Minta pengguna **mengetik nama basis datanya**, bukan menekan `y`.
3. **Tanpa TTY → tolak, jangan menebak.** Test runner di IDE, CI, dan agen yang
   memanggil lewat shell tidak punya stdin interaktif. Prompt di sana bukan
   bertanya — ia menggantung selamanya, atau membaca EOF dan lolos diam-diam.
   Yang kedua lebih buruk: pagar yang gagal terbuka.
4. Sediakan satu env var untuk memberi izin di muka (mis. `DB_GUARD_ACK=1`),
   supaya runner non-interaktif punya jalan yang sengaja dan terlihat, bukan
   jalan pintas yang diam.

Mengetik nama basis data, bukan `y`, itu disengaja. Tes dijalankan puluhan kali
sehari; konfirmasi yang cukup dijawab satu tombol berhenti dibaca dalam hitungan
hari.

`next dev` dan `next start` **tidak** ikut jalur ini — keduanya tidak merusak,
dan basis data remote justru keadaan normal di sana. Cukup satu baris peringatan
saat boot, jangan blokir. Memperingatkan hal yang normal setiap hari hanya
melatih orang mengabaikan peringatan.

### Risiko yang diterima

SSH tunnel dan `kubectl port-forward` membuat basis data production tampak
persis seperti localhost. Di bawah aturan ini, basis data production yang
di-tunnel akan lolos tanpa ditanya.

**Ini diterima secara sadar, bukan terlewat.** Alternatifnya — menuntut sinyal
kedua yang eksplisit di jalur localhost — membuat setiap pengembang harus
menyalakan sesuatu sebelum bisa menjalankan tes, tiap hari, untuk menutup kasus
yang jarang. Biaya hariannya nyata dan langsung; kalau pagarnya terasa
menghalangi, ia akan diakali, dan pagar yang diakali tidak menjaga apa pun.

Kalau kelak ada yang benar-benar men-tunnel production ke localhost di repo ini,
tinjau ulang keputusan ini.

- [ ] Satu modul pagar, dipakai semua pintu, tidak diduplikasi
- [ ] Localhost lolos tanpa pertanyaan — tanpa syarat tambahan
- [ ] Non-localhost selalu production — tanpa daftar pengecualian
- [ ] `db:reset`/`db:seed`/`db:migrate`/`db:push`/`bun test` minta ketik nama basis data
- [ ] Tanpa TTY → menolak, bukan menggantung dan bukan lolos
- [ ] Ada env var izin-di-muka untuk runner non-interaktif
- [ ] `next dev`/`next start` memperingatkan tanpa memblokir
- [ ] CI tetap hijau tanpa opt-out apa pun (`DATABASE_URL`-nya sudah localhost)
- [ ] Cara menyalakan basis data tes lokal terdokumentasi

## Comments

**Bentuk pagar ini keputusan pengguna, 4 Agustus 2026,** lewat tiga kali
penajaman. Riwayatnya ditulis di sini supaya tidak diulang dari nol.

1. Usul awal: peringatan + konfirmasi wajib untuk operasi apa pun begitu
   `DATABASE_URL` bukan localhost. Prinsipnya diambil utuh — pagarnya milik
   lapisan koneksi, bukan `tests/setup.ts`.
2. Ditetapkan: non-localhost **dianggap production**, tanpa daftar pengecualian.
3. Ditetapkan: localhost **jalan segera tanpa bertanya**.

Poin 3 membatalkan usulan sebelumnya yang menuntut sinyal kedua di jalur
localhost. Usulan itu berangkat dari kasus tunnel, dan **sudah dipertimbangkan
lalu ditolak** — bukan terlewat. Alasannya ada di _Risiko yang diterima_. Jangan
menghidupkannya lagi tanpa kasus nyata di repo ini.

Memisahkan `DATABASE_URL` tes dari `DATABASE_URL` aplikasi tidak ada di tiket
ini — lihat tiket `03`. Keduanya berdiri sendiri: pagar ini tetap benar entah
pemisahan itu terjadi atau tidak, dan justru pagar ini yang menahan kerusakan
selama pemisahan itu belum ada.
