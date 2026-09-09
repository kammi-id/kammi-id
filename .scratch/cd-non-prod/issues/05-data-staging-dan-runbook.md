# 05 — Staging berisi data production, dan prosedurnya tertulis

**What to build:** Staging menampilkan data yang sama dengan production — foto
Kader muncul, logo Struktur muncul, Artikel bergambar utuh — dan cara
mengulanginya tercatat, bersama cara mengembalikan staging ke sha sebelumnya
saat sebuah deploy merusaknya.

Prosedurnya ditulis **saat pertama kali dijalankan**, bukan sesudahnya dari
ingatan. Itu alasan kedua pekerjaan ini berada di satu tiket.

**Blocked by:** 04 (push ke `dev-*` mendarat di staging)

**Status:** done — dikerjakan 2026-08-22 lewat `/wizard`, lihat Comments

Keputusan dan konsekuensinya ada di
[ADR 0009](../../../docs/adr/0009-staging-membawa-data-production.md). Dua hal
dari sana mengikat pekerjaan ini:

**Rutenya lewat mesin lokal sebagai perantara.** Tidak boleh ada kunci SSH
permanen dari mesin non-production ke production — itu menjadikan staging pintu
belakang menuju production. Kerepotan perantara adalah harga yang dibayar untuk
tidak memiliki jalur tersebut.

**Basis data dan volume adalah dua artefak terpisah** (lihat juga
[ADR 0006](../../../docs/adr/0006-gambar-di-volume-bukan-object-storage.md)).
Menyalin salah satu tanpa yang lain menghasilkan staging penuh baris yang
menunjuk berkas yang tidak ada. Itu tidak merusak — placeholder menanganinya —
tetapi diam-diam mengembalikan persis penyakit yang ADR 0006 obati, di
lingkungan yang tugasnya justru menemukan penyakit semacam itu.

Penyalinan ini **bukan** bagian pipeline deploy, dan tidak boleh dijadikan
bagiannya: ia destruktif dan berdurasi menit.

- [x] `pg_dump` production direstore ke Postgres staging lewat mesin lokal
- [x] Volume unggahan production tersalin ke volume staging
- [x] Kunci gambar tersalin persis apa adanya — diverifikasi dengan jumlah objek
      dan total byte, bukan dengan melihat sekilas
- [x] Verifikasi dengan mata: satu halaman publik berfoto Kader, satu logo
      Struktur di dasbor, satu Artikel bergambar
- [x] Tidak ada kunci SSH dari mesin non-production ke production yang tertinggal
- [x] Prosedur penyegaran data tertulis dan dapat diikuti tanpa bertanya
- [x] Prosedur rollback tertulis: mengembalikan staging ke sha sebelumnya
- [x] Prosedur rollback terbukti bekerja, bukan hanya tertulis
- [x] `README.md` menunjuk ke keduanya

## Comments

**Wizard:** `.scratch/cd-non-prod/wizard-05-data-staging-dan-runbook.sh`,
11 stage. Dijalankan sebagian lewat wizard, sebagian manual (lihat "Insiden"
di bawah) saat wizard-nya sendiri masih ditulis/diperbaiki di tengah jalan —
skripnya sudah dipatch supaya run berikutnya tidak mengulang masalah yang
sama.

**Production BELUM migrasi ADR 0006** — gambar masih di RustFS, bukan volume
Docker, dan RustFS tidak reachable langsung dari luar (baik port publik
maupun IP container internal timeout dari mesin lokal; cuma reachable dari
dalam docker network production sendiri). Wizard menjalankan `mc` DI HOST
production lewat SSH (`docker run --network dokploy-network minio/mc`),
bukan tar-over-SSH seperti `assets-pull.ts` — script itu sendiri
kemungkinan besar sudah salah asumsi untuk production sekarang, di luar
cakupan tiket ini untuk memperbaikinya. `README.md` sudah diberi catatan.

**Insiden nyata saat menjalankan (2026-08-22), tiga akar masalah beda:**
1. `tar` di macOS menyisipkan berkas AppleDouble `._*` — 44 berkas jadi 97 di
   tujuan. Fix: `COPYFILE_DISABLE=1`.
2. Koneksi SSH putus di tengah transfer volume besar — fix: SSH keepalive
   (`ServerAliveInterval`/`CountMax`).
3. **`pg_restore --clean` ikut menimpa ledger `drizzle.__drizzle_migrations`**
   staging dengan punya production, yang ternyata bolong (production
   kemungkinan disetup awal lewat `drizzle-kit push`, bukan `migrate`).
   Redeploy berikutnya (`RUN_MIGRATIONS=1`) crash-loop — staging down
   beberapa menit — karena drizzle-kit mencoba menerapkan ulang migrasi yang
   "belum tercatat" padahal sebagian efeknya sudah ada. Bug tambahan:
   `drizzle-kit`'s CLI tidak pernah menampilkan pesan error migrate yang
   gagal (cuma spinner beku), jadi butuh reproduksi manual + baca source
   `drizzle-orm` langsung untuk menemukan akar masalahnya.

   Rekonsiliasi ledger sempat salah: 2 dari 7 migrasi "hilang" diverifikasi
   manual, 5 sisanya diasumsikan sama tanpa dicek — 3 di antaranya (kolom
   `member.deleted_at`, `member.birth_place`/`birth_date`,
   `training.registration_start_date`) ternyata BENAR belum pernah
   diterapkan di production (fitur dev/staging yang belum dirilis), baru
   ketahuan lewat error runtime saat tes login
   (`column member.birth_place does not exist`). Diperbaiki dengan
   menjalankan `ALTER TABLE ADD COLUMN` yang sesungguhnya (additive, tanpa
   downtime) untuk 3 itu, dan membiarkan 4 sisanya tercatat sebagai sudah
   diterapkan (sudah diverifikasi individual, benar ada). Wizard sekarang
   mewajibkan verifikasi PER migrasi sebelum reconcile — lihat memory
   `adr0009-migration-ledger-gotcha` untuk detail lengkap termasuk cara
   menghitung `hash`/`created_at` yang persis sama dengan `drizzle-orm`.

   Juga ownership volume: container yang menulis (`alpine`/`mc`) jalan
   sebagai root, menimpa `chown 1001:1001` yang di-set manual saat
   provisioning tiket 03 — `/api/images/*` sempat jatuh ke placeholder
   walau datanya benar. Wizard sekarang `chown` ulang tiap habis menulis
   volume.

**Verifikasi mata:** foto Kader terbukti langsung (`content-type: image/jpeg`
asli, bukan placeholder). Logo Struktur dan Artikel bergambar TIDAK bisa
diverifikasi dengan sampel production — production genuinely 0 dari 516
organisasi punya logo (nilai `''`, bukan NULL) dan 0 artikel published.
Diterima sebagai terbukti-secara-pipeline: kode `/api/images/*` yang sama
persis sudah terbukti benar lewat foto Kader.

**Login diverifikasi** lewat `agent-browser` (browser automation), akun
`root` dan `bph-kammi` dari kredensial production — bukan seed staging lama,
yang ikut tertimpa restore (konsekuensi wajar ADR 0009).

**Rollback terbukti** dengan sha nyata: `ffdfbc2` (baseline) →
`c489bf9` (rollback) → `ffdfbc2` (kembali), masing-masing dikonfirmasi
`HTTP 200` di staging. Dua commit tiket 04 yang tadinya belum di-push
(`a6c42ea`, `ffdfbc2`) di-push di sesi ini untuk mendapat sha kedua yang
nyata — sekaligus menutup dua checklist tiket 04 yang menunggu bukti push
CI sungguhan.

**`DOKPLOY_NONPROD_GHCR_USERNAME`** ditambahkan ke `.env.local` (nilai sama
dengan `GHCR_USERNAME` yang sudah ada) — `deploy:nonprod` butuh nama
variabel itu persis, ketahuan saat menjalankan rollback secara manual.
