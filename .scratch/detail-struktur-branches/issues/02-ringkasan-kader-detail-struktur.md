# 02 — Ringkasan Kader detail Struktur

**What to build:** Detail Struktur menampilkan ringkasan Kader Aktif dalam Cakupannya: total, AB1/AB2/AB3, Ikhwan/Akhwat, Pemandu, dan Instruktur. BPW dapat melihat angka ini hanya pada detail Struktur tanpa mendapat akses daftar maupun pengelolaan Kader.

**Blocked by:** 01 — Detail Struktur dan integritas jalur.

**Status:** done

- [x] Angka kumulatif menghitung Cakupan Struktur dan mengecualikan Alumni, Kader Non-Aktif, serta Kader Sanksi.
- [x] Pemandu dan Instruktur dihitung sebagai agregat terpisah dan tidak dijumlahkan ke total Kader.
- [x] Root, BPH, dan BPW yang berhak membuka detail menerima metrik; pembaca/pengelolaan Kader umum tetap menolak BPW.
- [x] Test mengunci angka agregat dan pengecualian kewenangan BPW khusus permukaan detail.

## Comments

**24 Agustus 2026 — ringkasan detail Struktur selesai.**

Detail Struktur kini memuat Kader Aktif kumulatif (total, AB1/AB2/AB3,
Ikhwan/Akhwat, Pemandu, dan Instruktur). Pembaca khusus detail menerima Root,
BPH, dan BPW, sedangkan pembaca agregat Kader umum tetap menolak BPW. Agregat
mengecualikan Kader Alumni, Non-Aktif, Sanksi, dan Terhapus; tes mengunci
akumulasi dari Struktur Anak dan seluruh batas kewenangan tersebut.
