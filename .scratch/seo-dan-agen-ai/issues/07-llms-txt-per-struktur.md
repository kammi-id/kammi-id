# 07 — `llms.txt` per Struktur

**What to build:** Setiap Situs Struktur menerbitkan `llms.txt` ringkas yang
memperkenalkan dirinya dan menunjuk permukaan utamanya.

**Blocked by:** 06 — isinya menunjuk alamat `.md` yang dibuat di sana.

**Status:** ready-for-agent

**Baca ini sebelum mengerjakan.** Tidak ada bukti satu pun vendor LLM membaca
`llms.txt`. Google Search menyatakan terang-terangan tidak memakainya dan
bahwa ia tidak membantu maupun merugikan. Tiket ini tetap dikerjakan karena
biayanya kecil dan karena Chrome Lighthouse mulai mengauditnya di kategori
"Agentic Browsing" — bukan karena terbukti bekerja. Jangan menaikkan
prioritasnya, dan jangan menambah cakupannya.

- [ ] Route handler `llms.txt` di bawah segmen tenant, mengikuti bentuk
      `robots.ts` dan `sitemap.ts` yang sudah ada.
- [ ] Struktur yang Situsnya belum Aktif, Non-Aktif, atau Terhapus menjawab
      404 — aturan yang sama dengan `sitemap.ts` (ADR 0013).
- [ ] Isinya mengikuti spesifikasi llmstxt.org: satu `# Judul` (nama Struktur),
      satu blockquote ringkasan, lalu bagian bertajuk `##` berisi daftar
      tautan berketerangan.
- [ ] Bagian yang dimuat: **Tentang** (`/tentang.md` bila tiket 08 sudah jalan,
      `/tentang` bila belum), **Berita** (`/berita.md`), **Pengurus**, dan
      untuk PP saja **Berita KAMMI se-Indonesia**.
- [ ] Menunjuk alamat `.md` bila ada, HTML bila belum. Berkas ini tidak boleh
      menunggu tiket 08 untuk berguna.
- [ ] **Tidak** memuat daftar seluruh Berita. Arsip kronologis tumbuh terus;
      berkas yang mendaftarnya basi pada Berita berikutnya. Itu tugas
      `/berita.md`.
- [ ] Tidak ada `llms-full.txt` — ditolak di ADR 0024.
- [ ] Uji: PP memuat bagian Berita KAMMI se-Indonesia, PW tidak; Situs belum
      Aktif menjawab 404.
- [ ] `check:types`, `check:lint`, `check:structure` hijau.
