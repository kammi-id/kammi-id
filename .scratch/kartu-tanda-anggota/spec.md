# Kartu Tanda Anggota: login Kader, batas suntingnya, dan kartunya

Lahir dari satu sesi penelusuran bersama pengambil keputusan (9 September 2026).
Pertanyaan yang diajukan sederhana — "buat fitur untuk Kader perorangan: login
dengan NIA, dasbornya menampilkan kartu, dan ia hanya boleh menyunting dirinya
sendiri" — dan penelusuran menemukan bahwa sebagian besar fitur itu **sudah ada
dan sudah tayang**, termasuk pembatasan yang diminta. Yang belum ada adalah
kartunya. Yang tidak diminta, dan ternyata paling mendesak, adalah menutup
lubang wewenang di jalur yang sudah tayang itu.

## Yang ditemukan sebelum apa pun diputuskan

**Akun Kader sudah terbit otomatis.** `createMember` membuat baris `user`
dengan `name = registerNumber` (NIA), `role: 'member'`, dan `connectedMemberId`
terisi (`src/db/query/member.ts:318`). `mayHoldSession` meloloskan `member`
bahkan ketika Strukturnya Non-Aktif — memang disengaja (`keadaan-akun.ts`).

**Pembatasan "hanya dirinya sendiri" sudah ditegakkan.** `canEdit` di halaman
profil dan `canEditMember` di aksinya sama-sama menuntut
`connectedMember.id === memberId` untuk `role === 'member'`.

**Tetapi arah bahayanya salah tebak.** Yang berbahaya bukan Kader menyunting
Kader lain — itu sudah tertutup — melainkan Kader menyunting **kolom yang salah
tentang dirinya sendiri**. `profile-sidebar.tsx` menyodorkan kontrol `status`,
`isSuspended`, dan sertifikasi Perangkat kepada siapa pun yang `canEdit`. Kader
yang masuk hari ini dapat menaikkan dirinya ke AB3, menandai dirinya Instruktur,
dan mencabut Sanksi-nya sendiri.

**Kader yang didaftarkan satu per satu tidak pernah bisa masuk.**
`createMember` membangkitkan password lalu membuang plaintext-nya.
Hanya `bulk-upload` yang menampilkannya, karena ia melewati `createMember`.

**Halaman profil tidak punya gerbang baca sama sekali.** Setiap sesi bisa
mengetikkan NIA mana pun dan menerima alamat, telepon, tanggal lahir, serta
riwayat akademik dan karier pemiliknya. NIA berurutan di dalam satu Daerah
(ADR 0020).

**NIA bisa diganti sendiri.** `/dashboard/user/account` menulis `user.name`
untuk peran apa pun, dan bagi Akun Kader `user.name` **adalah** NIA-nya.

**BPH sudah bisa menyunting Strukturnya sendiri.** `requireOwnStrukturEditAccess`
+ `/dashboard/organization`, menyunting `name`, `slug`, `logo`. Permintaan
pertama sesi ini sudah selesai sebelum sesi dimulai; nol tiket.

## Yang diputuskan

**Kader menyunting apa yang ia ketahui, bukan apa yang ia terima.** Skemanya
dipecah dua menurut asal-usul data, bukan menurut sensitivitasnya. Rinciannya
di ADR 0027. `member.name` boleh disunting sendiri; `user.name` (NIA) tidak.

**Riwayat pendidikan, karier, dan Organisasi Eksternal ikut boleh disunting
sendiri** — ketiganya, bukan dua. Semuanya fakta hidup yang lebih diketahui
Kader daripada BPK-nya, dan tak satu pun menurunkan hak.

**Gerbang baca mengikat semua peran, bukan hanya `member`.** Sekalian menutup
lubang Cakupan pada BPK di jalur sunting.

**`Kekaderan` menjadi `Kaderisasi`** di `CONTEXT.md` dan di kode. `Pengkaderan`
dihapus, bukan diterjemahkan: "Perangkat Pengkaderan" menjadi "Perangkat", yang
memang nama yang sudah ada di glosarium. ADR lama tidak ikut disunting — sama
seperti "Berita Jaringan" di ADR 0012 & 0013.

**Kredensial plaintext keluar sekali, lewat layar dan berkas.** Tiga permukaan,
satu aturan. Reset password mematikan sesi yang hidup. Rinciannya di ADR 0028.

**Regenerasi massal mengambil Struktur sasaran di dalam Cakupan, termasuk
Struktur pemanggilnya sendiri** — bukan "seluruh Cakupan" sebagai makna asali
tombolnya. Dijaga tiga lapis: peringatan yang menyebut jumlah, kata konfirmasi
yang harus diketik, dan password pengurus yang menekannya.

**Kartu menampilkan, tidak membuktikan.** Ekspor lewat `satori` + `sharp`,
kartunya ditulis dua kali. Rinciannya di ADR 0029.

**QR verifikasi ditunda** menunggu pembicaraan dengan pemangku kepentingan.
Empat bentuk sudah dipetakan di tiket 07 supaya percakapan itu tidak mulai dari
nol. Kartunya **tidak** menyediakan ruang kosong menunggu QR.

## Urutan dan paralelisasi

Tiket 01 adalah fondasi dan berdiri sendiri: ia memindahkan nama
(`kekaderan.ts` → `kaderisasi.ts`, `requireKekaderanAccess` →
`requireKaderisasiAccess`) dan menambahkan dua hal yang dibutuhkan banyak tiket
lain (`deleteSessionsByUser`, pemecahan skema). Ia harus **mendarat lebih dulu**,
sendirian — bukan karena besar, melainkan karena ia mengganti nama berkas yang
tiket 02 sunting dan tiket 06 panggil, dan konflik "berkas dipindah sambil
disunting" adalah konflik paling mahal yang bisa dibuat git.

Setelah 01 mendarat, **02, 03, 04, dan 06 berjalan paralel**. 05 menunggu 04
(ia mengekspor komponen kartu yang 04 buat).

```
01 ──┬── 02 (celah wewenang)
     ├── 03 (kredensial add-form)
     ├── 04 (kartu + dasbor + sidebar) ── 05 (ekspor)
     └── 06 (regenerasi massal)

07 (QR) — needs-info, tidak menghalangi apa pun
```

## Rujukan

- ADR 0027 — pemecahan skema sunting-sendiri
- ADR 0028 — kredensial plaintext dan pemutusan sesi
- ADR 0029 — ekspor kartu, dan mengapa kartunya tidak membuktikan
- `CONTEXT.md` — **Kartu Tanda Anggota**, **Kaderisasi**, **Akun Kader**
