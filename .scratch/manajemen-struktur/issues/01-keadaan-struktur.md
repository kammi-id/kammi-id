# 01 — Keadaan Struktur: Aktif, Non-Aktif, Terhapus

**Type:** grilling
**Status:** resolved
**Blocked by:** —

## Question

Sebuah Struktur sekarang punya tiga keadaan yang sudah diputuskan isinya
tapi belum diputuskan **bentuknya**. Tiket ini menetapkan model keadaannya dan
menulis hasilnya ke `CONTEXT.md`.

Yang harus terjawab:

1. **Satu sumbu atau dua?** Keadaan Kader (`CONTEXT.md:109`) saling meniadakan
   — tepat satu dalam satu waktu, ditegakkan lewat ADR 0001. Apakah Struktur
   mengikuti pola yang sama (Aktif | Non-Aktif | Terhapus, saling meniadakan),
   atau Terhapus adalah sumbu terpisah yang bisa menumpuk di atas Non-Aktif?
   Charting menyebut keduanya "dua sumbu terpisah", tapi itu dikatakan untuk
   membedakan **maknanya**, bukan untuk memutuskan representasinya. Perhatikan
   Q22: pemulihan mengembalikan langsung ke **Aktif** — kalau dua sumbu, itu
   berarti pemulihan diam-diam ikut membersihkan sumbu Non-Aktif, dan itu
   perlu dinyatakan, bukan disimpulkan.

2. **Istilah kanoniknya apa.** "Terhapus" belum ada di `CONTEXT.md`. Apakah
   itu nama yang dipakai, dan apa lawannya untuk keadaan normal — "Aktif"
   sudah dipakai sebagai Keadaan **Kader**, dan memakainya lagi untuk Struktur
   berisiko bikin dua hal berbeda bernama sama.

3. **Tiga definisi yang berubah di `CONTEXT.md`.** Tiket ini memegang pena
   untuk ketiganya, jangan dicicil dari tiket lain:
   - **BPW** (`:96`) — "mengelola kestrukturan: Struktur beserta pohonnya"
     sekarang salah; BPW di PW tidak mengelola pohonnya.
   - **BPH** (`:89`) — "memantau, tanpa boleh mengubahnya" dibalik.
   - **Struktur Non-Aktif** (`:75`) — definisinya masih benar tapi belum
     menyebut akibat apa pun; sekarang ia mematikan Akun dan situs publik.

4. **Layak ADR?** Tiga syaratnya (sulit dibalik, mengejutkan tanpa konteks,
   hasil trade-off nyata) mungkin terpenuhi untuk keputusan "tidak ada hard
   delete, selamanya" — terutama karena `code` ikut dikunci permanen demi
   Nomor Induk Anggota. Putuskan sadar, jangan otomatis.

Bahan yang sudah pasti dan **tidak** dibuka ulang di sini: syarat penghapusan
(nol anak, nol Member, nol Daurah), akibat Non-Aktif, kolom jejak
`deletedAt`/`deletedBy` dan `nonActiveAt`/`nonActiveBy`, `code` dikunci
`slug` dibebaskan. Lihat **Notes** di `map.md`.

## Answer

### 1. Satu sumbu, dua kolom, Terhapus mendominasi

Model domainnya **satu sumbu**: sebuah Struktur berada pada tepat satu Keadaan
— Aktif, Non-Aktif, atau Terhapus — persis seperti Keadaan Kader.
Penyimpanannya **dua kolom**: `is_non_active` yang sudah ada dibiarkan apa
adanya, `deleted_at` ditambahkan. Keadaan dibaca berurutan, **Terhapus
mendahului Non-Aktif**: ada `deleted_at` → Terhapus; kalau tidak dan
`is_non_active` → Non-Aktif; sisanya Aktif.

Kolom enum tunggal ditolak karena `is_non_active` sudah berisi data production
dan sudah punya call-site baca (`getCachedOrganizations({ isNonActive: false })`
di `trainings/page.tsx:45`) — menukarnya berarti memindahkan data hidup demi
kerapian yang bisa dicapai lebih murah.

Baris yang `is_non_active` **dan** `deleted_at` menyala bersamaan itu **sah**,
dan artinya Terhapus. Penghapusan tidak menyapu `is_non_active`; mendominasi
bukan berarti menghapus.

Pemulihan mengosongkan **dua-duanya**, jadi Struktur yang Non-Aktif → dihapus →
dipulihkan kembali sebagai **Aktif**, bukan Non-Aktif. Ini dinyatakan, bukan
disimpulkan.

Dicatat sebagai **ADR 0005** (`docs/adr/0005-keadaan-struktur-satu-sumbu-dua-kolom.md`).

### 2. Derivasinya hidup di skema

Keadaan turunan itu **kolom `generatedAlwaysAs`** di tabel `organization`,
mengikuti pola `level` dan `code_slug` yang sudah ada di tabel yang sama. Alasan
pemilihannya: itu menambal persis keluhan yang dicatat ADR 0001 — skema yang
tidak menyuarakan modelnya — dan karena generated, ia **tidak butuh backfill**,
jadi migrasinya murah.

Kolom turunan **tidak menggantikan** kebutuhan satu pembaca terpusat di
`db/query/organization.ts`: kolom bikin Keadaan bisa dibaca, tidak bikin orang
ingat menyaringnya. Dua-duanya dibangun. Yang ditolak adalah membiarkan tiap
call-site menyaring sendiri seperti hari ini.

### 3. Istilah kanonik: headword berprefiks

Bagian baru **`### Keadaan Struktur`** di `CONTEXT.md`, ditaruh persis sebelum
`### Keadaan Kader` supaya dua "Keadaan" bersebelahan dan bedanya kelihatan
sekali baca. Headword-nya **berprefiks** — **Struktur Aktif**, **Struktur
Non-Aktif**, **Struktur Terhapus** — karena prefiks itu memang yang orang tulis
sendiri di prosa (`map.md` sudah melakukannya di mana-mana), dan tanpanya
"Non-Aktif" bertabrakan dengan Keadaan Kader yang sudah memakai nama itu.
Mencari kata yang sama sekali lain (Berjalan/Vakum/Dicabut) ditolak: jangan
mengarang kosakata untuk konsep yang orangnya sudah punya kata.

### 4. Terhapus = koreksi catatan, bukan pensiun

Ini keputusan model, bukan pemilihan kata, dan dia yang menjelaskan kenapa
syarat penghapusannya nol-isi. **Struktur Terhapus adalah Struktur yang tercatat
keliru** — salah Jenjang, duplikat, atau dibuat lalu tidak jadi berjalan.
Non-Aktif menyangkut kepengurusan yang berhenti; Terhapus menyangkut catatan
yang keliru.

Syarat "nol anak, nol Member, nol Daurah" jadi masuk akal sendiri di bawah
bacaan ini: yang sudah punya sejarah tidak keliru, ia cuma berhenti — dan itu
Non-Aktif. Bacaan "Terhapus = pensiun permanen" ditolak karena bentrok dengan
syaratnya sendiri: yang pernah berjalan pasti punya Member atau Daurah, jadi
justru tidak akan pernah bisa dihapus.

### 5. "Seolah barisnya tidak ada" — dan itu ketat

Struktur Terhapus **diperlakukan seolah barisnya tidak pernah ada di basis
data**, tanpa benar-benar mengeluarkannya. Ini prinsip, bukan detail:

- Slug yang menunjuk Struktur Terhapus menghasilkan **404**, sama persis dengan
  slug yang memang tidak pernah ada.
- Tidak muncul di pohon, di dropdown induk, di agregat, di pencarian, di mana
  pun.
- **Tidak ada permukaan yang berkata "Struktur ini sudah dihapus."** Kalimat itu
  sendiri membocorkan bahwa ia ada. Sistem tidak boleh punya jawaban berbeda
  antara "tidak pernah ada" dan "pernah ada lalu dihapus" — begitu ada bedanya,
  ia tidak lagi seolah dihapus, ia cuma disembunyikan.
- Pengecualiannya **satu dan disengaja**: permukaan Root.
  **DIAMANDEMEN oleh tiket 12** — permukaan itu dibuka juga untuk **BPW PP**,
  memperbaiki asimetri "boleh hapus, tidak boleh batal" yang tertinggal di
  matriks tiket 02. `CONTEXT.md` sudah ikut disunting. Tiket 12 juga menutup
  lubang yang tiket ini tinggalkan: **anak Terhapus tidak menghitung** untuk
  prasyarat "nol anak" induknya, sehingga rantai Terhapus-di-bawah-Terhapus
  mungkin terjadi.

Harganya diterima sadar: tautan lama jadi 404 tanpa penjelasan.

### 6. Transisi Non-Aktif → Terhapus: boleh

Syarat nol-isi adalah **satu-satunya** penjaga penghapusan; Keadaan asal tidak
dilihat. Mengharuskan Struktur diaktifkan dulu sebelum dihapus itu ritual tanpa
perlindungan tambahan — orang tinggal klik Aktifkan lalu Hapus. Struktur
Non-Aktif yang kosong melompong justru persis kasus "dibuat lalu tidak jadi
berjalan" di poin 4.

Tabel transisi lengkapnya:

| Dari      | Ke        | Boleh                                | Catatan                             |
| --------- | --------- | ------------------------------------ | ----------------------------------- |
| Aktif     | Non-Aktif | ya                                   | anak harus dipindah lebih dulu      |
| Non-Aktif | Aktif     | ya                                   | —                                   |
| Aktif     | Terhapus  | ya, kalau nol anak/Member/Daurah     | —                                   |
| Non-Aktif | Terhapus  | ya, kalau nol anak/Member/Daurah     | `is_non_active` dibiarkan menyala   |
| Terhapus  | Aktif     | ya — Root **dan BPW PP** (tiket 12)  | mengosongkan `deleted_at` **dan** `is_non_active` |
| Terhapus  | Non-Aktif | **tidak**                            | pemulihan selalu berujung Aktif     |

### 7. Tiga definisi `CONTEXT.md` — sudah ditulis

Ketiganya sudah masuk, dan pena tiket ini ditutup di sini — tiket lain jangan
menyentuh ketiganya lagi.

- **BPW** — "Struktur beserta pohonnya" diganti: Struktur **di bawah**
  Strukturnya sendiri, tidak pernah Strukturnya sendiri, dan seberapa jauh ke
  bawah ditentukan Jenjang Strukturnya (sehingga sebagian BPW tidak mengelola
  apa pun). Sengaja tidak menyebut PP/PD/PW satu-satu — begitu glosarium
  menyalin matriks tiket 02, ada dua tempat yang harus dijaga sinkron.
- **BPH** — "tanpa boleh mengubahnya" dibalik: memantau seluruh data dalam
  Cakupannya, ditambah satu hak ubah, yaitu menyunting Strukturnya sendiri —
  identitasnya, bukan kedudukannya di pohon maupun Keadaannya. Frasa itu
  menutup `code`/`type`/`parentId`/penonaktifan tanpa menyebut nama kolom di
  dalam glosarium.
- **Struktur Non-Aktif** — dipindah dari bagian Struktur ke bagian Keadaan
  Struktur yang baru, kalimat aslinya dipertahankan dan ditambahi akibatnya
  (tidak mencatat Kader baru, tidak menyelenggarakan Daurah, Akun mati, situs
  publik mati — tapi tetap terlihat dari dalam dasbor).

### 8. Dua ADR, bukan satu

- **ADR 0004** — `docs/adr/0004-tidak-ada-hard-delete-struktur.md`. Tidak ada
  hard delete selamanya, dan `code` dikunci selamanya. Satu paket karena sebabnya
  satu: `code` tersusun ke Nomor Induk Anggota yang permanen dan dipakai sebagai
  identitas login, jadi `code` yang berpindah tangan berarti dua Kader login
  sebagai satu orang. Opsi "hard delete khusus Struktur kosong" ditolak karena
  "nol Member" ≠ "tidak pernah punya Member" — Member sendiri dihapus lunak
  (`member.deleted_at`), jadi Struktur bisa lolos syarat sambil masih
  menggantung Member terhapus yang Nomor Induknya tercetak dari `code` itu.
- **ADR 0005** — lihat poin 1.

Digabung jadi satu ditolak: itu bakal jadi ADR yang menjawab dua "kenapa" tak
berhubungan, dan yang begitu tidak pernah kebaca lagi.

### Yang sengaja diserahkan ke tiket lain

- **Apakah `code`/`slug` milik Struktur Terhapus bebas dipungut Struktur baru.**
  "Seolah tidak ada di DB" seakan bilang iya, ADR 0004 seakan bilang tidak.
  Yang berhak memutus itu **tiket 03** — prinsip di poin 5 jadi bahan masuk
  untuknya, bukan jawabannya.
- **Nasib Artikel, Kategori Artikel, dan Pengaturan Situs.** Naik dari kabut
  jadi **tiket 10**.
- **Nasib Akun** milik Struktur Terhapus — **tiket 05**.

### Amandemen dari tiket 05

Satu klausa di poin 7 terlalu luas dan sudah diperbaiki di `CONTEXT.md`:
**"Akun-akunnya berhenti bisa dipakai" → "Akun kepengurusannya berhenti bisa
dipakai"**, ditambah pernyataan bahwa **Akun Kader di dalamnya tetap hidup**.

Alasannya ada di kalimat definisi itu sendiri: Non-Aktif "menyangkut keadaan
kepengurusan, bukan keadaan Kader di dalamnya". Menonaktifkan sebuah PD tidak
boleh ikut mengunci ratusan Kader dari akun mereka sendiri. Yang mati hanya
empat Akun kepengurusan: BPH, BPK, BPW, Humas. Rinciannya di **tiket 05**.

### Catatan untuk yang membangun

`map.md` menyebut jejaknya `deletedAt`/`deletedBy` dan
`nonActiveAt`/`nonActiveBy`. Preseden Kader di repo ini
(`db/schema/member.sql.ts:40`) cuma punya `deletedAt`, tanpa `deletedBy`. Peta
tetap diikuti — Struktur beda taruhannya — tapi sadari kolom `*By` itu pola
**baru**, bukan mengikuti yang sudah ada.
