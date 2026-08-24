# 01 — Detail Struktur dan integritas jalur

**What to build:** Pengurus Root, BPH, atau BPW dapat membuka detail Struktur di dalam Cakupannya melalui jalur URL bertingkat yang benar. Detail dasar menunjukkan identitas Struktur, Induk/remah roti, Jenjang, Keadaan, dan logo bila tersedia. `/dashboard/branches` tanpa jalur tetap menjadi grid Struktur Anak dari Struktur terhubung Akun.

**Blocked by:** None — can start immediately.

**Status:** claimed

- [ ] Jalur bertingkat yang sah hanya mengikuti rantai Induk → Struktur Anak; jalur yang tidak sah, Terhapus, atau di luar Cakupan tidak membocorkan keberadaan Struktur.
- [ ] Struktur PK dapat dibuka sebagai detail, sedangkan top-level tetap grid tanpa detail Struktur sendiri.
- [ ] Root, BPH, dan BPW dalam Cakupan menerima detail; peran atau target lain tetap ditolak oleh batas kestrukturan yang berlaku.
- [ ] Pembaca detail terotorisasi menjadi seam tunggal untuk resolusi jalur dan data identitas; test mengunci perilaku eksternalnya.
