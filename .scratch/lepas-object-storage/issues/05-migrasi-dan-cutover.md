# 05 — Pindahkan 174 MB dan matikan RustFS sebagai origin

**What to build:** Salin seluruh isi bucket `kammiid` ke volume
`kammi-uploads`, deploy, lalu ubah peran RustFS jadi sasaran backup.

**Blocked by:** 01, 04

**Status:** closed — ditutup atas keputusan operator, tanpa verifikasi

**44 objek, 173,9 MB, bucket `kammiid`** di `https://assets.kammi.id`. Catatan:
`.env.local` menunjuk `kammiidz` — itu salah ketik, bucket tersebut tidak ada.

**Kunci harus tersalin persis apa adanya.** Struktur folder dan nama berkas
tidak boleh berubah satu karakter pun; ini yang membuat nol baris DB perlu
ditulis ulang. Verifikasi dengan jumlah objek dan total byte, bukan dengan
lihat sekilas.

**Salin di host, bukan lewat laptop.** RustFS dan volume ada di mesin yang sama.

**Sekali tebas, bukan masa transisi dua-sumber.** Membaca volume dengan jatuh
ke RustFS berarti `Bun.S3Client` dan lima env var tetap hidup selama masa
transisi — benda yang sedang dibuang, hanya ditunda. Urutannya: salin →
verifikasi → deploy → RustFS berhenti jadi origin.

**Undo-nya adalah data RustFS yang dibiarkan utuh.** Isi bucket jangan dihapus
setelah cutover; ia langsung berperan sebagai backup pertama, dan sekaligus
jalan pulang bila ada yang meleset.

Rute publik `assets.kammi.id` **tetap dibiarkan terbuka** — keputusan sadar,
tercatat di ADR 0006.

Setelah cutover, periksa dengan mata: satu halaman publik yang menampilkan foto
Kader, satu logo Struktur di dasbor, satu Artikel bergambar.

## Comments

### 2026-09-01 — ditutup di luar tiket

Production sudah berjalan di stack baru (`www.kammi.id`, health check `200`)
dengan volume `kammi-id-assets` ter-mount. Ditutup atas keputusan operator:
pekerjaannya dijalankan langsung ke host, di luar tiket dan di luar catatan.

**Tidak diverifikasi — dan tidak bisa diverifikasi dari repo:**

- Apakah 44 objek / 173,9 MB bucket `kammiid` benar-benar sudah tersalin ke
  `/data/uploads`.
- Apakah RustFS sudah turun peran dari origin menjadi sasaran backup.

Keduanya hanya terjawab lewat SSH ke host (`ls`/`du` pada volume) dan panel
Dokploy. Kalau ternyata belum, gejalanya adalah gambar lama 404 di production —
bukan error di build atau tes. `bun run assets:pull` (tiket 06) tetap tersedia
kalau perlu menarik ulang.
