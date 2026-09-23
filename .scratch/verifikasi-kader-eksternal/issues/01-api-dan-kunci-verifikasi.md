# API dan Kunci Verifikasi

Type: task
Status: ready-for-human

Implementasikan tabel, query, gerbang Root untuk membuat/mencabut Kunci
Verifikasi, audit 90 hari, pembatas 60 permintaan/menit, dan rute verifikasi
`GET /api/v1/members/{nia}` sesuai `../spec.md` dan ADR-0030.

## Acceptance

- Secret tidak pernah tersimpan atau ditampilkan kembali dalam bentuk mentah.
- Rute tidak mengungkap perbedaan antara NIA tidak ditemukan dan Kader yang
  tidak memenuhi keadaan yang diizinkan.
- Respons hanya memuat allowlist yang disepakati dan Struktur dari Member saat
  ini.

## Comments

- Implementasi selesai secara lokal pada 16 September 2026: skema dan migrasi,
  rute API, kunci Root, audit, serta rate limit telah ditambahkan.
- `check:types`, lint terarah pada berkas yang berubah, `check:structure`,
  Prettier, dan `git diff --check` lulus. Build penuh tidak dapat disimpulkan:
  proses Next.js yang sudah berjalan menahan `.next/lock`; browser/Next DevTools
  juga tidak tersedia karena layanan browser gagal mulai.
- Migrasi belum diterapkan ke basis data mana pun karena tindakan itu memerlukan
  persetujuan terpisah.
