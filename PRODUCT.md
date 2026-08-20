# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pengurus KAMMI se-Indonesia dengan berbagai role (BPH, BPK, BPW, HUMAS). Memiliki rentang kemampuan digital yang sangat luas, dari yang sangat gaptek hingga tech-savvy. Mereka membutuhkan akses cepat ke informasi akurat mengenai status kepengurusan, jumlah anggota, dan publikasi media, serta perlu melakukan operasional data organisasi dengan mudah dan nyaman.

Kewenangan bertingkat per CONTEXT.md: **Root** (penuh, tanpa batas Cakupan), **BPH** (memantau seluruh Cakupan, hanya boleh menyunting identitas Strukturnya sendiri), **BPK** (mengelola kekaderan — Member, Daurah, Perangkat), **BPW** (mengelola kestrukturan di bawah Strukturnya sendiri), **Humas** (mengelola Artikel dan Pengaturan Situs, Cakupan tidak turun ke Struktur di bawahnya), dan **Akun Kader** (hanya atas datanya sendiri).

## Product Purpose

Menjadi "Single Source of Truth" bagi organisasi KAMMI. Menjamin ketersediaan informasi yang terakurat dan terupdate, sekaligus menyediakan tool manajemen data yang efisien untuk mendukung kelancaran organisasi.

## Positioning

Satu-satunya sistem yang memodelkan struktur kepengurusan KAMMI sebagai satu pohon nasional berjenjang (PP → PW → PD/PDLN → PK), dengan kewenangan yang otomatis mengikuti Cakupan (Struktur milik sebuah Akun beserta seluruh turunannya). Ini menyatukan data kekaderan (Member, Jenjang Kekaderan, Daurah, Perangkat) dan publikasi per-Struktur dalam satu basis data — bukan spreadsheet atau sistem terpisah per wilayah yang tidak saling nyambung.

## Operating Context

Dua permukaan berbeda:

- **Dashboard** (`(dashboard)`, login-gated): tool operasional untuk pengurus — manajemen Kader, Alumni, Perangkat, Daurah/trainings, Struktur organisasi/branches, Artikel, Pages, dan profil/user. Dipakai sehari-hari untuk input data dengan volume tinggi (tabel, inline editing).
- **Situs publik** (`(main)`): halaman informasional untuk publik dan calon kader — beranda, tentang, pengurus, alumni, network, publikasi/berita, dan event. Konfigurasinya (Pengaturan Situs) per-Struktur, dikelola lewat kewenangan Humas.

## Capabilities and Constraints

- Hierarki Struktur (PP/PW/PD/PDLN/PK) dengan kewenangan yang di-scope lewat Cakupan — lihat CONTEXT.md untuk istilah lengkap dan aturan turunnya.
- Struktur punya tepat satu dari tiga Keadaan (Aktif/Non-Aktif/Terhapus); Kader punya tepat satu dari empat Keadaan (Aktif/Sanksi/Non-Aktif/Alumni) — berjalan independen dari Jenjang Kekaderan dan sertifikasi Perangkat.
- **Kelulusan belum tersambung ke Jenjang Kekaderan atau sertifikasi Perangkat di kode** — menetapkan Kelulusan hanya menulis satu boolean pada baris Peserta (`updateAttendantStatus`, `db/query/training.ts`). Kenaikan Jenjang Kekaderan (AB1→AB2→AB3) dan sertifikasi Pemandu/Instruktur masih disetel manual lewat permukaan lain. Jangan mengasumsikan atau mendesain UI yang mengandaikan sambungan ini sudah ada — itu keputusan produk yang belum diambil.
- Masa Penetapan Kelulusan: terbuka sehari setelah Daurah selesai, tertutup 30 hari sesudahnya; hanya Root yang bisa menembus batas ini.
- Unggahan gambar dikunci `uuid.ext`, dibatasi 5MB di server, disimpan lokal (S3/MinIO sudah dicabut dari infra).

## Evidence on Hand

- DESIGN.md sudah berisi sistem desain terkonfirmasi ("Vanguard Archive") dengan token warna/tipografi — acuan visual yang sah untuk dipakai.
- CONTEXT.md adalah glosarium domain kanonis (istilah, kewenangan, Keadaan, Daurah) — sumber kebenaran untuk copy dan terminologi UI, harus dipakai persis, hindari sinonim yang ditandai `_Avoid_`.
- **Konten situs publik sebagian masih placeholder/under-construction** (ada komponen `under-construction-client` di `(main)`) — jangan diperlakukan sebagai konten final. Jangan fabrikasi testimoni, foto, atau studi kasus baru; tandai kekosongan sebagai kekosongan.

## Brand Personality

Young, Professional, Energetic. Modern, bersemangat, namun tetap terpercaya dan terorganisir. Menggabungkan idealisme pemuda dengan eksekusi profesional.

## Anti-references

Aplikasi pemerintah Indonesia pada umumnya (kaku, outdated, UX yang membingungkan, dan visual yang monoton).

## Design Principles

1. **High-Velocity Input**: Mengadopsi efisiensi Linear. Memprioritaskan kecepatan input data, inline editing, dan minimalisasi klik untuk operasional data.
2. **Structured Clarity**: Mengadopsi organisasi Notion. Menghadirkan hirarki informasi yang bersih dan layout yang terorganisir untuk mempermudah monitoring.
3. **Inclusive Guidance**: Menjembatani gap digital user dengan bantuan visual yang eksplisit, seperti tooltip yang informatif dan labeling yang manusiawi.
4. **Youthful Professionalism**: Menyeimbangkan tipografi yang bold dan warna yang energetik tanpa mengorbankan wibawa dan kepercayaan sebagai organisasi profesional.

## Accessibility & Inclusion

Target WCAG AA. Fokus utama pada navigasi intuitif dan penggunaan tooltip yang luas untuk memandu user dengan literasi digital rendah.
