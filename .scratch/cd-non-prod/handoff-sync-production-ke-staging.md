# Handoff — sync data production → staging

Ditulis 2026-09-07. Production adalah sumber kebenaran; staging ditimpa.
Prosedurnya ADR 0009; wizardnya `wizard-05-data-staging-dan-runbook.sh` di
folder ini, **sudah diperbarui di sesi ini** (lihat "Yang berubah" di bawah).

Semua fakta di bawah **diverifikasi langsung** 2026-09-07, bukan disalin dari
dokumen lain. `provisioning-record.local.md` memperingatkan dirinya sendiri
tiga kali bahwa ia sering basi — jangan percaya itu tanpa cek ulang.

## Akses (terverifikasi bekerja)

| Sisi        | SSH                        | Key                  | Dokploy                                       |
| ----------- | -------------------------- | -------------------- | --------------------------------------------- |
| Production  | `kammi-id@103.126.117.171` | `~/.ssh/kammi-id.pem` | `https://console.kammi.id` → `settings.health` OK |
| Staging     | `kammi-id@103.93.160.47`   | `~/.ssh/kammi-id.pem` | `DOKPLOY_NONPROD_*` di `.env.local`           |

User SSH dan key **sama di kedua host**; yang beda hanya host. `docker` bisa
dipanggil tanpa `sudo` di keduanya. Key production ada di
`.scratch/production-deployment/provisioning.local.env` (gitignored) —
di-refresh oleh pengguna 2026-09-07 setelah yang lama `Unauthorized`.

`-i ~/.ssh/kammi-id.pem` **wajib eksplisit**: ssh-agent kosong dan
`~/.ssh/config` tidak punya entri untuk host ini.

## Koordinat terverifikasi

**Production** (project `kammi-id-prod`, ADR 0015)

- Postgres: `postgresId` `D70xMboZYdWX7c4XARn_U`, appName `db-0tlzem`,
  container `db-0tlzem.1.ipu418x08mv3vngokno2oxuq9`, image `postgres:18.3`
- Database `kammi-id`, user `kammi-id`, ukuran **13 MB**
- Volume uploads `kammi-id-assets` → `/data/uploads`; **84 berkas, 198.668.739
  byte**; subfolder `kader/`, `site-settings/`, `articles/`

**Staging**

- Postgres: appName `kammi-staging-db-hz50pc`, database `kammi_staging`,
  user `kammi_staging`
- Application: appName `app-quantify-online-transmitter-kcccqx`, image
  `ghcr.io/kammi-id/kammi-id:sha-ecc9070`, domain `staging.kammi.id`
- Volume uploads `kammi-uploads` → `/app/.uploads` (mount path **beda** dari
  production; isi volumenya yang disalin, bukan path-nya)
- Env aplikasi: `RUN_MIGRATIONS=1`, `DB_GUARD_ACK=1`, `UPLOADS_DIR`,
  `DATABASE_URL`, `API_CO_ID_TOKEN`. **Tidak ada `CACHE_REVALIDATE_SECRET`.**

## Ledger migrasi — sudah dianalisis, jawabannya sudah pasti

Lokal punya 18 migrasi; ledger production punya 16 (id 4–19). Selisihnya
**persis dua**:

- `20260902011711_rare_lethal_legion`
- `20260902022558_glossy_the_phantom`

Keduanya **diverifikasi satu per satu** terhadap skema production — bukan
digeneralisasi dari sampel, sesuai peringatan insiden di memory
`adr0009-migration-ledger-gotcha`:

| Efek yang dicek                            | Ada di production? |
| ------------------------------------------ | ------------------ |
| tabel `member_mutation`                    | tidak              |
| tabel `register_number_sequence`           | tidak              |
| constraint `member_register_number_unique` | tidak              |
| kolom `user.deleted_at`                    | tidak              |

**Kesimpulan: keduanya BENAR-BENAR belum pernah dijalankan**, bukan sekadar
belum tercatat. Maka di stage 5b wizard, jawab **`n` (tidak)** untuk kedua
migrasi ini — biarkan tidak tercatat supaya drizzle benar-benar menjalankannya.
**Jangan** insert ke ledger.

Kabar baik: lubang ledger lama (yang di memory disebut "cuma 3 baris") sudah
diperbaiki di production — 16 dari 18 kini tercatat rapi dan seluruh nama
cocok dengan folder lokal. Yang tersisa hanya dua migrasi 2 September itu.

> Kalau HEAD sudah maju sejak 2026-09-07, **ulangi diff dan verifikasi
> per-migrasi ini dari awal**. Jangan pakai tabel di atas sebagai jawaban
> hafalan — itu persis kesalahan yang bikin insiden aslinya.

## Yang berubah di wizard (sesi ini, belum di-commit)

1. **Stage 6 ditulis ulang**: RustFS/`mc mirror` → tar-over-SSH volume ke
   volume. Production sudah pindah ke volume Docker per 2026-09-01 (ADR 0006
   tuntas), jadi seluruh langkah S3 lama sudah tidak menggambarkan apa pun.
   Tidak ada lagi permintaan kredensial bucket.
2. **Dua penjaga baru sebelum langkah destruktif**: `docker volume inspect`
   di kedua sisi, dan abort kalau 0 berkas tertarik. Sebabnya konkret — salah
   ketik nama volume membuat `docker run -v` **membuat volume kosong** alih-alih
   gagal, jadi tanpa penjaga ini wizard akan patuh mengosongkan staging lalu
   mengisinya dengan nol berkas.
3. **Production di-mount `:ro`** saat ditarik.
4. **Stage baru 5b-bis — "Terapkan migrasi tertinggal"** (ini celah nyata yang
   ditemukan sesi ini, lihat bagian berikut). `TOTAL_STAGES` 12 → 13.
5. **Stage revalidate cache jadi bisa dilewati** (Enter = lewati), karena
   `CACHE_REVALIDATE_SECRET` memang tidak ada di env staging dan langkah itu
   pasti 401. Bukan tanda restore gagal.

## Celah yang ditemukan dan sudah ditambal

Setelah restore, skema staging = skema production, yaitu **tanpa** ketiga
objek dari dua migrasi di atas. Tetapi aplikasi staging yang sedang berjalan
(`sha-ecc9070`) membawa kode yang **mengharapkan** objek-objek itu ada. Wizard
versi lama baru menyentuh deploy di stage 9, jauh setelah verifikasi mata di
stage 8 — jadi stage 8 akan memperlihatkan aplikasi yang error dan itu mudah
sekali dibaca sebagai "restore-nya gagal", padahal datanya benar.

Stage 5b-bis menutup ini: menjalankan one-shot migration container
(`RUN_MIGRATIONS=1 MIGRATIONS_ONLY=1 DB_GUARD_ACK=1`, ADR 0008) memakai image
yang persis sedang dipakai staging — dibaca dari `application.one`, bukan
ditebak — segera setelah rekonsiliasi ledger dan sebelum verifikasi apa pun.

Kalau container itu exit bukan 0: **diagnosis dari skema langsung, jangan dari
log**. `drizzle-kit` tidak pernah mencetak pesan untuk status `rejected`
(`MigrateProgress.render()` di `node_modules/drizzle-kit/bin.cjs`) — spinner
beku tanpa penjelasan adalah gejala normalnya.

## Menjalankan

```bash
bash .scratch/cd-non-prod/wizard-05-data-staging-dan-runbook.sh
```

Wizard membaca dari TTY, jadi **jalankan sendiri di terminal** — Bash tool
agen tidak punya TTY, `read` akan kena EOF dan setiap konfirmasi destruktif
akan dilewati dengan jawaban kosong. Ctrl-C aman; re-run mengulang.

Nilai yang akan diminta, beserta jawabannya:

| Prompt                        | Jawaban                                     |
| ----------------------------- | ------------------------------------------- |
| URL Dokploy production        | `https://console.kammi.id`                  |
| API key production            | dari `provisioning.local.env`               |
| `postgresId` production       | `D70xMboZYdWX7c4XARn_U`                     |
| SSH host production           | `kammi-id@103.126.117.171`                  |
| Identity file                 | `~/.ssh/kammi-id.pem`                       |
| Container Postgres production | `db-0tlzem.1.ipu418x08mv3vngokno2oxuq9`     |
| SSH host staging              | `kammi-id@103.93.160.47`                    |
| Volume production / staging   | Enter (default `kammi-id-assets` / `kammi-uploads`) |
| Docker network                | Enter (default `dokploy-network`)           |
| `CACHE_REVALIDATE_SECRET`     | Enter (lewati)                              |
| Stage 5b, dua migrasi 2 Sep   | **`n` untuk keduanya**                      |

Target verifikasi setelah selesai: **84 berkas / 198.668.739 byte** cocok di
kedua sisi (stage 7 menghitungnya otomatis).

## Catatan cakupan

Stage 9 wizard (bukti rollback: deploy sha lama lalu balik) adalah bagian dari
tiket 05 yang asli, **bukan** bagian dari "sync data". Kalau yang diminta hanya
sinkronisasi data, Ctrl-C setelah stage 8 sudah cukup — tidak ada yang
tertinggal dalam keadaan setengah jadi, karena seluruh langkah destruktif
sudah selesai di stage 6.

Stage 10 menulis bagian README; ia mendeteksi kalau bagian itu sudah ada dan
tidak menulis ulang.
