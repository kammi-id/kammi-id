# 05 — Kartu diunduh sebagai JPEG dan PDF

**What to build:** rute server yang merender Kartu Tanda Anggota lewat `satori`
→ `sharp`, dan tombol unduh di dasbor Kader.

**Blocked by:** 04 — ia mengekspor komponen kartu yang tiket ini menirunya.

**Status:** ready-for-agent

## Keputusannya dan harganya

ADR 0029. Ringkasnya: `satori` merender SVG, `sharp` (sudah jadi dependensi)
mengubahnya menjadi JPEG, dan PDF-nya adalah gambar itu di atas halaman seukuran
kartu. 85,6 × 54 mm = **1011 × 638 piksel pada 300 dpi**.

**Kartunya ditulis dua kali, dan itu disengaja.** `satori` hanya memahami
sebagian CSS dan **tidak memahami `oklch`** — seluruh warna proyek ini `oklch`
sejak Tailwind v4. Templat `satori` memakai heksadesimal dan flex sederhana.
Jangan mencoba memakai ulang komponen React dari tiket 04 di dalam `satori`; ia
akan diam-diam salah warna, bukan gagal berisik.

Alasan `html2canvas` tidak dipakai ada di ADR 0029 — ia gugur pada `oklch` yang
sama. Jangan diusulkan ulang.

## Yang dikerjakan

Rute di `src/app/api/` sebangun dengan `api/images/[...key]` yang sudah ada.
Ia menggerbangi dirinya sendiri: **hanya pemegang kartunya** yang boleh mengunduh
— baca `connectedMember` dari sesi, jangan menerima id Member dari URL sebagai
kewenangan.

Fon harus di-embed sebagai buffer; `satori` tidak mengambil fon dari jaringan.
Ambil dari fon proyek yang sudah ada supaya kartunya tidak berubah rupa.

Tombolnya di dasbor Kader (tiket 04): satu JPEG, satu PDF.

## Uji

Uji perbandingan piksel terlalu rapuh dan tidak sepadan. Yang berguna: uji yang
menegaskan **setiap bidang yang tampil di komponen React juga tampil di templat
`satori`** — sebab kegagalan yang pasti datang adalah templatnya tertinggal saat
desain kartu berubah, bukan warnanya bergeser satu tingkat.

Plus: unduhan oleh Akun yang bukan pemegangnya → ditolak.
