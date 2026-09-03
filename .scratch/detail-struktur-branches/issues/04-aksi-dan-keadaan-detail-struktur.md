# 04 — Aksi dan Keadaan detail Struktur

**What to build:** Detail Struktur mempertahankan aksi kestrukturan yang sudah diizinkan bagi pengurus, dan Struktur Non-Aktif tetap dapat dibuka serta ditandai redup di seluruh navigasi detail.

**Blocked by:** 01 — Detail Struktur dan integritas jalur.

**Status:** done

- [x] Aksi yang tersedia mengikuti matriks kestrukturan yang ada dan tidak menambah hak baru.
- [x] BPH tetap menyunting Struktur sendiri melalui permukaan Organisasi, bukan lewat detail branches.
- [x] Struktur Non-Aktif dapat dibuka dan dinavigasi, dengan badge Keadaan dan tampilan redup yang tetap memenuhi kontras aksesibel.
- [x] Struktur Terhapus tetap tidak dapat diakses pada branches normal, dan test mengunci perbedaan ini dari Non-Aktif.

## Comments

**24 Agustus 2026 — aksi dan Keadaan detail selesai.**

Aksi detail memakai matriks kemampuan yang telah ada; BPH tidak menerima aksi
baru atas Strukturnya sendiri. Struktur Non-Aktif tetap dapat dibuka dan
dinavigasi dengan badge yang terbaca, sedangkan Struktur Terhapus tetap
menjawab sebagai tidak ditemukan di branches normal.
