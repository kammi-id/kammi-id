# Feedback Internal — 13 poin

Hasil sesi grilling 30 Agustus 2026. 25 keputusan diambil lintas 5 ronde;
seluruh frontier tertutup sebelum satu baris kode ditulis.

Tiga ADR lahir dari sesi ini:

- [ADR 0020](../../docs/adr/0020-nia-nomor-kelahiran-bukan-alamat.md) — NIA
  nomor kelahiran, bukan alamat, dan tidak pernah terbit ulang
- [ADR 0021](../../docs/adr/0021-hapus-selamanya-kader.md) — Hapus Selamanya
  Kader
- [ADR 0022](../../docs/adr/0022-ab3-hanya-syarat-dm3.md) — AB3 hanya syarat
  DM3

`CONTEXT.md` diamandemen: **Nomor Induk Anggota** diperbaiki; **Mutasi** dan
**Kader Terhapus** ditambahkan; **Perangkat** mendapat catatan syarat jenjang.

## Apa yang ternyata sudah ada

Empat dari tiga belas poin berubah bentuk setelah kodenya dibaca. Dicatat
supaya tidak dikerjakan dua kali:

| Poin | Laporan | Keadaan sebenarnya |
| --- | --- | --- |
| 2 | AB1 harus diblokir | Sisi UI add-form **sudah** (`disabled={isAb1}`). Yang belum: server (`schema.ts` menerima `ab1` + sertifikasi) dan UI halaman detail |
| 3 | DM3 hanya AB3 | Kode **lebih ketat** dari yang diminta: AB3 + Instruktur untuk **semua** jenis Daurah. Keputusannya jadi pelonggaran, bukan pengetatan |
| 7 | Kredo diberi nomor | Sudah ada di `kredo-section` — tapi komponen itu **tidak pernah dirender**. Yang hidup `tentang-scene`, yang sengaja membuang nomornya |
| 10 | Combobox kampus rusak | Bukan bug UI. Vendor `use.api.co.id` membalas **429 quota_exceeded**, tier free, reset 2026-09-01 |

## Temuan sampingan

- **Kuota terbakar oleh fan-out, bukan oleh ketiadaan cache.** `force-cache` +
  `revalidate: 86400` sudah terpasang. Combobox menembak tiap 300ms dengan
  ambang 2 karakter, jadi satu pencarian = 4+ URL berbeda = 4+ kuota, dan tidak
  satu pun entri cache-nya terpakai ulang.
- **`member` tidak punya `UNIQUE (register_number)`.** Hanya primary key `id`.
  Yang menolong selama ini `user_name_key`, dan itu terlepas saat
  `deleteMember` membuang baris `user`. Duplikat aktual di staging: nol.
- **`readMemberDistributionByOrgType` tidak menyaring `m.deleted_at`.** Kader
  terhapus ikut terhitung di chart dashboard BPK.
- **Delapan Kader AB1 memegang sertifikasi** di staging (data production per
  ADR 0009); hanya satu bernama "Dummy AB1". Diputuskan **tidak** dibersihkan
  lebih dulu — flag-nya hilang sendiri saat profil masing-masing disimpan.
- **Ghefira Alfaiha punya dua Member** dengan NIA berbeda
  (`13022020017`, `13022020037`). Di luar scope.
- **Tujuh folder mati** di `src/app/(main)/[strukturSlug]/tentang/_components/`:
  `kredo-`, `misi-`, `paradigma-`, `prinsip-`, `karakteristik-`, `sejarah-`,
  `unsur-section`. Di luar scope.

## Keputusan, per poin

| # | Keputusan | Tiket |
| --- | --- | --- |
| 1 | Combobox Peserta: `NIA · Jenjang · Pemandu · Instruktur · PW`. Keduanya tampil bila dipegang; slot hilang bila nol | 04 |
| 2 | Blokir AB1 **UI + server**, dua permukaan: add-form dan halaman detail | 04 |
| 3 | DM3 → AB3 + Instruktur; DM1/DM2/DPMK/TFI → AB2 boleh, tetap wajib Instruktur. Per jenis Daurah, bukan per Peran. Master ikut longgar | 03 |
| 4 | Hapus Kader tiga lapis. Soft delete ikut Cakupan; tong sampah ikut Cakupan; Hapus Selamanya Root + BPK PP, dua gerbang, diblokir bila ada riwayat | 02 |
| 5 | Infinite scroll **keyset**, ketiga rute, dengan tombol "Muat lagi" dan pemulihan posisi scroll | 06 |
| 6 | Hapus kata "akan" di Visi. Kredo tidak disentuh | 08 |
| 7 | Angka **Arab** 1–6 sebagai watermark di belakang teks kredo, `aria-hidden`, di `tentang-scene` | 08 |
| 8 | AB1 → checklist hilang total + flag auto-clear saat simpan | 04 |
| 9 | Agregat usia sebagai baris ketiga header; hilang bila `birthDate` null | 04 |
| 10 | Ambang 4 karakter + debounce lebih panjang; cache transient in-memory; **teks bebas diizinkan** | 05 |
| 11 | Dua bar Pemandu vs Instruktur, apa adanya | 07 |
| 12 | `LIMIT 10` di SQL kedua daftar, tanpa baris "Lainnya", judul eksplisit, sekalian saring `deleted_at` | 07 |
| 13 | Mutasi tanpa menyentuh NIA, dari tabel dan halaman detail, dicatat, wewenang Root + BPK PP | 01 |
| + | High-water mark NIA + alokasi atomik + `UNIQUE (register_number)` | 01 |

## Konsekuensi yang disadari

1. **AB2 boleh menjadi Master of Training sebuah TFI** — Daurah yang mencetak
   Instruktur. Keberatan diajukan, ditolak, dijalankan (ADR 0022).
2. **Delapan sertifikasi AB1 hilang tanpa notifikasi** saat profil
   masing-masing disimpan, kapan pun, oleh siapa pun (tiket 04).
3. **`UNIQUE (register_number)` bisa gagal dipasang** bila production menyimpan
   duplikat. Bila terjadi: laporkan dan berhenti, jangan dipaksa (tiket 01).

## Di luar scope

Tujuh folder mati di `tentang/_components/` · Ghefira Alfaiha yang berganda ·
menjalankan migrasi DB apa pun tanpa konfirmasi terpisah.
