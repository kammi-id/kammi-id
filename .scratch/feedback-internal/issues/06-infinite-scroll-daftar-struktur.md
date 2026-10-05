# 06 — Daftar Struktur: infinite scroll menggantikan paginasi

Status: done — implementasi sudah masuk dev-20260104 dan deploy non-production; status diperbarui 2026-09-06.

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

## Comments

### 2026-09-06 — sinkronisasi status setelah implementasi dan deploy

Daftar Struktur memakai keyset pagination dan infinite scroll, tombol Muat lagi, serta pemulihan posisi scroll.

Implementasi: [`81a7d17`](https://github.com/kammi-id/kammi-id/commit/81a7d17), [`bf87988`](https://github.com/kammi-id/kammi-id/commit/bf87988). Commit tersebut sudah masuk `dev-20260104`.
[CI dan deploy non-production `d100077`](https://github.com/kammi-id/kammi-id/actions/runs/33590415712)
lulus pada 2026-09-02, 11.30 WIB (test, build-push, deploy). Perubahan tetap
tercakup dalam [rilis `036f467`](https://github.com/kammi-id/kammi-id/actions/runs/33781321956),
yang lulus dan selesai deploy pada 2026-09-04, 00.06 WIB.

Status lama `ready-for-agent` tertinggal setelah implementasi. Pembaruan ini
berdasarkan riwayat commit dan hasil CI yang diperiksa pada 2026-09-06; bukan
pengujian ulang manual seluruh alur dashboard atau verifikasi rilis production.
