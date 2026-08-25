# 03 — Sidebar Struktur Anak

**What to build:** Detail Struktur yang memiliki Struktur Anak menyediakan sidebar kanan untuk menavigasi anak langsung, dengan pencarian dan pagination. Sidebar tetap berguna di layar kecil dan tidak tampil untuk leaf.

**Blocked by:** 01 — Detail Struktur dan integritas jalur.

**Status:** done

- [x] Sidebar hanya memuat Struktur Anak langsung yang terlihat; Struktur Terhapus tidak muncul.
- [x] Pencarian, pagination, empty state, dan URL state bekerja tanpa mengubah Struktur detail yang sedang dibuka.
- [x] PW menampilkan “Jumlah PD”; PD dan PDLN menampilkan “Jumlah Komisariat”; PK tidak menampilkan metrik Struktur Anak atau sidebar kosong.
- [x] Pada layar kecil sidebar mengikuti konten utama, dan tautan navigasinya tetap dapat dioperasikan dengan keyboard.

## Comments

**24 Agustus 2026 — sidebar Struktur Anak selesai.**

Sidebar membaca hanya Struktur Anak langsung dari pembaca terotorisasi,
mempertahankan state URL untuk pencarian dan pagination, serta tidak dirender
untuk leaf. Test komponen mengunci nama pencarian, tautan, pagination, dan
empty state; test seam menutup data Terhapus dan pagination.

**25 Agustus 2026 — syarat render sidebar digeser oleh isu 06.**

Kriteria ketiga di atas ("PK tidak menampilkan metrik Struktur Anak atau sidebar
kosong") tetap berlaku, tetapi aturan umumnya tidak lagi "tidak dirender untuk
leaf". Sidebar kini dirender bila Struktur punya anak **atau** aktor boleh
membuat anak di bawahnya, karena Struktur tanpa anak adalah keadaan yang paling
membutuhkan tombol Tambah. PK tidak terpengaruh: ia tidak punya Jenjang anak
yang sah, jadi kedua sisi syaratnya tetap salah dan sidebarnya tetap absen.

Lihat `06-tambah-struktur-anak-dari-detail.md`.

