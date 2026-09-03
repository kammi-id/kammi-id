# Lepas object storage: gambar pindah ke volume

**Status:** closed 2026-09-01 — 01, 02, 03, 06 mendarat lewat tiket; 04 dan 05 dikerjakan langsung ke host di luar tiket. Penyalinan 173,9 MB dan pencabutan RustFS sebagai origin TIDAK terverifikasi — lihat Comments di tiket 05.

Keputusan dan alasannya ada di
[ADR 0006](../../docs/adr/0006-gambar-di-volume-bukan-object-storage.md). Spec
ini hanya memecahnya jadi pekerjaan.

## Masalah

Berkas gambar tidak pernah ikut berpindah antar-lingkungan. `pg_dump` membawa
baris, tidak membawa byte, jadi staging dan mesin pengembang penuh baris yang
menunjuk ke berkas yang tidak ada. Storage lokal bahkan sudah mati sepenuhnya:
`.env.local` menunjuk bucket `kammiidz` yang tidak ada, dan `minio.license`
yang dibutuhkan `docker-compose.yml` tidak pernah ada.

## Bentuk akhir

- Byte tinggal di volume Docker `kammi-uploads`, di-mount ke `/data/uploads`,
  path lewat `UPLOADS_DIR` (default `./.uploads` saat pengembangan).
- `Bun.S3Client` dan lima variabel `S3_*` hilang dari `src/`.
- `/api/images/<key>` **tidak berubah bentuk** — nol baris DB ditulis ulang.
- Berkas hilang → placeholder, bukan halaman rusak.
- `bun run assets:pull` menarik volume production ke lokal, tanpa kredensial S3.
- RustFS berhenti jadi origin, jadi sasaran backup berkala Dokploy.

## Yang sengaja tidak dikerjakan

| Ditunda | Alasan |
| --- | --- |
| Normalisasi ukuran gambar saat unggah (rata-rata objek lama 4 MB) | Menyangkut kualitas foto; 44 objek lama tetap besar meski ingest dibetulkan |
| Gerbang auth per-gambar | Foto Kader tampil di halaman publik; memisahkannya keputusan produk |
| Menulis ulang URL penuh di DB jadi kunci telanjang | Sebagian tertanam di blob JSON `site_settings`; keuntungannya kosmetik |
| Mencabut rute publik RustFS | Diputuskan tetap terbuka |

## Angka yang dipakai saat menimbang

44 objek, 173,9 MB, rata-rata 4 MB per objek, bucket `kammiid` di
`https://assets.kammi.id`.

## Urutan

```
01 penyimpanan ──┬── 02 kunci & batas ──┐
                 │                      ├── 05 migrasi & cutover
03 resolver ─────┴── 04 infra ──────────┤
                          └── 06 assets:pull
```
