# 01 — Prefactor: situs publik pindah ke bawah segmen tenant

**What to build:** Situs publik berpindah ke bawah satu segmen tenant, dan seluruh pembaca Pengaturan Situs berhenti memanggil PP di dalam dirinya sendiri — identitas Struktur dioper sebagai argumen, mengikuti bentuk yang sudah dipakai pembaca di dasbor. Bagi pembaca situs tidak ada yang berubah: `kammi.id` melayani beranda, tentang, pengurus, berita, dan event persis seperti sebelumnya. Nol perubahan yang kelihatan adalah ukuran keberhasilan tiket ini.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Setiap halaman publik yang hari ini dilayani `kammi.id` tetap dilayani dengan isi yang sama setelah pemindahan, termasuk metadata dan JSON-LD-nya.
- [ ] Tidak ada lagi pembaca data di jalur render situs publik yang menentukan Struktur dari dalam dirinya sendiri; identitas Struktur selalu datang dari pemanggil.
- [ ] Root layout tetap satu dan tetap dipakai bersama situs publik dan dasbor; font serta `globals.css` tidak diduplikasi (ADR 0012).
- [ ] Penandaan cache Pengaturan Situs menyebut Struktur, sebagaimana yang sudah berlaku di pembaca dasbor.
- [ ] Penjagaan terhadap basis data yang tidak tersedia saat build tetap ada dan tetap teruji.
- [ ] `check:types`, `check:lint`, dan `check:structure` hijau.
