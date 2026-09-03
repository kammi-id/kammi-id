# 06 — Daftar Struktur: infinite scroll menggantikan paginasi

Status: ready-for-agent

Poin 5 dari feedback.

## Sasaran

`kader/_components/members-grid/` — grid kartu Struktur beserta
`members-pagination.tsx` yang menggerakkannya lewat URL param.

Dipakai **tiga rute**: `kader` (pemilik), `alumni` dan `perangkat` (sanctioned
consumers, lewat `members-page-content` — lihat AGENTS.md, _Ownership_).
**Ketiganya ikut dalam satu perubahan.** Membiarkan satu rute tetap paginasi
memaksa `MembersGrid` melayani dua bentuk selamanya.

## Pengambilan halaman: keyset, bukan offset

Daftarnya diurut `count DESC` dan angkanya berubah tiap ada Kader masuk —
persis kondisi di mana `LIMIT/OFFSET` mulai melewatkan atau menggandakan baris
diam-diam. Pakai keyset: `ORDER BY total DESC, id` dengan cursor.

## Syarat yang menyertai keputusan

Dua-duanya bagian dari kesepakatan, bukan tambahan:

- **Tombol "Muat lagi"** tetap ada sebagai fallback — untuk keyboard,
  `prefers-reduced-motion`, dan saat `IntersectionObserver` tidak jalan.
- **Posisi scroll pulih** saat kembali dari halaman detail Kader.

## Yang sengaja dikorbankan

Tautan yang bisa dibagikan ke halaman ke-N, dan Ctrl+F atas satu halaman
penuh. Diterima saat grilling.

## Selesai bila

- Ketiga rute memuat batch berikutnya saat digulir, dan lewat tombol.
- Menambah Kader di tengah penggiliran tidak membuat baris terlewat atau
  berganda (tes keyset).
- Kembali dari detail Kader mendarat di posisi semula.
- Navigasi keyboard penuh sampai batch terakhir (AGENTS.md, _A11y_).
- Ketiga `check:*` hijau.
