# 05 — Staging berisi data production, dan prosedurnya tertulis

**What to build:** Staging menampilkan data yang sama dengan production — foto
Kader muncul, logo Struktur muncul, Artikel bergambar utuh — dan cara
mengulanginya tercatat, bersama cara mengembalikan staging ke sha sebelumnya
saat sebuah deploy merusaknya.

Prosedurnya ditulis **saat pertama kali dijalankan**, bukan sesudahnya dari
ingatan. Itu alasan kedua pekerjaan ini berada di satu tiket.

**Blocked by:** 04 (push ke `dev-*` mendarat di staging)

**Status:** ready-for-human — butuh akses SSH ke host production dan kredensial
basis data

Keputusan dan konsekuensinya ada di
[ADR 0009](../../../docs/adr/0009-staging-membawa-data-production.md). Dua hal
dari sana mengikat pekerjaan ini:

**Rutenya lewat mesin lokal sebagai perantara.** Tidak boleh ada kunci SSH
permanen dari mesin non-production ke production — itu menjadikan staging pintu
belakang menuju production. Kerepotan perantara adalah harga yang dibayar untuk
tidak memiliki jalur tersebut.

**Basis data dan volume adalah dua artefak terpisah** (lihat juga
[ADR 0006](../../../docs/adr/0006-gambar-di-volume-bukan-object-storage.md)).
Menyalin salah satu tanpa yang lain menghasilkan staging penuh baris yang
menunjuk berkas yang tidak ada. Itu tidak merusak — placeholder menanganinya —
tetapi diam-diam mengembalikan persis penyakit yang ADR 0006 obati, di
lingkungan yang tugasnya justru menemukan penyakit semacam itu.

Penyalinan ini **bukan** bagian pipeline deploy, dan tidak boleh dijadikan
bagiannya: ia destruktif dan berdurasi menit.

- [ ] `pg_dump` production direstore ke Postgres staging lewat mesin lokal
- [ ] Volume unggahan production tersalin ke volume staging
- [ ] Kunci gambar tersalin persis apa adanya — diverifikasi dengan jumlah objek
      dan total byte, bukan dengan melihat sekilas
- [ ] Verifikasi dengan mata: satu halaman publik berfoto Kader, satu logo
      Struktur di dasbor, satu Artikel bergambar
- [ ] Tidak ada kunci SSH dari mesin non-production ke production yang tertinggal
- [ ] Prosedur penyegaran data tertulis dan dapat diikuti tanpa bertanya
- [ ] Prosedur rollback tertulis: mengembalikan staging ke sha sebelumnya
- [ ] Prosedur rollback terbukti bekerja, bukan hanya tertulis
- [ ] `README.md` menunjuk ke keduanya
