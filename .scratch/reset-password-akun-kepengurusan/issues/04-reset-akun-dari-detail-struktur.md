# 04 — Reset Akun dari detail Struktur

**What to build:** Root, BPH, dan BPW dapat memilih serta mereset satu Akun
Kepengurusan aktual dari detail Struktur turunan yang dapat mereka buka, dengan
verifikasi ulang password pelaku dan hasil kredensial sekali tampil.

**Blocked by:** 02 — Fondasi audit dan reset atomik.

**Status:** resolved

- [ ] Gate baru memakai akses baca kestrukturan lalu menolak Struktur sendiri,
  saudara, luar Cakupan, Terhapus, palsu, dan aktor selain Root/BPH/BPW.
- [ ] Daftar uncached hanya memuat akun aktual yang terhubung ke Struktur dan
  memiliki role BPH/BPK/BPW/Humas; Akun Root dan Akun Kader tidak pernah muncul.
- [ ] Action memverifikasi ulang sesi, password pelaku, gate, ID target, role,
  serta hubungan akun–Struktur pada saat mutasi.
- [ ] Tombol reset berdiri di luar `BranchDetailActions` dan tidak mengubah
  matriks kemampuan kestrukturan existing.
- [ ] Dialog memakai label BPW/BPD/BPKOM kontekstual, mendukung akun duplikat,
  serta mengonfirmasi username, Struktur, dan pencabutan sesi.
- [ ] Hasil menyamarkan password secara asali dan menyediakan salin username,
  password, atau keduanya tanpa CSV maupun persistensi plaintext.
- [ ] Struktur Non-Aktif dapat direset dengan penjelasan bahwa akun tetap tidak
  dapat login; seluruh penolakan lain tidak membocorkan keberadaan target.
