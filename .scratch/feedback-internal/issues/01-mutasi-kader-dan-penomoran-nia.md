# 01 — Mutasi Kader dan penomoran NIA yang tidak pernah terbit ulang

Status: ready-for-agent
ADR: [0020](../../../docs/adr/0020-nia-nomor-kelahiran-bukan-alamat.md)

Poin 13 dari feedback, plus perbaikan penomoran yang menjadi prasyaratnya.
Tiket terberat: satu-satunya yang menyentuh migrasi.

## Mengapa keduanya satu tiket

Mutasi mengandaikan NIA permanen. NIA permanen mengandaikan nomor tidak pernah
terbit ulang. Keduanya menjawab pertanyaan yang sama — apa yang terjadi pada
NIA ketika baris di bawahnya berubah — dan dipisah menjadi dua tiket akan
membuat yang satu tayang tanpa jaminan yang lain.

## Bagian A — High-water mark NIA

`generateRegisterNumber` (`src/lib/utils/member.ts`) menebak nomor berikutnya
dengan `MAX(register_number)` lalu `+1`. Dua lubang: alokasi balapan (baca dan
tulis adalah dua perjalanan terpisah, tanpa `UNIQUE` yang menahan) dan nomor
yang turun kembali saat baris tertinggi dihapus.

- Tabel baru `register_number_sequence (prefix text primary key, last_seq int not null)`.
- Alokasi lewat **satu** pernyataan atomik:
  `INSERT … ON CONFLICT (prefix) DO UPDATE SET last_seq = register_number_sequence.last_seq + 1 RETURNING last_seq`.
  Jangan ditulis sebagai baca-lalu-tulis — itu menghidupkan ulang balapan di
  tempat baru.
- Seed dari `MAX(seq)` per prefix atas **seluruh** baris `member`, termasuk
  yang `deleted_at IS NOT NULL`.
- Pasang `UNIQUE (register_number)` pada `member` sebagai jaring pengaman.

> **Berhenti dan laporkan** bila `UNIQUE` gagal dipasang karena production
> menyimpan duplikat. Jangan dipaksa lewat. Staging per 30 Agustus 2026: nol
> duplikat.

## Bagian B — Mutasi

- Tabel baru `member_mutation`: `member_id`, `from_organization_id`,
  `to_organization_id`, `moved_at`, `moved_by`.
  **Bukan** `member_organization_history` — tabel itu sudah berarti Organisasi
  Eksternal (di luar KAMMI, teks bebas) dan tidak boleh dibebani arti kedua.
- Aksi mutasi mengubah `member.organization_id` saja. NIA, Akun, dan riwayat
  Daurah tidak disentuh.
- Gerbang baru di `src/lib/auth/` — **Root dan BPK PP saja**. Dinamai untuk hak
  yang diberikannya, bukan untuk tindakan memeriksa (lihat AGENTS.md,
  _Authorization_). Pola rujukan: `requireStrukturRestoreAccess`
  (`src/lib/auth/kestrukturan.ts:476`), yang juga bukan sekadar `role === 'x'`.
- Dua pemicu: dari tabel Data Kader **dan** dari halaman detail Kader.

## Selesai bila

- Dua pendaftaran serentak pada prefix yang sama menerima nomor berbeda (tes).
- Menghapus Kader ber-NIA tertinggi tidak membuat pendaftar berikutnya menerima
  nomor itu (tes).
- Mutasi mengubah Struktur, tidak mengubah NIA, dan meninggalkan satu baris
  `member_mutation` (tes).
- BPK non-PP ditolak; Root dan BPK PP diterima (tes).
- `bun run check:types`, `check:lint`, `check:structure` hijau.

## Catatan

Migrasi **tidak dijalankan** tanpa konfirmasi terpisah dari pemilik repo.
