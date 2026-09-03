# 08 — Salinan Markdown untuk `tentang` dan `tentang/pengurus`

**What to build:** Dua halaman yang paling menjawab "KAMMI itu apa" bisa
dibaca agen sebagai Markdown.

**Blocked by:** 06 — memakai konvensi alamat, header, dan front-matter yang
ditetapkan di sana.

**Status:** ready-for-agent

Dipisah dari tiket 06 karena biayanya berbeda jenis, bukan karena kurang
penting. `tentang` dan `pengurus` tidak dirender dari ProseMirror melainkan
dari Pengaturan Situs (`TentangSettings`, `LeadershipSettings`), sehingga
serializer tiket 06 tidak bisa dipakai ulang dan masing-masing butuh penulis
Markdown tersendiri.

Justru ini halaman yang paling sering menjawab pertanyaan orang kepada agen
AI tentang KAMMI. Ia belakangan dalam urutan, bukan belakangan dalam nilai.

- [ ] `/tentang.md` menuliskan Visi, Misi, Kredo, Prinsip, Paradigma,
      Karakteristik, Unsur, dan Sejarah sebagai heading dan prosa Markdown —
      urutan yang sama dengan halaman HTML-nya, supaya keduanya tidak pernah
      bercerita beda.
- [ ] `/tentang/pengurus.md` menuliskan periode kepengurusan, triumvirat
      (Ketua, Sekretaris, Bendahara), dan `leaderBlocks` sebagai daftar
      bernama beserta jabatannya.
- [ ] Foto tidak ikut, kecuali sebagai tautan gambar bila memang bermakna.
      Yang dicari agen di halaman ini adalah nama, jabatan, dan periode.
- [ ] Front-matter mengikuti konvensi tiket 06, dengan `date` diisi waktu
      pembaruan Pengaturan Situs — halaman ini tak bertanggal terbit.
- [ ] Kedua jalan berlaku sama seperti tiket 06: suffix `.md` dan
      `Accept: text/markdown`, dengan header `Link: rel="canonical"`.
- [ ] Kedua alamat masuk ke `llms.txt` (tiket 07) menggantikan tautan HTML-nya.
- [ ] Struktur yang belum mengisi Pengaturan Situs-nya menuliskan bagian yang
      terisi saja, bukan heading kosong berderet.
- [ ] `check:types`, `check:lint`, `check:structure` hijau.
