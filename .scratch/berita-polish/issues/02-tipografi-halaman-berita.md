# 02 — Tipografi halaman Berita

**What to build:** Badan tulisan Berita terbaca seperti tulisan, bukan seperti
paragraf yang menempel satu sama lain. Kelas `prose` yang selama ini mati
dihidupkan.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `@tailwindcss/typography` terpasang dan terdaftar di `globals.css`,
      sehingga `prose` benar-benar berefek.
- [x] Badan tulisan di halaman Berita rata kiri-kanan dengan `hyphens: auto`,
      dan punya jarak antar paragraf.
- [x] Judul artikel **tetap rata kiri**. Judul dua baris yang dipaksa rata
      kiri-kanan merenggang jelek.
- [x] Editor badan tulisan di dasbor ikut memakai `prose` yang sama, sehingga
      apa yang dilihat Humas saat menyunting mendekati hasil terbitnya.
- [x] Gambar di dalam badan tulisan tampil dengan lebar yang wajar di dalam
      kolom teks, tidak melimpah keluar.
- [x] Tidak ada tes yang ditulis untuk perubahan kelas Tailwind. Ukuran
      keberhasilannya adalah halaman yang dilihat, bukan assertion.
- [x] `check:types`, `check:lint`, dan `check:structure` hijau.
