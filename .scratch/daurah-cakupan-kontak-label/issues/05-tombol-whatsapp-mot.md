# 05 — Tombol WhatsApp MoT di halaman detail Daurah

**What to build:** tombol yang membuka percakapan WhatsApp dengan Master of
Training, memakai nomor yang tersimpan di data Member-nya.

**Blocked by:** 04 — nomor harus sudah E.164 sebelum tautannya bisa dipercaya.
Tiket 04 sudah **done** (2026-09-07), jadi tiket ini tidak lagi terblokir.

**Status:** done — dikerjakan 2026-09-07, lihat Comments

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

- [x] Tombol muncul di detail Daurah bagi pemegang `canManage` saja
- [x] Menekan tombol membuka `wa.me` dengan nomor MoT, pesan kosong
- [x] MoT tanpa nomor: tombol mati dengan keterangan yang jelas
- [x] Nomor cacat yang tidak ikut dikonversi tidak menghasilkan tautan ngawur
- [x] Daurah tanpa MoT tidak menampilkan tombol
- [x] `profile-info.tsx` memakai helper yang sama, salinannya hilang
- [x] Tombolnya punya nama yang terbaca pembaca layar
- [x] `bun run check:types` lolos

## Comments

### 2026-09-07 — status pasca tiket 04

Tiket 04 sudah membuat `toWaMeDigits` di `src/lib/validation/phone.ts` dan
memakainya di `profile-info.tsx`, menggantikan tebakan ad hoc lama — jadi
"satu fungsi, bukan dua" di atas sudah separuh jalan. **Belum** memenuhi
acceptance "Nomor cacat yang tidak ikut dikonversi tidak menghasilkan tautan
ngawur": `toWaMeDigits` hari ini cuma membuang `+`, tanpa memvalidasi bentuk
E.164-nya dulu. Nomor lama yang masih cacat berprefiks dobel (mis.
`0628123456789`, sengaja tidak ikut dikonversi backfill tiket 04) akan lolos
apa adanya jadi tautan `wa.me` yang salah bentuk. Perlu ditambah pemeriksaan
bentuk sebelum tombol tampil aktif — bukan cuma "MoT tanpa nomor" yang harus
mematikan tombolnya, "nomor ada tapi bukan E.164 yang sah" juga harus.

### 2026-09-07 — selesai

- `isValidE164` baru (`src/lib/validation/phone.ts`) memeriksa bentuk
  E.164 pada nilai MENTAH, sebelum normalisasi — baris cacat berprefiks
  dobel (`0628…`) tidak diawali `+`, jadi langsung gagal alih-alih ditebak
  jadi sesuatu yang salah bentuk. `phoneFormField` direfaktor memakainya
  juga, menghapus duplikasi regex yang sebelumnya ada di dua tempat.
- `toValidWaMeDigits` baru menyatukan trim → `isValidE164` →
  `toWaMeDigits` jadi satu pintu. `MotWhatsappButton`
  (`training-detail-view.tsx`) dan `cleanPhone` di `profile-info.tsx`
  sama-sama memanggil lewat sini — sebelumnya kedua tempat menulis ulang
  bentuk yang sama (ditemukan review Standards), sekarang cuma satu.
- `MotWhatsappButton` muncul di baris instruktur ber-peran `master`, hanya
  saat `canManage`: tautan `wa.me` aktif kalau nomornya sah, tombol mati
  dengan tooltip kalau kosong atau cacat. Daurah tanpa MoT tidak
  merender apa pun (tidak ada baris `master` untuk dilekati).
- `profile-info.tsx` ikut diperbaiki: tautan WhatsApp-nya sekarang
  bersembunyi (bukan pura-pura jalan) kalau `member.phone` bukan E.164
  yang sah — bug yang sama persis, di luar cakupan tertulis tiket ini
  tapi memakai helper yang sama sehingga janggal dibiarkan pincang.
  Review Spec menandai ini scope creep yang beralasan, bukan bebas
  begitu saja — dicatat di sini supaya jelas.
- Tes: `phone.test.ts` menambah kasus untuk `isValidE164` dan
  `toValidWaMeDigits` (termasuk prefiks dobel, string kosong, spasi
  pinggir); `training-detail-view.test.tsx` baru — render komponen
  penuh dengan `next/link`/`next/navigation` di-mock, mengecek kelima
  skenario tombol (sah, kosong, cacat, bukan `canManage`, tanpa MoT).
- Review Standards + Spec (dua sub-agent paralel) lolos setelah satu
  putaran perbaikan: temuan duplikasi (trim/validasi/konversi ditulis
  dua kali) diperbaiki dengan `toValidWaMeDigits` di atas.
- `bun run check:types`, `check:structure`, `check:lint` (0 error, warning
  pra-ada saja) lolos. `bun test` untuk berkas yang disentuh lolos bersih;
  full-suite gabungan menunjukkan kegagalan `db.execute is not a function`
  pra-ada dan tidak terkait (lihat memory
  `full-suite-db-undefined-pre-existing`).
