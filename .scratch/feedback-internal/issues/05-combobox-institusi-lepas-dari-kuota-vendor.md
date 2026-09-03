# 05 — Combobox institusi: lepas dari kuota vendor

Status: ready-for-agent

Poin 10 dari feedback. **Bukan bug UI.**

## Akar masalahnya

Vendor `use.api.co.id` membalas `429 quota_exceeded` — tier free, habis, reset
`2026-09-01`. Produk region (`src/lib/api/region.ts`) berbeda kuota dan masih
sehat; hanya produk universitas yang tumbang.

Dan kuotanya terbakar bukan karena tidak ada cache. `force-cache` +
`revalidate: 86400` sudah terpasang (`src/lib/api/university.ts:32-33`).
Terbakarnya karena **fan-out**: URL memuat `?name=<yang diketik>`, combobox
menembak tiap 300ms dengan ambang **2 karakter**, jadi satu pencarian
"universitas brawijaya" menjadi empat URL berbeda, empat entri cache, empat
kuota — dan tidak satu pun terpakai ulang, karena tidak ada orang kedua yang
mengetik dengan ritme jeda yang persis sama.

## Pekerjaan

**A. Potong fan-out** (paling besar hasilnya, paling murah)

- Ambang naik dari 2 ke **4 karakter**.
- Debounce diperpanjang dari 350ms.
- Sesuaikan teks `ComboboxEmpty` ("Ketik minimal 2 karakter").

**B. Cache transient in-memory**

- Peta di memori proses, kunci nama yang sudah pernah dicari.
- **Bukan** tabel basis data, dan **bukan** `.json` yang ditulis saat runtime:
  `next.config.ts` memakai `output: 'standalone'` dan deploy-nya Docker, jadi
  berkas runtime hilang tiap redeploy kecuali ia duduk di volume — dan cerita
  volume di production belum kelar (ADR 0006 belum dijalankan di sana).

**C. Izinkan teks bebas** — inilah yang memutus ketergantungan

`institutionName` kini `z.string().min(1, 'Institusi wajib diisi.')`
(`academic-section/action.ts:33`), dan `UniversityCombobox` hanya mengisi
hidden input ketika ada item yang **dipilih**. Akibatnya: mengetik kampus yang
tidak dikenal vendor menghasilkan **"Institusi wajib diisi."** padahal operator
baru saja mengisinya. Dan selama kuota habis, itu terjadi pada **semua**
kampus — riwayat akademik tidak bisa diisi sama sekali.

- Yang diketik tersimpan apa adanya bila tidak ada yang dipilih.
- `institution_data` (jsonb, `NOT NULL`) diisi `{}` untuk entri manual,
  sehingga entri tervalidasi vendor tetap bisa dibedakan dari entri tangan.
- Combobox menjadi **saran, bukan gerbang**.

## Selesai bila

- Mengetik nama kampus yang tidak ada di indeks lalu menyimpan **berhasil**,
  dengan `institution_data = {}` (tes).
- Memilih dari daftar tetap menyimpan `institution_data` lengkap (tes).
- Vendor membalas 429 → formulir tetap bisa disimpan (tes, upstream di-mock).
- Ambang 4 karakter: mengetik 3 karakter tidak menembak upstream (tes).
- Ketiga `check:*` hijau.
