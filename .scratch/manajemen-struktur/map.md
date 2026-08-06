# Peta: Manajemen Struktur (PW/PD/PK)

**Label:** `wayfinder:map`

## Destination

Sebuah **spec siap-serah** di `.scratch/manajemen-struktur/spec.md` yang bisa
langsung dipecah jadi tiket implementasi: CRUD Struktur yang lengkap, dengan
semantik Terhapus dan Non-Aktif yang pasti dan matriks kewenangan yang tidak
menyisakan sel kosong. **Kodenya tidak disentuh oleh peta ini** — peta ini
memutuskan, orang lain yang membangun.

## Notes

**Domain.** Kosakatanya ada di `CONTEXT.md` — Struktur, Jenjang, Cakupan,
Kewenangan (Root/BPH/BPK/BPW/Humas/Akun Kader), dan bagian **Keadaan Struktur**.

Tiga definisi di sana sudah **ditulis ulang oleh tiket 01** dan pena untuk
ketiganya ditutup di sana — BPW, BPH, dan Struktur Non-Aktif (yang pindah ke
bagian Keadaan Struktur, berdampingan dengan Struktur Aktif dan Struktur
Terhapus yang baru). Tiket lain jangan menyentuh ketiganya lagi; kalau sebuah
tiket merasa perlu, itu tanda keputusannya bertabrakan dengan 01 dan yang
dibuka ulang adalah 01, bukan `CONTEXT.md`.

**Skill yang wajib dipanggil tiap sesi.**

- `/grilling` dan `/domain-modeling` — asali untuk tiket keputusan apa pun.
- `/impeccable` — **wajib begitu urusannya menyentuh desain**: tata letak,
  hierarki visual, keadaan kosong/galat, alur konfirmasi, salinan antarmuka,
  a11y. Berlaku untuk tiket 07 dan 08, dan untuk bagian mana pun dari spec
  akhir yang menggambarkan permukaan.
- `/shadcn` **dan** `base-ui-docs` — begitu ada komponen disebut. Repo ini
  memakai BaseUI sebagai lapisan primitif Shadcn, bukan RadixUI.
- `/prototype` — untuk tiket bertipe `prototype`.
- `/research` — untuk tiket bertipe `research`, dijalankan sebagai subagent.

**Batasan tetap: nol akses ke basis data produksi.** Ditetapkan pengguna 7
Agustus 2026 saat tiket 04 — sadar, dengan alasan risiko, dan **tidak akan
dicabut di peta ini**. `.env.local` adalah satu-satunya berkas env di repo dan
`DATABASE_URL`-nya menunjuk staging; kredensial produksi tidak ada di sini. Ada
basis data remote kosong yang meniru bentuk produksi untuk gladi bersih.
Akibatnya: **tidak satu pun tiket boleh bersandar pada fakta yang hanya bisa
dibaca dari data produksi.** Kalau sebuah keputusan menuntut fakta seperti itu,
yang diputuskan adalah bagaimana sistem berperilaku tanpanya — lihat tiket 04
sebagai polanya.

**Ketetapan dari sesi charting.** Ini keluaran grilling yang membentuk peta,
bukan hasil tiket. Sudah final — jangan dibuka ulang tanpa alasan baru.

- _Kewenangan itu satu, kekuatannya diturunkan dari Jenjang._ Hanya ada peran
  `bpw` di enum. "BPD" dan "BPKOM" murni nama tampilan yang dikarang saat Akun
  dibuat (`db/query/organization.ts:148-161`). Memecahnya jadi tiga nilai enum
  **di luar cakupan** — itu migrasi enum di basis data produksi.
- _Hak per Jenjang._ BPW PP: CRUD seluruh Struktur kecuali PP. BPW PD/PDLN:
  CRUD Komisariat dalam Cakupannya. BPW PW: memantau saja. BPW tidak pernah
  ada di PK (kode sudah melewatinya).
- _BPH menyunting Strukturnya sendiri_, kecuali `code`, `type`, `parentId`,
  dan penonaktifan. Termasuk BPH PP atas PP — dalam hierarki jabatan KAMMI,
  BPH (Ketua, Sekretaris, Bendahara) berada di atas BPW.
- _Pembuatan PD tersentralisasi di BPW PP._ Pengurus Wilayah tidak berwenang
  menambah Daerah di wilayahnya sendiri. Ini konsekuensi konstitusi
  organisasi, bukan celah desain — ikuti apa adanya.
- _Cakupan baca ditutup._ Halaman yang menerima slug Struktur menolak slug di
  luar Cakupan, pakai `isOrgInAccessScope` yang sudah ada
  (`db/query/organization.ts`). Jangan bikin gate baru. Polanya sudah
  ditegakkan di halaman Kader lewat `.scratch/celah-kewenangan/issues/05`.
- _Terhapus dan Non-Aktif adalah dua sumbu terpisah._ Terhapus ≠ Non-Aktif.
- _Penghapusan selalu soft, tidak ada hard delete._ Ditolak selama Struktur
  masih punya Struktur anak, Member, atau Daurah. Yang berisi hanya boleh
  dinonaktifkan.
- _Struktur Terhapus_ hilang dari semua pembacaan biasa; hanya Root yang
  melihat dan memulihkannya. Pemulihan mengembalikannya langsung ke **Aktif**.
- _`code` dikunci selamanya, `slug` dibebaskan._ `code` terbawa ke Nomor Induk
  Anggota yang permanen; melepasnya bisa membuat dua Kader punya Nomor Induk
  yang sama. `slug` cuma URL.
- _Struktur Non-Aktif_ tidak bisa menyelenggarakan Daurah dan tidak bisa
  mencatat Kader baru. Akun-akunnya mati. Situs publiknya mati **total** —
  artikelnya ikut 404, bukan sekadar hilang dari daftar.
- _Anak harus dipindahkan sebelum induknya dinonaktifkan_, kecuali anak itu
  sudah Non-Aktif lebih dulu.
- ~~_Keadaan Akun adalah kolom tersimpan_, bukan turunan dari Struktur.~~
  **DIBATALKAN oleh tiket 05**, dengan alasan baru yang ditemukan di kode: sesi
  sudah membawa Keadaan Struktur di tiap request (`db/query/cte/user.ts:16-26`),
  jadi kolom tersimpan membayar harga "wajib menyapu Akun di tiap jalur" tanpa
  membeli apa pun. Keadaan Akun **turunan**. Jangan hidupkan lagi tanpa membaca
  tiket 05 lebih dulu.
- _Penghapusan dan penonaktifan meninggalkan jejak_ berupa kolom
  `deletedAt`/`deletedBy` dan `nonActiveAt`/`nonActiveBy` — bukan tabel
  riwayat penuh.

**~~Celah aktif di produksi~~ — SUDAH DITAMBAL** (commit `a9c535b`).
`add-form/action.ts` dulu hanya memeriksa `role === 'bpw' || 'root'` — nol
Cakupan, nol cek Jenjang, dan `type` serta `parentId` datang dari form.
Gerbangnya sekarang di `src/lib/auth/kestrukturan.ts`
(`requireCreateStrukturAccess`, `requireEditStrukturAccess`, `isLegalChildType`),
`type`/`parentId` tidak lagi dibaca saat memperbarui, dan 17 tes menjaganya.

**Ini bukan implementasi tiket 02.** Ia tambalan keamanan yang sengaja sempit:
Cakupan, Jenjang, dan pembekuan `type`/`parentId`. Matriks penuh tiket 02 —
`canManageKestrukturan` beserta dua gate async-nya — tetap pekerjaan
implementasi yang tiket 09 potong, dan ia **menggantikan** dua gerbang sempit di
berkas itu, bukan berdiri di sebelahnya.

**Keadaan kode saat charting.** CRUD-nya baru C-R-U:

- `deleteOrganization` (`db/query/organization.ts:325`) nol call-site.
- `organization.isNonActive` tidak punya satu pun jalur tulis.
- `AccessGuard levelRequirement={2}` di `branches/[[...slug]]/page.tsx:131`
  menolak Akun level 3 — BPKom PD tidak bisa membuka halamannya sendiri.
- Tombol Edit tidak ikut di-gate; `canManage` hanya menyembunyikan Tambah.
- `organization.slug` dan `organization.code` tidak punya unique constraint.
- Nol tes untuk seluruh permukaan ini.

## Decisions so far

<!-- satu baris per tiket yang sudah ditutup -->

- [01 — Keadaan Struktur: Aktif, Non-Aktif, Terhapus](issues/01-keadaan-struktur.md)
  — Satu sumbu di domain, dua kolom di simpanan (`is_non_active` + `deleted_at`)
  dengan **Terhapus mendominasi**, dibaca lewat kolom `generatedAlwaysAs`;
  istilahnya berprefiks (Struktur Aktif/Non-Aktif/Terhapus) di bagian baru
  **Keadaan Struktur** di `CONTEXT.md`; **Terhapus = catatan yang keliru**,
  bukan pensiun, dan diperlakukan **seolah barisnya tidak pernah ada** (slug →
  404, tidak ada permukaan yang bilang "sudah dihapus", Root satu-satunya
  pengecualian); Non-Aktif → Terhapus boleh, pemulihan selalu berujung Aktif.
  Melahirkan **ADR 0004** (tidak ada hard delete, `code` dikunci selamanya) dan
  **ADR 0005** (satu sumbu, dua kolom).
- [02 — Matriks kewenangan Struktur](issues/02-matriks-kewenangan-struktur.md)
  — Tabel dikolapskan di atas enam aturan baca universal; BPK/Humas/Akun Kader
  **nol** di seluruh baris (matriks ini mengatur permukaan Struktur saja);
  Keadaan sasaran tidak mengubah kewenangan (pembekuan ada di **pelaku**, bukan
  sasaran); prasyarat hapus **bukan** kewenangan, jadi Root pun tunduk padanya;
  **`type` dan `parentId` beku setelah pembuatan** untuk semua Kewenangan —
  itulah yang memberi aksi hapus alasan hidupnya, dan itu menutup celah
  produksi `add-form/action.ts` secara konstruksi. Gate-nya satu fungsi murni
  (`canManageKestrukturan`) + dua gate async di
  `src/lib/auth/kestrukturan.ts`; `pulihkan` dan prasyarat sengaja di luar
  gate.
- [03 — Unique constraint di bawah soft delete](issues/03-unique-constraint-di-bawah-soft-delete.md)
  — **Partial unique index** `WHERE deleted_at IS NULL` untuk `slug`; dua
  saingannya gugur (`UNIQUE (slug, deleted_at)` NULLS DISTINCT bawaan **tidak
  menangkap apa pun** — jebakan yang rapi dan diam). Drizzle memancarkannya,
  diverifikasi dengan menjalankan `drizzle-kit generate`. **`CONCURRENTLY` tidak
  bisa dinyatakan sebagai migrasi Drizzle sama sekali** — runner-nya membungkus
  semuanya dalam satu transaksi
  (`drizzle-orm/pg-core/async/session.js:128`, diperiksa tangan). `code_slug`
  tidak dipasangi constraint (nol pembaca). Dua racun tersembunyi ikut
  terangkat: `drizzle-kit` **membuang `NOT NULL` dari kolom generated** yang
  ditambahkan lewat `ALTER TABLE`, dan **tiket 04 naik jadi penghalang keras** —
  migrasi constraint tidak boleh ditulis sebelum data duplikat diperiksa.
  Temuan lengkap: `research/03-unique-constraint.md`.
- [05 — Sinkronisasi keadaan Akun dengan keadaan Struktur](issues/05-sinkronisasi-keadaan-akun.md)
  — **Membatalkan ketetapan charting**: Keadaan Akun **turunan**, bukan kolom
  tersimpan, karena sesi sudah membawa Keadaan Struktur di tiap request. Nol
  kolom baru, nol jalur sapu, nol drift — bug yang tiket ini dibuat untuk
  menjaga jadi mustahil secara konstruksi. Gerbangnya di
  `readActiveSession`/`validateSession` (nol call-site baru, dan permukaan yang
  belum ditulis ikut terjaga); pintunya menutup di **request berikutnya**.
  **Jenjang PP tidak bisa dinonaktifkan** oleh siapa pun — larangan pada
  sasaran, bukan pengecualian pada Root. **Akun Kader tidak ikut mati**, hanya
  empat Akun kepengurusan. Pesan penolakan **generik untuk dua-duanya**
  (pilihan pengguna, bukan rekomendasi agen), sehingga kewajiban memberi tahu
  pindah ke dialog konfirmasi tiket 08. Mengamandemen tiket 01 (klausa
  `CONTEXT.md`) dan tiket 02 (baris Root × nonaktifkan).
- [06 — Pindah induk saat penonaktifan](issues/06-pindah-induk-saat-penonaktifan.md)
  — Judul berkasnya sudah lebih sempit dari isinya: pemindahan jadi **aksi
  berdiri sendiri**, dan **batas peta ikut digeser** (lihat Out of scope).
  Pemindahan mengubah **satu kolom** (`parentId`) dan nol baris lain. Riset ulang
  NIA membongkar invarian yang tidak pernah ditulis — **kode sebuah PK wajib
  memuat kode PD induknya**, dan `code` beku selamanya, jadi memindahkan PK
  memecahkan invarian itu permanen. Perbaikannya: NIA diturunkan dari **induk**
  untuk PK (dengan cadangan ke kode sendiri, supaya nol pendaftaran yang hari ini
  berhasil jadi gagal). Batasnya: **selalu di dalam satu PW**, hanya **BPW PP dan
  Root**, dan **nol sel baru di matriks tiket 02**. **PD tidak pindah antar-PW** —
  tidak ada versi pemindahan langsung yang menjaga NIA tetap jujur, jadi
  pemekaran ditangani lewat PD baru berkode benar. Hanya anak **Aktif** yang
  wajib pindah; yang Non-Aktif boleh ditinggal (diverifikasi tidak merusak
  penelusuran Cakupan). Aturan cermin: **menghidupkan anak menuntut induknya
  hidup**. `CONTEXT.md` diperbaiki — definisi Nomor Induk Anggota sebelumnya
  salah di dua tempat.

- [04 — Cek duplikat `code`/`slug` di data nyata](issues/04-cek-duplikat-code-slug-di-produksi.md)
  — **Pertanyaan aslinya tidak terjawab dan tidak akan pernah terjawab:** akses
  produksi ditolak sadar oleh pengguna, dan basis data pengganti masih kosong,
  jadi "nol duplikat" di sana benar secara teknis dan hampa secara makna.
  Tiketnya **berubah bentuk** — dari "lihat datanya sekali" jadi "putuskan
  bagaimana migrasinya berperilaku saat datanya tidak bisa dilihat". Yang
  dibeli: pemeriksaan pindah dari momen perencanaan ke **momen migrasi**, di
  mana ia tidak bisa basi. **Mengamandemen tiket 03**: 04 turun dari penghalang
  keras jadi penghalang **keterdugaan deploy** — migrasinya boleh ditulis
  sekarang, yang haram adalah menjalankannya tanpa pra-terbang, sebab kegagalan
  `CREATE UNIQUE INDEX` itu rollback bersih (nol baris berubah), bukan data
  rusak. Isi keputusannya ada di **asimetri `slug` vs `code`**: `slug` duplikat
  murah dan mekanis; `code` duplikat **tidak bisa diperbaiki sama sekali** tanpa
  melanggar ADR 0004 — jadi **dua migrasi terpisah**, supaya satu `code`
  duplikat tidak menyandera constraint `slug`. Koreksi faktual: `code` kembar
  **tidak** membuat NIA bentrok (deretnya dicari global per prefiks,
  `utils/member.ts:80`) — yang rusak adalah NIA berhenti **mengidentifikasi**
  Struktur. `check-duplicates.ts` naik status dari buangan jadi artefak; rumahnya
  `src/scripts/`, dipindahkan saat implementasi.

- [07 — Permukaan "Struktur Saya"](issues/07-permukaan-struktur-saya.md)
  — Namanya sendiri gugur: entri menunya jadi **`Profil <nama Struktur>`** yang
  dinamis ("Profil PW KAMMI NTB"), sebab "Struktur Saya" berdiri di sebelah
  "Akun Saya" dengan pola nama kembar padahal Akun ≠ Struktur, dan
  **"Kepengurusan" ternyata dicadangkan** untuk permukaan daftar pengurus (lihat
  Out of scope). Field beku **naik jadi blok identitas, bukan input mati** —
  input disabled terbaca "kamu kurang izin", padahal `code`/`type`/`parentId`
  beku untuk semua orang; hasilnya form berisi **tiga field yang semuanya
  hidup**. Isinya ditahan di identitas + form saja: halaman ini administrasi
  diri, bukan monitoring. Rutenya **`/dashboard/organization`** — `user/`
  menyatakan kepemilikan yang keliru, `branches/*` tertutup catch-all opsional.
  Gate titipan tiket 02 berbentuk: **tanpa argumen sasaran**, mengembalikan
  Strukturnya sendiri sehingga otorisasi dan pembacaan halaman jadi satu
  panggilan; BPH saja. Dua temuan ikut terangkat: seluruh halaman **nol query
  tambahan** karena sesi sudah membawa Struktur terhubung
  (`cte/user.ts:16-27`), dan **Keadaan tidak perlu ditampilkan sama sekali** —
  tiket 05 sudah memastikan halaman ini hanya pernah dirender untuk Struktur
  Aktif. Menyumbang satu celah ke tiket 08: **menyunting slug adalah momen
  tabrakan ketiga** yang tiket 03 tidak hitung.

- [08 — Permukaan hapus, nonaktifkan, dan pulihkan](issues/08-permukaan-hapus-nonaktif-pulihkan.md)
  — Aksinya **masuk ke `BranchManagementSheet` yang sudah ada**, bukan ke kartu;
  itu sekaligus membubarkan ongkos datanya (hitungan Kader/Daurah dibaca saat
  sheet dibuka untuk **satu** Struktur, bukan 12 kartu) dan memberi prasyarat
  ruang untuk ditulis sebagai kalimat utuh alih-alih tooltip pada item mati.
  **Ketik `code` untuk dua-duanya** — pengguna menolak usulan agen yang
  meringankan Hapus, demi konsistensi dengan `delete-member-button` yang sudah
  jadi preseden repo. Dialog Nonaktifkan memikul kewajiban tiket 05: sistem
  **tidak** memberi tahu Akun yang dimatikan, jadi yang menonaktifkan wajib
  memberi tahu di luar sistem. Struktur Non-Aktif **redup dan penelusurannya
  berhenti** — sempat terlihat menabrak `CONTEXT.md`, lalu **diperiksa di kode
  dan ternyata tidak**: `readDescendantMembers`/`readMemberAggregates`
  (`member.ts:459-463`) menelusuri subtree **tanpa filter Keadaan**, jadi Kader
  tetap teragregasi ke induknya; tiket 01 tidak dibuka ulang. Gate seluruh aksi
  jadi **satu bendera yang dihitung di server per baris**, menutup kebocoran
  `canManage` yang selama ini cuma menyembunyikan tombol Tambah. Melahirkan
  **tiket 12** (pemulihan Root) dan satu temuan yang tak diminta: **CTE Kader
  wajib menyaring Terhapus** begitu `deleted_at` mendarat — Non-Aktif tetap
  lolos, Terhapus tidak. (Letak persis kebocorannya **dikoreksi tiket 10**:
  hanya `readMemberAggregates` yang bocor, dan bukan karena Kader tersedot.)

- [10 — Nasib publikasi milik Struktur Terhapus](issues/10-nasib-publikasi-struktur-terhapus.md)
  — **Nol syarat keempat**, dan skemanya sendiri yang memutuskan: kolom **tanpa**
  `onDelete: 'cascade'` (`parent_id`, `member`, `training`) persis sama dengan
  daftar prasyarat hapus, sementara Artikel/Kategori/Pengaturan Situs/Akun
  bercascade — penulis skema aslinya sudah mengklasifikasi *cascade = ikut mati,
  tanpa cascade = wajib kosong*. Keempat cascade itu **dicabut** dan
  `deleteOrganization` **dihapus**, sehingga **ADR 0004 naik dari konvensi jadi
  jaminan skema**: `DELETE FROM organization` berubah dari sukses senyap yang
  ikut membawa Akun jadi `23503` dengan nol baris berubah. Penyembunyian
  ditetapkan sebagai **invarian menyeluruh, bukan tambalan per-tabel** — tiap
  pembacaan atas ketujuh referensi ke `organization` menyaring Terhapus dan
  **tidak** menyaring Non-Aktif, dengan `user` sebagai pengecualian sengaja
  (gerbangnya sudah di sesi, tiket 05). Temuan besar: **situs publik per-Struktur
  belum ada sama sekali** — `(main)` di-hardwire ke PP, `proxy.ts` cuma
  `/dashboard/:path*`, `/berita` masih stub, jadi nol Artikel siapa pun terbaca
  publik dan satu-satunya pemilik situs publik adalah PP yang tak bisa
  dinonaktifkan. Klausa "artikelnya ikut 404" tetap berdiri sebagai invarian yang
  diwarisi, bukan permukaan yang dirancang di sini. Mengoreksi tiket 08 soal
  letak kebocoran CTE.

- [11 — Permukaan pindah induk](issues/11-permukaan-pindah-induk.md)
  — **Mengamandemen tiket 06**: rumusan "dalam PW yang sama" ternyata cuma
  **proxy** untuk invarian aslinya — **`pwCode` hasil penurunan NIA tidak boleh
  berubah**. Identik untuk PK di bawah PD, tapi rumusan lama **tidak terdefinisi
  untuk PK di bawah PDLN** (`pwCode = 99`, nol PW) dan **meloloskan penyeberangan
  terselubung** PDLN → PW yang justru kebohongan permanen yang 06 tolak. Rumusan
  baru menutup dua-duanya tanpa aturan khusus. Pemilihan PW **dihapus** — ia
  sepenuhnya ditentukan Struktur yang dipindah, jadi ia konteks mati, bukan
  pilihan. Alurnya **pindah satuan + satu pintasan "pindahkan semua ke PW"** di
  penolakan penonaktifan; pintasan itu dipilih karena **tidak pernah bisa gagal**
  dan sifatnya **penitipan, bukan penempatan**. Duduk di **tier sendiri di sheet,
  di atas Zona Berbahaya** — tidak merusak, bisa dibalik. Gerbangnya
  **ketik `code`, sama berat** dengan dua aksi destruktif (pilihan pengguna,
  menolak usulan agen soal kelas ketiga), dan konsekuensi yang lahir dari situ
  diputus di sini: **pintasan massal = satu aksi = satu gerbang**, yang diketik
  `code` PD sumbernya sekali, bukan lima kode anak. Satu keadaan kosong yang
  nyata: PK di bawah PDLN tunggal. **Nol sel baru di matriks tiket 02.**

- [12 — Permukaan melihat dan memulihkan Struktur Terhapus](issues/12-permukaan-root-pulihkan.md)
  — Menutup **lubang yang tak satu pun tiket pernah tutup**: apakah anak Terhapus
  menghitung untuk prasyarat "nol anak" induknya. **Tidak menghitung** — konsisten
  dengan tiket 01, dan menghindari jebakan yang sama yang tiket 10 tolak untuk
  Artikel. Harganya dibayar sadar: **rantai Terhapus-di-bawah-Terhapus jadi
  mungkin**, dan permukaan ini yang menanganinya. Permukaannya **berdiri sendiri**,
  bukan filter di `branches` — sebab invarian tiket 10 paling aman dijaga oleh
  tepat **satu** fungsi baca yang sengaja terbalik, dan filter berbasis peran
  justru melubanginya di halaman tersibuk. Konsekuensi menyenangkan: **Keadaan
  jadi permukaannya**, jadi nol bahasa visual baru untuk membedakannya dari
  Non-Aktif. **Pelakunya diperlebar jadi Root + BPW PP** (pilihan pengguna) —
  bukan pelonggaran melainkan **perbaikan asimetri**, karena matriks tiket 02
  sudah memberi BPW PP hak hapus sehingga hak batalnya tertinggal; gate-nya
  **bukan** `role === 'bpw'` melainkan BPW yang Struktur terhubungnya PP.
  Mengamandemen **tiket 01, tiket 02, dan `CONTEXT.md`**. Tabrakan slug
  diselesaikan **cek saat dibuka lalu eskalasi jadi form**, dengan galat server
  tetap mendarat di field slug — **pola yang sama persis dengan tiket 07**.
  Pemulihan berantai otomatis **ditolak**; penolakan menyebut langkah berikutnya
  dan menautkan induknya.

## Not yet specified

- **Bentuk tesnya.** Belum ada satu pun tes untuk permukaan ini. Tiket 02 sudah
  memberi lapis pertamanya: `canManageKestrukturan` itu fungsi murni, jadi
  matriksnya dites sebagai tabel argumen-ke-hasil tanpa fixture. Yang masih
  kabur adalah lapis sisanya — tes seam untuk dua gate async (pola
  `lib/auth/kekaderan.test.ts`), tes transisi Keadaan, dan tes prasyarat hapus.
  Berapa lapis dan di seam mana belum bisa dijawab sebelum 05, 06, dan 08
  memberi tahu berapa permukaan yang sebenarnya ada. Satu ganjalan konkret
  ditemukan tiket 03: `.github/workflows/ci.yml` memakai `postgres:16`
  sementara migrasi dasarnya memanggil `uuidv7()` yang butuh PG 18+. Dua-duanya
  tidak bisa benar, dan selama itu belum diluruskan, migrasi peta ini tidak bisa
  diuji di CI. Tiket 06 menambah satu permukaan tak tertes lagi: **nol tes**
  untuk seluruh mekanisme NIA, padahal 06 mengubah cara penurunannya di **dua**
  tempat sekaligus.
- **Gladi bersih migrasi.** Sebagian sudah terjawab di luar peta: seluruh migrasi
  yang ada hari ini **sudah dijalankan dari nol sampai bersih** di basis data
  staging kosong itu, dan **servernya PG 18+** — `uuidv7()` jalan, jadi ganjalan
  CI `postgres:16` di butir sebelumnya terbukti soal CI-nya, bukan soal
  migrasinya. Seluruh 199 tes repo juga hijau terhadapnya. Yang belum: gladi
  untuk migrasi yang **lahir dari peta ini** — kolom `deleted_at`, kolom Keadaan
  `generatedAlwaysAs` beserta `SET NOT NULL` tangannya, partial unique index, dan
  pencabutan cascade. Belum bisa dijadikan tiket sebelum tiket 09 menetapkan
  migrasi apa saja yang sebenarnya dipecah.

## Out of scope

- ~~**Pindah induk secara umum**~~ — **DICABUT oleh tiket 06.** Pemindahan
  diputuskan jadi aksi berdiri sendiri, dan tombol berdiri sendiri _adalah_
  fitur umum itu. Sekarang **di dalam cakupan**, dengan batas: selalu di dalam
  satu PW, hanya BPW PP dan Root. Permukaannya jadi tiket 11.
- **Memindahkan Kader antar-Struktur** — muncul dari tiket 06 sebagai
  satu-satunya jalan menuntaskan pemekaran daerah, tapi ia operasi atas
  **Kader**, bukan atas Struktur. Menyeret pertanyaan yang tidak satu pun tiket
  di sini menyentuh: apakah Nomor Induk ikut berubah, apakah riwayat Daurah
  ikut, siapa yang berwenang. Layak petanya sendiri.
- **Tembok 1000 di penomoran NIA** — ditemukan saat riset tiket 06. Nomor urut
  di-`padStart(3)` sementara urutannya dicari dengan `orderBy(desc())` pada
  kolom teks, jadi begitu tembus `1000` teks `'999'` masih menang dan `nextSeq`
  mengulang selamanya. Per PW+PD+tahun, ditangkap `user.name` yang unique
  sehingga gagal berisik, bukan diam. Bug nyata di produksi, tapi soal
  **kekaderan**, bukan CRUD Struktur.
- **Situs publik per-Struktur** — ditemukan tiket 10 **belum ada sama sekali**:
  `(main)` di-hardwire ke PP, nol perutean per-tenant, `/berita` masih stub.
  Ketetapan charting "situs publiknya mati total, artikelnya ikut 404" tetap
  berdiri sebagai **invarian yang diwarisi** lewat aturan lapisan baca tiket 10 —
  tapi membangun permukaannya adalah fitur tersendiri, bukan CRUD Struktur.
- **Permukaan daftar pengurus** — muncul dari tiket 07 saat menolak nama menu
  "Kepengurusan": istilah itu **dicadangkan** untuk permukaan yang menampilkan
  siapa saja pengurus sebuah Struktur, dan permukaan itu belum dibangun. Ia soal
  **orang**, bukan CRUD Struktur, jadi ia di luar cakupan peta ini. Yang mengikat
  dari sini cuma satu: **jangan pakai kata "Kepengurusan" untuk menamai apa pun
  yang lain.**
- **Membekukan satu Akun terlepas dari Strukturnya** — konsekuensi sadar dari
  keputusan keadaan Akun. Itu konsep berbeda, bukan bagian peta ini.
- **Memecah peran `bpw` jadi tiga nilai enum** (`bpw`/`bpd`/`bpkom`) — ditolak
  di charting. Jenjang sudah tersimpan di Struktur yang terhubung, jadi
  informasinya tidak perlu diduplikasi, dan menambah nilai enum di basis data
  produksi itu migrasi berisiko tanpa imbalan.
