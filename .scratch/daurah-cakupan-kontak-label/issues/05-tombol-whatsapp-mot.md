# 05 — Tombol WhatsApp MoT di halaman detail Daurah

**What to build:** tombol yang membuka percakapan WhatsApp dengan Master of
Training, memakai nomor yang tersimpan di data Member-nya.

**Blocked by:** 04 — nomor harus sudah E.164 sebelum tautannya bisa dipercaya.

**Status:** ready-for-agent

## Yang dibangun

Di `training-detail-view`, di dekat nama MoT. Tautannya `https://wa.me/<digit>`
— E.164 tanpa `+`, yang persis bentuk yang diminta WhatsApp. Pesan awal
**kosong**; pesan terisi terbaca kaku dan operator tetap menghapusnya.

**Hanya untuk `canManage`.** Halaman detail dijaga `AccessGuard` untuk `root`,
`bph`, dan `bpk`; BPH memantau data, ia tidak menghubungi perangkat Daurah.
Nomor kontak pribadi tidak perlu ikut terbuka ke pemantau.

**MoT tanpa nomor:** tombol tetap tampil dalam keadaan mati, dengan keterangan
bahwa nomor MoT belum terisi. Tombol yang hilang membuat operator mengira
fiturnya rusak; tombol mati memberitahu apa yang kurang. Per staging, 1927 dari
4900 Member belum punya nomor, jadi keadaan ini akan sering terlihat.

Daurah tanpa MoT sama sekali tidak menampilkan apa pun — tidak ada yang
dihubungi.

## Satu fungsi, bukan dua

`profile-info.tsx:170` sudah punya konversinya sendiri:
`phone.replace(/\D/g,'').replace(/^0/,'62')`. Angkat jadi satu helper bersama,
dan alihkan pemanggil lama ke sana. Sesudah tiket 04 nomor sudah E.164,
sehingga helper-nya tinggal membuang `+` — tapi ia tetap harus tahan menghadapi
baris cacat yang sengaja tidak ikut dikonversi.

## Acceptance

- [ ] Tombol muncul di detail Daurah bagi pemegang `canManage` saja
- [ ] Menekan tombol membuka `wa.me` dengan nomor MoT, pesan kosong
- [ ] MoT tanpa nomor: tombol mati dengan keterangan yang jelas
- [ ] Nomor cacat yang tidak ikut dikonversi tidak menghasilkan tautan ngawur
- [ ] Daurah tanpa MoT tidak menampilkan tombol
- [ ] `profile-info.tsx` memakai helper yang sama, salinannya hilang
- [ ] Tombolnya punya nama yang terbaca pembaca layar
- [ ] `bun run check:types` lolos
