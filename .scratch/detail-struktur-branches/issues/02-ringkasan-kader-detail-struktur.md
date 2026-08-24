# 02 — Ringkasan Kader detail Struktur

**What to build:** Detail Struktur menampilkan ringkasan Kader Aktif dalam Cakupannya: total, AB1/AB2/AB3, Ikhwan/Akhwat, Pemandu, dan Instruktur. BPW dapat melihat angka ini hanya pada detail Struktur tanpa mendapat akses daftar maupun pengelolaan Kader.

**Blocked by:** 01 — Detail Struktur dan integritas jalur.

**Status:** ready-for-agent

- [ ] Angka kumulatif menghitung Cakupan Struktur dan mengecualikan Alumni, Kader Non-Aktif, serta Kader Sanksi.
- [ ] Pemandu dan Instruktur dihitung sebagai agregat terpisah dan tidak dijumlahkan ke total Kader.
- [ ] Root, BPH, dan BPW yang berhak membuka detail menerima metrik; pembaca/pengelolaan Kader umum tetap menolak BPW.
- [ ] Test mengunci angka agregat dan pengecualian kewenangan BPW khusus permukaan detail.
